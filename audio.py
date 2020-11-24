import core
import speech_recognition as sr
import gtts
import os

def textToSpeech(string,lang, filepath="./ressources/audio.mp3"):
    if(core.fileExists(filepath)):
        os.unlink(filepath)
    
    while not(core.fileExists(filepath)):
        core.echo('Converting text ('+lang+') into audio transcripts ...')
        
        try:
            tts = gtts.gTTS(text=string, lang=lang)
            tts.save(filepath)
            core.overecho('Converting text ('+lang+') into audio transcripts ...' + core.done)
            return True
        except KeyboardInterrupt:
            return
        except ValueError:
            core.overecho('Converting text ('+lang+') into audio transcripts ...' + core.failed)
            return False
        
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
            core.echo('Converting audio transcripts ('+lang+') into text ...', end="")
            text = r.recognize_google(audio_text, language = lang)
            print(core.done)
            return text
        
        except sr.UnknownValueError:
            print(core.failed)
            core.echo("Google Speech Recognition could not understand audio", "ERROR")
            return False
        except sr.RequestError as e:
            print(core.failed)
            core.echo("Could not request results from Google Speech Recognition service", "ERROR")
            core.echo(e, "ERROR")
            return False