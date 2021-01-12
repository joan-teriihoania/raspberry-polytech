from sys import byteorder
from array import array
from struct import pack
from ctypes import *
import driverI2C
import driverSpeaker
import threading
import translater

import os
import pyaudio
import audio
import core
import wave
import time


#################################
# CONVENTION
#################################
# A function that starts with _ is an internal function and should not be used outside
# A function that starts with __ is an internal function and MUST not be used outside

#################################
# PYAUDIO INIT WITH LOG HIDER
#################################

# From alsa-lib Git 3fd4ab9be0db7c7430ebd258f2717a976381715d
# $ grep -rn snd_lib_error_handler_t
# include/error.h:59:typedef void (*snd_lib_error_handler_t)(const char *file, int line, const char *function, int err, const char *fmt, ...) /* __attribute__ ((format (printf, 5, 6))) */;
# Define our error handler type
ERROR_HANDLER_FUNC = CFUNCTYPE(None, c_char_p, c_int, c_char_p, c_int, c_char_p)
def py_error_handler(filename, line, function, err, fmt):
  #print ('messages are yummy')
  return

c_error_handler = ERROR_HANDLER_FUNC(py_error_handler)
asound = cdll.LoadLibrary('libasound.so')

asound.snd_lib_error_set_handler(c_error_handler)
p = pyaudio.PyAudio() # ici
asound.snd_lib_error_set_handler(None)


#################################
# DEVICE VERIFICATION
#################################

dev_index = 0 # device index found by p.get_device_info_by_index(ii)
dev_found = False
listOfAcceptedDevices = [
    "USB PnP Sound Device: Audio (hw:1,0)",
]
listOfDevices = []

core.echo("Retrieving audio capable devices...")
for ii in range(p.get_device_count()):
    listOfDevices.append(p.get_device_info_by_index(ii).get('name'))
core.overecho("Retrieving audio capable devices..." + core.done)

ii = 0
core.echo("Searching for accepted devices...")
for device in listOfDevices:
    if(device in listOfAcceptedDevices):
        dev_index = ii
        dev_found = True
    ii += 1
if(dev_found):
    core.overecho("Searching for default device..." + core.done)
    core.echo(":: Device selected >> " + listOfDevices[dev_index])
else:
    core.overecho("Searching for default device..." + core.failed)
    core.echo([
        "Could not find a connected device which is in the accepted devices list",
        "Check if one of them is connected or that the devices accepted are correct",
    ], "FATAL", tab="")

    core.echo("List of connected devices : ", "FATAL")
    for device in listOfDevices:
        core.echo(" - " + device, "FATAL")
    core.echo("List of accepted devices : ", "FATAL")
    for device in listOfAcceptedDevices:
        core.echo(" - " + device, "FATAL")

    core.terminate(-1)



#################################
# BASIC CONFIGURATION VARIABLES
#################################

THRESHOLD = 500 # Base value to detect if there is silence or not
STABILIZED_THRESHOLD = THRESHOLD # Value that is corrected permanently depending on the environment to detect the silence level

nbRefreshPerSecond = 30 # High refresh may cause data loss due to the microphone buffer overflowing. RECOMMEND 2..3 (will automatically adjust)
REFRESH_PER_SEC_CORRECTION = 0
CORRECTED_REFRESH_PER_SEC = nbRefreshPerSecond - REFRESH_PER_SEC_CORRECTION

FORMAT = pyaudio.paInt16
RATE = int(p.get_device_info_by_index(dev_index)['defaultSampleRate'])
soundBarLength = 50
soundBarMax = STABILIZED_THRESHOLD*3
soundBarMin = 0
soundBarFillChar = "#"
soundBarEmptyChar = "_"
nb_overflowed = 0

def _is_silent(snd_data):
    "Returns 'True' if below the 'silent' threshold"
    return max(snd_data) < STABILIZED_THRESHOLD

# @Desc Returns a string of the sound to be displayed from the given sound data
# @Params:
#   - snd_data (Array): An array as following Array('h', <Stream data>)
#
# @Note Uses the basic configuration variables set at the top to format the soundbar
# @Return String
def _get_soundbar(snd_data):
    global listeningSoundLevel

    soundLevel = max(snd_data)-soundBarMin
    listeningSoundLevel = soundLevel
    soundBarLengthBelowThresh = 0
    
    if(soundLevel < 0):
        soundLevel = 0
    if(soundLevel > soundBarMax):
        soundLevel = soundBarMax
    if(soundBarMin < STABILIZED_THRESHOLD):
        soundBarLengthBelowThresh = int((STABILIZED_THRESHOLD-soundBarMin)/soundBarMax*soundBarLength)

    soundBarFilled = int(soundLevel/soundBarMax*soundBarLength)
    soundbarFilledBelowThresh = soundBarLengthBelowThresh
    soundbarNotFilledBelowThresh = 0

    if(soundBarFilled < soundBarLengthBelowThresh):
        soundbarFilledBelowThresh = soundBarFilled
        soundbarNotFilledBelowThresh = soundBarLengthBelowThresh - soundBarFilled

    soundBarFilledOverThresh = soundBarFilled - soundbarFilledBelowThresh
    soundBarNotFilledOverThresh = soundBarLength - soundbarNotFilledBelowThresh - soundBarFilledOverThresh - soundbarFilledBelowThresh

    return (
        core.bcolors.WARNING +
        soundBarFillChar*soundbarFilledBelowThresh +
        soundBarEmptyChar*soundbarNotFilledBelowThresh + 
        "|" + soundBarFillChar*soundBarFilledOverThresh +
        soundBarEmptyChar*soundBarNotFilledOverThresh +
        core.bcolors.OKCYAN
    )

# @Desc Displays the soundbar when listening for a user sound input
# @Note This function is running on another thread to avoid blocking execution
#       It is changed by using the shared variable listening to toggle
#       and listeningSoundLevel to update the sound to be displayed
#
#       It will shutdown itself when core.shutdown is set to TRUE
listening = False
listeningSoundLevel = 0
def __listeningAnimation():
    global listening
    refreshTick = 0.05
    changeColorEvery = 0.5
    colorChangeTick = (changeColorEvery/refreshTick)
    colors = ['red', 'yellow', 'green', 'aqua', 'blue', 'pink']

    while not core.shutdown:
        tick = 0
        colIndex = 0
        while listening and not core.shutdown:
            bar = int(listeningSoundLevel / soundBarMax * driverI2C.windowSize)
            empty = driverI2C.windowSize - bar
            if(tick == colorChangeTick):
                colIndex += 1
                tick = 0
                if(colIndex >= len(colors)):
                    colIndex = 0
                driverI2C.setColor(colors[colIndex])
            driverI2C.setText("#"*bar + "\n" + " "*empty + "#"*bar, instant=True)
            time.sleep(refreshTick)
            tick += 1
        time.sleep(1)

# Runs the function __listeningAnimation() on another thread at startup
t = threading.Thread(target=__listeningAnimation)
t.start()

# @Desc Sends to the user a visual and sound to request a sound input
# @Note Plays a notification sound specified and turns on/off the listening animation
def toggleListeningAnimation():
    global listening
    listening = not(listening)
    if(listening): driverSpeaker.play("/home/jopro/raspberry-polytech/ressources/notif_listening.mp3", blocking=False)
    else: driverSpeaker.play("/home/jopro/raspberry-polytech/ressources/notif_listened.mp3", blocking=False)
    return listening

def disableListeningAnimation():
    global listening
    listening = False

def enableListeningAnimation():
    global listening
    listening = False


# @Desc Edit the STABILIZED_THRESHOLD to the ambient sound level of estimated silence threshold
# @Param:
#   - frames (Array): An array of stream.read data collected
# @Note Will loop only through the frames to a maximum of CORRECTED_REFRESH_PER_SEC
def _stabilize_threshold(frames):
    global THRESHOLD
    global CORRECTED_REFRESH_PER_SEC
    global STABILIZED_THRESHOLD
    global soundBarMax

    if(len(frames) == 0): return
    snd_min = max(array('h', frames[0])) # get sound level of first frame
    snd_max = 0

    for i in range(1, min(CORRECTED_REFRESH_PER_SEC, len(frames))):
        frame = frames[i]
        snd_lvl = max(array('h', frame))

        if(snd_lvl > snd_max):
            snd_max = snd_lvl
        if(snd_lvl < snd_min):
            snd_min = snd_lvl
    
    if(snd_max == 0): return
    targetThreshold = min(max(int(snd_max*2), 200), 500)
    if((snd_max - snd_min) <= 100 and targetThreshold != STABILIZED_THRESHOLD):
        # Sound is stable and steady and considered silent
        soundBarMax = STABILIZED_THRESHOLD*3
        STABILIZED_THRESHOLD = targetThreshold
        #core.overecho("MicRead(SilenceThresholdCorrection) : Threshold for silence detection have been corrected to " + str(STABILIZED_THRESHOLD), "WARN")
        #print()
    return

def _record(waitNSecondSilence, auto_silence_threshold_stabilization=True):
    """
    Wait for when the ambient sound level exceeds the silence threshold
    while updating the latter if not recording.
    The starts the recording and wait for silence and returns the frames
    recorded.

    Will automatically adjust some sensible variables
    """

    global REFRESH_PER_SEC_CORRECTION
    global CORRECTED_REFRESH_PER_SEC
    global STABILIZED_THRESHOLD
    global nb_overflowed

    CORRECTED_REFRESH_PER_SEC = nbRefreshPerSecond-REFRESH_PER_SEC_CORRECTION
    APPLIED_CHUNK_SIZE = int(RATE/(CORRECTED_REFRESH_PER_SEC))

    asound.snd_lib_error_set_handler(c_error_handler)
    p = pyaudio.PyAudio()
    asound.snd_lib_error_set_handler(None)
    

    stream = p.open(format=FORMAT, channels=1, rate=RATE,
        input=True, input_device_index=dev_index,
        frames_per_buffer=APPLIED_CHUNK_SIZE)

    timeoutSilence = CORRECTED_REFRESH_PER_SEC*waitNSecondSilence
    frames = []
    num_silent = 0
    exceptionOnOverflow = True
    snd_started = False
    tickSinceLastThresholdRefresh = 0

    print()
    while 1:
        streamRead = False
        try:
            streamRead = stream.read(APPLIED_CHUNK_SIZE, exception_on_overflow = exceptionOnOverflow)
        except OSError: # In case of nbRefreshPerSecond too high
            if(nb_overflowed == 0):
                core.overecho("MicRead(InputOverflowed) : (CHUNK="+str(APPLIED_CHUNK_SIZE)+")", "ERROR")
                core.echo([
                    "The microphone buffer has exceeded specified CHUNK_SIZE due to high [nbRefreshPerSecond]", 
                    "You should consider lowering it to avoid data loss. It will be automatically decreased",
                    "during execution until there is no more input overflow."
                ], "WARN")
                print()
            else:
                if(REFRESH_PER_SEC_CORRECTION < nbRefreshPerSecond-1):
                    REFRESH_PER_SEC_CORRECTION += 1
                    CORRECTED_REFRESH_PER_SEC = nbRefreshPerSecond-REFRESH_PER_SEC_CORRECTION
                    APPLIED_CHUNK_SIZE = int(RATE/CORRECTED_REFRESH_PER_SEC)
                    p.close(stream)
                    stream = p.open(format=FORMAT, channels=1, rate=RATE,
                        input=True, input_device_index=dev_index,
                        frames_per_buffer=APPLIED_CHUNK_SIZE)
                    core.overecho("MicRead(InputOverflowed) : [nbRefreshPerSecond] have been automatically decreased to "+str(CORRECTED_REFRESH_PER_SEC)+" (CHUNK="+str(APPLIED_CHUNK_SIZE)+")", "WARN")
                    print()
                else:
                    core.overecho("[nbRefreshPerSecond] have been decreased by "+str(REFRESH_PER_SEC_CORRECTION)+" (CHUNK="+str(APPLIED_CHUNK_SIZE)+") and cannot be decreased further", "ERROR")
                    core.echo([
                        "Input overflow exceptions cannot be resolved and will most certainly cause data loss in recording",
                        "This is probably caused by performance issues, try rebooting raspberry and checking running processes",
                        "If this does not fix this issue, consider checking your microphone software and hardware"
                    ], "WARN")
                    core.terminate(-2)
                nb_overflowed = 0
            nb_overflowed += 1
            continue
        
        snd_data = array('h', streamRead)
        if byteorder == 'big':
            snd_data.byteswap()

        silent = _is_silent(snd_data)
        soundBar = _get_soundbar(snd_data)


        if(snd_started):
            recordingStatus = core.bcolors.OKGREEN + "RECORDING" + core.bcolors.OKCYAN
        else:
            recordingStatus = core.bcolors.FAIL + "NOT RECORDING" + core.bcolors.OKCYAN
        if(auto_silence_threshold_stabilization):
            _stabilize_threshold(frames)

        
        core.overecho(
            "Sound : ["+soundBar+"] ("+recordingStatus+") "+
            "C="+str(APPLIED_CHUNK_SIZE)+
            ", R="+str(CORRECTED_REFRESH_PER_SEC)+
            ", S=" + str(STABILIZED_THRESHOLD)+
            ", L=" + str(max(snd_data))
        )

        if snd_started:
            # Waiting for silence
            frames.append(streamRead)
        else:
            # Recording - Waiting for sound but still recording to not miss
            # to first part of the recording
            if(len(frames) > timeoutSilence):
                frames.pop(0)
            frames.append(streamRead)
        
        if not silent and snd_started:
            num_silent = 0

        if silent and snd_started:
            num_silent += 1
        
        if not silent and not snd_started:
            # RECORD START
            if not(listening):
                driverI2C.setColor("green")
            snd_started = True
        
        if snd_started and num_silent > timeoutSilence:
            # RECORD STOP
            if not(listening):
                driverI2C.setColor("white")
            core.deletePrevLines()
            break

    sample_width = p.get_sample_size(FORMAT)
    stream.stop_stream()
    stream.close()
    p.terminate()

    #r = normalize(r)
    #r = trim(r)
    #r = add_silence(r, 0.5)
    return sample_width, frames

def _record_to_file(path, waitNSecondSilence=2):
    "Records from the microphone and outputs the resulting data to 'path'"
    sample_width, frames = _record(waitNSecondSilence=waitNSecondSilence)
    #data = pack('<' + ('h'*len(data)), *data)

    wf = wave.open(path, 'wb')
    wf.setnchannels(1)
    wf.setsampwidth(sample_width)
    wf.setframerate(RATE)
    wf.writeframes(b''.join(frames))
    wf.close()

# @Desc Listens the microphone for sound and record it then saves it in the specified file and returns
# @Params:
#   - filepath (String): Path to the destination file of the audio (must be .wav)
#   - waitTriggerWords (bool): If we wait for the user to say the triggerWords
#   - triggerWords (String): The trigger words that will start a recording
#   - from_lang (String): The language from which the user is speaking
# @Return If the output file has been generated or not
def listen(filepath='/home/jopro/raspberry-polytech/ressources/microphone_input.wav', waitTriggerWords=True, triggerWords="Translate", from_lang="en"):
    if(core.fileExists(filepath)):
        os.unlink(filepath)

    if(waitTriggerWords):
        #triggerWords = translater.translate(triggerWords, to_lang=from_lang)
        driverI2C.display("Say \"" + triggerWords + "\"")
        while True:
            _record_to_file(filepath, waitNSecondSilence=1)
            trad = audio.speechToText(filepath, from_lang)
            if(trad != False and trad.lower() == triggerWords.lower()):
                break
        
    toggleListeningAnimation()
    _record_to_file(filepath)
    toggleListeningAnimation()
    driverI2C.setColor("white")
    return core.fileExists(filepath)