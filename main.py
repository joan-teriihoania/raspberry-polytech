import translater
import speechtotext
import textospeech
import core

core.echo(" >> " + translater.translate("Salut tout le monde"))
core.echo(" >> " + speechtotext.toText("Enregistrement.wav"))
textospeech.toSpeech("Ciao","it")
