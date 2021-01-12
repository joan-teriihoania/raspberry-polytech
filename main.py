# coding: utf-8

import translater
import audio
import traceback
import sys
import core
import driverI2C
import driverButton
import threading
import driverSpeaker
import mainMenu
import jz_translation_server
import driverMicro
import time
import config

############################
# VOICE COMMANDS
############################
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

############################
# EXIT CODES (accepted)
############################
# Silent special exitCode 3 for change from menu to main 
exitCodes = {
    2: "I cannot reach the Google Speech Recognition service",
    1: "Translation memory usage has exceeded daily quota",
    0: "Good bye!",
    -1: "An unexpected error occured during execution that caused a system crash",
    -2: "I encountered an issue with your microphone, try rebooting. If this does not resolve your problem, get your device checked in the nearest repair shop available",
    -3: "I cannot reach the translation service"
}


############################
# BASIC CONFIGURATION VAR
############################
triggerWords = "Translate"
systemLanguage = "en"
waitTriggerWords = True



############################
# @Desc : Main loop function with valid given from_lang and to_lang
# Wait for the button
# Listen for sound and record
# Convert audio to text
# Translate text
# Convert translated text to audio
# Play generated audio
#
# @Return : if an error occured (to let main loop handle it)
############################
def main(waitTriggerWords=True):
    
    trad_status, trad = translater.translate("Translate", from_lang="en", to_lang="en")
    if trad_status != 200:
        core.terminate(-3)

    from_lang = config.getConfig()['from_lang']
    to_lang = config.getConfig()['to_lang']
    global triggerWords
    # TODO: I'm sorry I did not understand MAX 3 FOIS
    # TODO: fichier config avec langues préférées
    # TODO: System logs (JOAN)
    # TODO: Menu langue
    # TODO: Use "auto" language detection ? JOAN)
    # TODO: Store translations (deep.io) ? (ZAHRA)

    # TODO: Ajouter diagramme de séquence
    
    # Default background color
    driverI2C.setColor('white')

    # Wait for button pressing
    #driverI2C.display("Press the\nbutton")
    #core.echo("Waiting for button to be pressed...")
    #while not(driverButton.isButtonPushed()):
    #    continue
    #core.overecho("Waiting for button to be pressed..." + core.done)

    # Listen for sound in microphone, record and save in "/home/jopro/raspberry-polytech/ressources/microphone_input.wav"

    if not(driverMicro.listen(
        waitTriggerWords=waitTriggerWords,
        triggerWords=triggerWords
        )
    ):
        core.echo("An error occured during the record", "ERROR")
        return False
    
    # Convert audio to text
    driverI2C.display("Converting...")
    text = audio.speechToText(lang=from_lang)
    if(text == False):
        core.echo("An error occured during conversion from audio to text", "ERROR")
        return False
    
    # Checking if it is a voice command
    for (key, command) in commands.items():
        if(text.lower().replace(" ", "") == key):
            audio.say(command['message'], systemLanguage)
            core.echo("Voice command [" + key.upper() + "] has been triggered")
            core.terminate(command['code'])

    # Translate to the specified language from the given language
    driverI2C.display("Translating...")
    trad_status, trad = translater.translate(text, from_lang=from_lang, to_lang=to_lang)
    if trad_status != 200:
        core.echo("An error occured during translation", "ERROR")
        return False

    # Convert from translated text to audio and plays it
    driverI2C.display("Synthetizing...")
    #core.echo(text + " > " + trad)
    if not(audio.say(trad, to_lang)):
        core.echo("An error occured during conversion from text to audio", "ERROR")
        return False
    
    return True



############################
# MAIN (infinite) LOOP with error handler and shutdown handling
############################
def exec():
    global waitTriggerWords
    global commands
    global exitCodes
    global systemLanguage
    global triggerWords
    nbFailedToUnderstand = 0
    maxRetries = 2
    
    while True:
        try:
            # If main() returns False, there was an error
            # Runs an error message and inform the user of it
            # Then, reloop

            if(main(waitTriggerWords=waitTriggerWords) == False):
                nbFailedToUnderstand += 1
                if(nbFailedToUnderstand <= maxRetries):
                    driverI2C.setColor('red')
                    driverI2C.display('I did not\n understand')
                    audio.say("I am sorry, I did not understand.", systemLanguage)
                    waitTriggerWords = False
                else:
                    nbFailedToUnderstand = 0
                    waitTriggerWords = True
                continue
        except KeyboardInterrupt:
            # If the user interrupted the program using CTRL+C (example)
            # Reset the values of screen and thread to prepare the shutdown
            driverI2C.setColor("black")
            core.shutdown = True
            driverI2C.display('')
            core.terminate(-1, "Interrupted by user")
        except SystemExit as e:
            # If a fatal error occured and is expected by a termination function
            # Checks if the error code specified is listed in exitCodes variables
            # which lists all accepted error code authorized to exit the main loop
            # and stop the process
            if(e.code == 3):
                core.echo("Switching to menu !")
                return

            for (key, reason) in exitCodes.items():
                if(e.code == key):
                    audio.say(reason, systemLanguage)
                    if(e.code <= 0):
                        driverI2C.display(reason)
                        time.sleep(1)
                        # Reset the values of screen and thread to prepare the shutdown
                        core.shutdown = True
                        driverI2C.setColor("black")
                        driverI2C.display('')
                        core.terminate(e.code, reason)
                    else:
                        core.echo(reason, "ERROR")
                        core.echo([
                           "SystemExit code "+str(e.code)+" is listed with a positive exit code",
                           "By convention, this means that it is not fatal and does not require a shutdown",
                        ], type="WARN")
                        return
            
            # If the exit code is None, there it is a termination code which
            # is not an error but only a reloop instruction
            if(e.code != None and not e.code in exitCodes.keys()):
                # The exit code is not None and is not specified in the accepted exit codes
                core.echo([
                    "SystemExit code "+str(e.code)+" could not be recognized as an accepted shutdown code",
                    "You can add voice commands with exit codes in main.py",
                    "You can add your special exit codes for logging purposes as well"
                ], type="WARN")
        except:
            # An unexpected error occured during execution
            # Output the logs of the error and reboot the loop
            exc_type, exc_value, exc_traceback = sys.exc_info()
            core.echo("Unexpected error: "+str(exc_type), "ERROR")
            stack_array = traceback.format_tb(exc_traceback)
            stack_array.append(exc_value)
            core.echo(stack_array, "FATAL")
        waitTriggerWords = True

def run():
    while True:
        mainMenu.displayMenu()
        exec()

def webConfig():
    while not core.shutdown:
        code, content = jz_translation_server.send_get('/device/:device_id:/config', {}, checkauth=False)
        if(code == 200):
            if("from_lang" in content and "to_lang" in content):
                config.setConfig('from_lang', content['from_lang'])
                config.setConfig('to_lang', content['to_lang'])
        time.sleep(10)

t_webconfig = threading.Thread(target=webConfig)
t_webconfig.start()
run()