import gtts

def toSpeech(str,lang) :
  # make request to google to get synthesis
  tts = gtts.gTTS(str,lang)
  # save the audio file
  tts.save("audio.mp3")
  
 #methode pour voir toutes les langues disponibles : gtts.lang.tts_langs()
