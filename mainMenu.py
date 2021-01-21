import time
import driverButton
import driverI2C
import menuHandler
import config
import gtts
import core

LANGUAGES = {
  "en": "ENGLISH",
  "fr": "FRANCAIS",
  'it': "ITALIANO",
  "es": "ESPANOL",
  "zh-CN": "CHINESE"
}

all_lang = gtts.lang.tts_langs()

#PIN BUTTONS
bDOWN = 3
#bUP = 4
bSELECT = 7
bBACK = 8

def isButtonBackPressed():
  return driverButton.isButtonPushed(bBACK)

def displayMenu():
  # Default background color
  driverI2C.setColor('white')

  while True:
    #afficher menu initial
    if(config.getConfig()['from_lang'] in LANGUAGES):
      srcStr = LANGUAGES[config.getConfig()['from_lang']]
    else:
      srcStr = all_lang[config.getConfig()['from_lang']]
      
    if(config.getConfig()['to_lang'] in LANGUAGES):
      desStr = LANGUAGES[config.getConfig()['to_lang']]
    else:
      desStr = all_lang[config.getConfig()['to_lang']]

    selected = menuHandler.input(
      'Menu principal',
      [
        "SRC : " + srcStr,
        "DEST: " + desStr
      ]
    )

    if(selected == -1):
      core.echo("Switching to main !")
      break

    if(selected == 0):
      temp = menuHandler.input('Selection source', list(LANGUAGES.values()))
      if temp != -1:
        config.setConfig('from_lang', list(LANGUAGES.keys())[temp])

    if(selected == 1):
      temp = menuHandler.input('Selection destin', list(LANGUAGES.values()))
      if temp != -1:
        config.setConfig('to_lang', list(LANGUAGES.keys())[temp])