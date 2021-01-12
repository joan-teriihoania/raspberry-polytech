import time
import driverButton
import driverI2C
import menuHandler
import config
import core

LANGUAGES = {
  "en": "ENGLISH",
  "fr": "FRANCAIS",
  'it': "ITALIANO",
  "es": "ESPANOL",
  "zh-CN": "CHINESE"
}

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
    selected = menuHandler.input(
      'Menu principal',
      [
        "SRC : " + LANGUAGES[config.getConfig()['from_lang']],
        "DEST: " + LANGUAGES[config.getConfig()['to_lang']]
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