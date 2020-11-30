import core
import speech_recognition as sr
import gtts
import os
import driverSpeaker


#############################
# BASIC CONFIGURATION
#############################

# Initialize recognizer class (for recognizing the speech)
r = sr.Recognizer()


# @Desc : Converts text to speech and plays it
# @Params :
#  - string: String > Text to convert
#  - lang: String > Language of the text to convert
#  - filepath: String > File used for temporary usage for the audio file
# @Returns : If an error occured during conversion
def say(string, lang="en", filepath="/home/jopro/raspberry-polytech/ressources/texttospeech_output.mp3"):
    if not textToSpeech(string, lang, filepath):
        return False
    driverSpeaker.play("/home/jopro/raspberry-polytech/ressources/texttospeech_output.mp3")
    return True

# Method to retrieve lang list
def getListLang():
    return gtts.lang.tts_langs()

# @Desc : Converts text to speech and stores it in an audio file
# @Params :
#  - string: String > Text to convert
#  - lang: String > Language of the text to convert
#  - filepath: String > File used for temporary usage for the audio file
# @Returns : If an error occured during conversion
def textToSpeech(string, lang, filepath="/home/jopro/raspberry-polytech/ressources/texttospeech_output.mp3"):
    # Delete the used file if it exists
    if(core.fileExists(filepath)):
        os.unlink(filepath)

    # While there is no file generated    
    while not(core.fileExists(filepath)):
        #core.echo('Converting text ('+lang+') into audio transcripts ...')
        
        try:
            tts = gtts.gTTS(text=string, lang=lang)
            tts.save(filepath)
            #core.overecho('Converting text ('+lang+') into audio transcripts ...' + core.done)
            return True
        except KeyboardInterrupt:
            return False
        except ValueError:
            #core.overecho('Converting text ('+lang+') into audio transcripts ...' + core.failed)
            return False
        except:
            return False



# @Desc : Read specified audio file and use speech_recognition to extract a text
# @Params :
#  - filepath: Path of audio file to analyze
#  - lang: Language of the audio file
# @Returns : The text extracted or False if an error occured
def speechToText(filepath='/home/jopro/raspberry-polytech/ressources/microphone_input.wav', lang="fr-FR"):
    with sr.AudioFile(filepath) as source:
        audio_text = r.listen(source)
        # recoginize_() method will throw a request error if the API is unreachable, hence using exception handling
        try:
            # using google speech recognition
            #core.echo('Converting audio transcripts ('+lang+') into text ...', end="")
            text = r.recognize_google(audio_text, language = lang)
            #print(core.done)
            return text
        except sr.UnknownValueError:
            #print(core.failed)
            #core.echo("Google Speech Recognition could not understand audio", "ERROR")
            return False
        except sr.RequestError as e:
            #print(core.failed)
            #core.echo("Could not request results from Google Speech Recognition service", "ERROR")
            core.echo(e, "ERROR")
            core.terminate(2)