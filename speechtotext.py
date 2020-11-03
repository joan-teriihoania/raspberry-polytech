import core
import speech_recognition as sr

# Initialize recognizer class (for recognizing the speech)
r = sr.Recognizer()

# Reading Audio file as source
# listening the audio file and store in audio_text variable

def toText(filepath, lang="fr-FR"):
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