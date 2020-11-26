# coding: utf-8

import translater
import audio
import traceback
import sys
import core
import driverI2C
import driverSpeaker
import driverMicro
import time

commands = {
    "shutdown": {
        "code": 0,
        "message": "Shutting process down"
    },
    "reboot": {
        "code": None,
        "message": "Rebooting process"
    }
}

exitCodes = {
    0: "Good bye!",
    -1: "An error occured during execution and caused a system crash",
    1: "Translation memory usage has exceeded daily quota"
}

systemLanguage = "en"


def main(from_lang='en', to_lang='fr'):
    driverI2C.setColor('white')
    if not(driverMicro.listen()):
        core.echo("An error occured during the record", "ERROR")
        return False
    driverSpeaker.play("ressources/test1.wav")

    driverI2C.display("Converting...")
    text = audio.speechToText("ressources/test1.wav", lang=from_lang)
    if(text == False):
        core.echo("An error occured during conversion from audio to text", "ERROR")
        return False
    
    for (key, command) in commands.items():
        if(text.lower().replace(" ", "") == key):
            audio.say(command['message'], systemLanguage)
            core.echo("Vocal command [" + key.upper() + "] has been triggered")
            core.terminate(command['code'])

    #core.echo(" >> " + str(text))
    driverI2C.display("Translating...")
    trad = translater.translate(text, from_lang=from_lang, to_lang=to_lang)
    if trad == None:
        core.echo("An error occured during translation", "ERROR")
        return False

    driverI2C.display("Synthetizing...")
    core.echo(text + " > " + trad)
    if not(audio.textToSpeech(trad, to_lang)):
        core.echo("An error occured during conversion from text to audio", "ERROR")
        return False
    
    driverSpeaker.play('ressources/audio.mp3')


usedExitCodes = []
for (key, reason) in exitCodes.items():
    if(key in usedExitCodes):
        core.terminate(-999, "ConfigurationError: Exit code ["+str(key)+"] is declared more than once")
    usedExitCodes.append(key)


while True:
    try:
        if(main() == False):
            driverI2C.setRGB(255,255,0)
            driverI2C.display('I did not understand')
            audio.say("I am sorry, I did not understand.", systemLanguage)
    except KeyboardInterrupt:
        driverI2C.setRGB(0,0,0)
        driverI2C.display('')
        core.terminate(-1, "Interrupted before completion by user")
    except SystemExit as e:
        for (key, reason) in exitCodes.items():
            if(e.code == key):
                audio.say(reason, systemLanguage)
                if(e.code <= 0):
                    driverI2C.display(reason)
                    time.sleep(1)
                    driverI2C.setRGB(0,0,0)
                    driverI2C.display('')
                    core.terminate(e.code, reason)
        
        if(e.code != None):
            core.echo([
                "SystemExit code "+str(e.code)+" could not be recognized as an accepted shutdown code",
                "You can add vocal commands with exit codes in main.py",
                "You can add your special exit codes for logging purposes as well"
            ], type="WARN")
    except:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        core.echo("Unexpected error: "+str(exc_type), "ERROR")
        stack_array = traceback.format_tb(exc_traceback)
        stack_array.append(exc_value)
        core.terminate(-1, stack_array)