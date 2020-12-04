import time
import os
import threading

# @Desc Play the soundfile passed (mp3) in the speaker at set volume
# @Params:
#   - filepath (String): Path to the file to play
#   - blocking (bool): If we wait for the file to finish playing before returning
#   - volume (int): Percentage of volume considering the max of the speakers (DEFAULT 200)
# @Return Void
def play(filepath, blocking=True, volume=100):
    factor = (volume/100)*32768
    cmd = 'sudo mpg123 -f '+str(factor)+' "' + filepath + '" >> /dev/null 2>&1'
    if(blocking):
        os.system(cmd)
    else:
        t = threading.Thread(target=os.system, args=(cmd,))
        t.start()