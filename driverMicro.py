from sys import byteorder
from array import array
from struct import pack
from ctypes import *
import driverI2C

import os
import pyaudio
import core
import wave




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


THRESHOLD = 500
CHUNK_SIZE = 4096
FORMAT = pyaudio.paInt16
RATE = 44100



dev_index = 0 # device index found by p.get_device_info_by_index(ii)
nameOfMicro = "USB PnP Sound Device: Audio (hw:1,0)"
listOfDevices = []

core.echo("Retrieving audio capable devices...")
for ii in range(p.get_device_count()):
    listOfDevices.append(p.get_device_info_by_index(ii).get('name'))
core.overecho("Retrieving audio capable devices..." + core.done)

ii = 0
core.echo("Searching for default device ["+nameOfMicro+"]...")
for device in listOfDevices:
    if(device == nameOfMicro):
        dev_index = ii
    ii += 1
core.overecho("Searching for default device ["+nameOfMicro+"]..." + core.done)
core.echo([
    "Default device name : " + nameOfMicro,
    "Device selected     : ("+str(dev_index)+") " + p.get_device_info_by_index(dev_index).get('name')
], tab="")





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

def record():
    """
    Record a word or words from the microphone and 
    return the data as an array of signed shorts.

    Normalizes the audio, trims silence from the 
    start and end, and pads with 0.5 seconds of 
    blank sound to make sure VLC et al can play 
    it without getting chopped off.
    """
    
    stream = p.open(format=FORMAT, channels=1, rate=RATE,
        input=True, input_device_index = dev_index,
        frames_per_buffer=CHUNK_SIZE)

    num_silent = 0
    snd_started = False

    r = array('h')

    driverI2C.display("Dites quelque chose !")  
    core.echo("Awaiting for sound...")

    try:
        while 1:
            # little endian, signed short
            snd_data = array('h', stream.read(CHUNK_SIZE, exception_on_overflow = False))
            if byteorder == 'big':
                snd_data.byteswap()
            r.extend(snd_data)

            silent = is_silent(snd_data)
            #core.echo(str(silent))

            if silent and snd_started:
                num_silent += 1
            elif not silent and not snd_started:
                driverI2C.display("En écoute...")
                core.overecho("Awaiting for sound..." + core.done)
                core.echo("Awaiting for silence...")
                snd_started = True

            if snd_started and num_silent > 30:
                driverI2C.display("Traitement...")
                core.overecho("Awaiting for silence..." + core.done)
                break
    except KeyboardInterrupt:
        core.echo("User has requested to stop the recording", "ERROR")

    core.echo("Saving into file...")
    sample_width = p.get_sample_size(FORMAT)
    stream.stop_stream()
    stream.close()
    p.terminate()

    r = normalize(r)
    r = trim(r)
    r = add_silence(r, 0.5)
    core.overecho("Saving into file..." + core.done)
    return sample_width, r

def record_to_file(path):
    "Records from the microphone and outputs the resulting data to 'path'"
    sample_width, data = record()
    data = pack('<' + ('h'*len(data)), *data)

    wf = wave.open(path, 'wb')
    wf.setnchannels(1)
    wf.setsampwidth(sample_width)
    wf.setframerate(RATE)
    wf.writeframes(data)
    wf.close()

def listen(filepath='ressources/test1.wav'):
    if(core.fileExists(filepath)):
        os.unlink(filepath)

    record_to_file(filepath)
    return core.fileExists(filepath)