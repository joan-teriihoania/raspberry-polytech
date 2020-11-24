import time
import os

def play(filepath):
    os.system('sudo mpg123 "' + filepath + '" >> /dev/null 2>&1')