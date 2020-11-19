import core
import speech_recognition as sr
import gtts
import os

def textToSpeech(string,lang, filepath="./ressources/audio.mp3"):
    if(core.fileExists(filepath)):
        os.unlink(filepath)
    
    while not(core.fileExists(filepath)):
        try:
            core.echo('Converting text ('+lang+') into audio transcripts ...')
            tts = gtts.gTTS(text=string, lang=lang)
            tts.save(filepath)
            core.overecho('Converting text ('+lang+') into audio transcripts ...' + core.done)
            return
        except KeyboardInterrupt:
            return
        except:
            core.overecho('Converting text ('+lang+') into audio transcripts ...' + core.failed)
 #methode pour voir toutes les langues disponibles : gtts.lang.tts_langs()


# Initialize recognizer class (for recognizing the speech)
r = sr.Recognizer()

# Reading Audio file as source
# listening the audio file and store in audio_text variable

def speechToText(filepath, lang="fr-FR"):
    with sr.AudioFile(filepath) as source:
        audio_text = r.listen(source)
        # recoginize_() method will throw a request error if the API is unreachable, hence using exception handling
        try:
            # using google speech recognition
            core.echo('Converting audio transcripts ('+lang+') into text ...')
            text = r.recognize_google(audio_text, language = "fr-FR")
            core.overecho('Converting audio transcripts ('+lang+') into text ...' + core.done)
            return text
        
        except:
            core.overecho('Converting audio transcripts ('+lang+') into text ...' + core.failed)