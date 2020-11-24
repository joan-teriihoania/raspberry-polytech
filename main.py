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

def main():
    driverI2C.setColor('white')
    driverI2C.display("Enregistrement")
    if not(driverMicro.listen()):
        core.echo("An error occured during the record", "ERROR")
        return False
    driverSpeaker.play("ressources/test1.wav")

    driverI2C.display("Conversion")
    text = audio.speechToText("ressources/test1.wav")
    if(text == False):
        core.echo("An error occured during conversion from audio to text", "ERROR")
        return False
    

    core.echo(" >> " + str(text))
    driverI2C.display("Traduction")
    trad = translater.translate(text)
    if trad == None:
        core.echo("An error occured during translation", "ERROR")
        return False

    driverI2C.display("Synthétisation")
    core.echo(trad)
    if not(audio.textToSpeech(trad, "en")):
        core.echo("An error occured during conversion from text to audio", "ERROR")
        return False
    
    driverSpeaker.play('ressources/audio.mp3')



while True:
    try:
        if(main() == False):
            driverI2C.setRGB(255,0,0)
            driverI2C.display('Je n\'ai pas compris')
            audio.say("I am sorry, I did not understand.", "en")
    except KeyboardInterrupt:
        core.terminate(-1, "Interrupted before completion by user")
    except SystemExit:
        continue
    except:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        core.echo("Unexpected error: "+str(exc_type), "ERROR")
        stack_array = traceback.format_tb(exc_traceback)
        stack_array.append(exc_value)
        core.terminate(-1, stack_array)