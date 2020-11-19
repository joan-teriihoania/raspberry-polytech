import translater
import audio
import traceback
import sys
import core

try:
    core.echo(" >> " + translater.translate("Salut tout le monde"))
    core.echo(" >> " + audio.speechToText("ressources/Enregistrement.wav"))
    audio.textToSpeech("Ciao","it")
except KeyboardInterrupt:
    core.terminate(-1, "Interrupted before completion by user")
except SystemExit:
    pass
except:
    exc_type, exc_value, exc_traceback = sys.exc_info()
    core.echo("Unexpected error: "+str(exc_type), "ERROR")
    stack_array = traceback.format_tb(exc_traceback)
    stack_array.append(exc_value)
    core.terminate(-1, stack_array)