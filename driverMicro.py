from sys import byteorder
from array import array
from struct import pack
from ctypes import *
import driverI2C
import driverSpeaker

import os
import pyaudio
import core
import wave


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
p = pyaudio.PyAudio()
asound.snd_lib_error_set_handler(None)


#################################
# DEVICE VERIFICATION
#################################

dev_index = 0 # device index found by p.get_device_info_by_index(ii)
dev_found = False
listOfAcceptedDevices = [
    "USB PnP Sound Device: Audio (hw:1,0)"
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

THRESHOLD = 500
nbRefreshPerSecond = 5 # High refresh may cause data loss due to the microphone buffer overflowing. RECOMMEND 2..3 (will automatically adjust)
FORMAT = pyaudio.paInt16
RATE = int(p.get_device_info_by_index(dev_index)['defaultSampleRate'])
soundBarLength = 50
soundBarMax = THRESHOLD*3
soundBarMin = 0
soundBarFillChar = "#"
soundBarEmptyChar = "_"
REFRESH_PER_SEC_CORRECTION = 0
nb_overflowed = 0


def is_silent(snd_data):
    "Returns 'True' if below the 'silent' threshold"
    return max(snd_data) < THRESHOLD

def normalize(snd_data):
    "Average the volume out"
    MAXIMUM = 16384
    times = float(MAXIMUM)/max(abs(i) for i in snd_data)

    r = array('h')
    for i in snd_data:
        r.append(int(i*times))
    return r

def trim(snd_data):
    "Trim the blank spots at the start and end"
    def _trim(snd_data):
        snd_started = False
        r = array('h')

        for i in snd_data:
            if not snd_started and abs(i)>THRESHOLD:
                snd_started = True
                r.append(i)

            elif snd_started:
                r.append(i)
        return r

    # Trim to the left
    snd_data = _trim(snd_data)

    # Trim to the right
    snd_data.reverse()
    snd_data = _trim(snd_data)
    snd_data.reverse()
    return snd_data

def add_silence(snd_data, seconds):
    "Add silence to the start and end of 'snd_data' of length 'seconds' (float)"
    silence = [0] * int(seconds * RATE)
    r = array('h', silence)
    r.extend(snd_data)
    r.extend(silence)
    return r

def get_soundbar(snd_data):
    soundLevel = max(snd_data)-soundBarMin
    soundBarLengthBelowThresh = 0
    
    if(soundLevel < 0):
        soundLevel = 0
    if(soundLevel > soundBarMax):
        soundLevel = soundBarMax
    if(soundBarMin < THRESHOLD):
        soundBarLengthBelowThresh = int((THRESHOLD-soundBarMin)/soundBarMax*soundBarLength)

    soundBarFilled = int(soundLevel/soundBarMax*soundBarLength)
    soundbarFilledBelowThresh = soundBarLengthBelowThresh
    soundbarNotFilledBelowThresh = 0

    if(soundBarFilled < soundBarLengthBelowThresh):
        soundbarFilledBelowThresh = soundBarFilled
        soundbarNotFilledBelowThresh = soundBarLengthBelowThresh - soundBarFilled

    soundBarFilledOverThresh = soundBarFilled - soundbarFilledBelowThresh
    soundBarNotFilledOverThresh = soundBarLength - soundbarNotFilledBelowThresh - soundBarFilledOverThresh - soundbarFilledBelowThresh

    return core.bcolors.WARNING + soundBarFillChar*soundbarFilledBelowThresh + soundBarEmptyChar*soundbarNotFilledBelowThresh +  "|" + soundBarFillChar*soundBarFilledOverThresh + soundBarEmptyChar*soundBarNotFilledOverThresh + core.bcolors.OKCYAN

def record():
    """
    Record a word or words from the microphone and 
    return the data as an array of signed shorts.

    Normalizes the audio, trims silence from the 
    start and end, and pads with 0.5 seconds of 
    blank sound to make sure VLC et al can play 
    it without getting chopped off.
    """

    global REFRESH_PER_SEC_CORRECTION
    global nb_overflowed

    APPLIED_CHUNK_SIZE = int(RATE/(nbRefreshPerSecond-REFRESH_PER_SEC_CORRECTION))

    asound.snd_lib_error_set_handler(c_error_handler)
    p = pyaudio.PyAudio()
    asound.snd_lib_error_set_handler(None)
    

    stream = p.open(format=FORMAT, channels=1, rate=RATE,
        input=True, input_device_index=dev_index,
        frames_per_buffer=APPLIED_CHUNK_SIZE)

    timeoutSilence = nbRefreshPerSecond*3
    frames = []
    num_silent = 0
    exceptionOnOverflow = True
    snd_started = False
    r = array('h')

    driverI2C.display("Say something !")
    print()

    while 1:
        streamRead = False
        try:
            streamRead = stream.read(APPLIED_CHUNK_SIZE, exception_on_overflow = exceptionOnOverflow)
        except OSError:
            if(nb_overflowed == 0):
                core.overecho("MicRead(InputOverflowed) : (CHUNK="+str(APPLIED_CHUNK_SIZE)+")", "ERROR")
                core.echo([
                    "The microphone buffer has exceeded specified CHUNK_SIZE due to high [nbRefreshSecond]", 
                    "You should consider lowering it to avoid data loss. It will be automatically decreased",
                    "during execution until there is no more input overflow."
                ], "WARN")
                print()
            else:
                if(REFRESH_PER_SEC_CORRECTION < nbRefreshPerSecond-1):
                    REFRESH_PER_SEC_CORRECTION += 1
                    APPLIED_CHUNK_SIZE = int(RATE/(nbRefreshPerSecond-REFRESH_PER_SEC_CORRECTION))
                    p.close(stream)
                    stream = p.open(format=FORMAT, channels=1, rate=RATE,
                        input=True, input_device_index=dev_index,
                        frames_per_buffer=APPLIED_CHUNK_SIZE)
                    core.overecho("MicRead(InputOverflowed) : [nbRefreshPerSecond] have been automatically decreased to "+str(nbRefreshPerSecond - REFRESH_PER_SEC_CORRECTION)+" (CHUNK="+str(APPLIED_CHUNK_SIZE)+")", "WARN")
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
        r.extend(snd_data)

        silent = is_silent(snd_data)
        soundBar = get_soundbar(snd_data)

        if(snd_started):
            recordingStatus = core.bcolors.OKGREEN + "RECORDING" + core.bcolors.OKCYAN
        else:
            recordingStatus = core.bcolors.FAIL + "NOT RECORDING" + core.bcolors.OKCYAN
        
        core.overecho("Sound : ["+soundBar+"] ("+recordingStatus+")")

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
            driverI2C.display("I am listening")
            snd_started = True
        
        if snd_started and num_silent > timeoutSilence:
            core.overecho("Recording complete", "SUCCESS")
            driverI2C.display("Please wait...")
            break

    core.echo("Saving into file...")
    sample_width = p.get_sample_size(FORMAT)


    stream.stop_stream()
    stream.close()
    p.terminate()

    #r = normalize(r)
    #r = trim(r)
    #r = add_silence(r, 0.5)
    core.overecho("Saving into file..." + core.done)
    return sample_width, frames

def record_to_file(path):
    "Records from the microphone and outputs the resulting data to 'path'"
    sample_width, frames = record()
    #data = pack('<' + ('h'*len(data)), *data)

    wf = wave.open(path, 'wb')
    wf.setnchannels(1)
    wf.setsampwidth(sample_width)
    wf.setframerate(RATE)
    wf.writeframes(b''.join(frames))
    wf.close()

def listen(filepath='ressources/test1.wav'):
    #if(core.fileExists(filepath)):
    #    os.unlink(filepath)

    record_to_file(filepath)
    return core.fileExists(filepath)