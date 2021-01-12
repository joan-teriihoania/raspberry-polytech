import time
import driverButton
import driverI2C
import menuHandler

LANGUAGES = {
  "en": "ENGLISH",
  "fr": "FRANCAIS",
  'it': "ITALIANO",
  "es": "ESPANOL",
  "ch": "CHINESE"
}

#PIN BUTTONS
bDOWN = 3
#bUP = 4
bSELECT = 7
bBACK = 8

position = 0
prev_position = 0
src = 0
dest = 1
driverI2C.setColor('white')
while True:
  #afficher menu initial
  selected = menuHandler.input(
    'Menu principal',
    [
      "SRC : " + list(LANGUAGES.values())[src],
      "DEST: " + list(LANGUAGES.values())[dest]
    ]
  )

  if(selected != -1):
    if(selected == 0):
      temp = menuHandler.input('Selection source', list(LANGUAGES.values()))
      if temp != -1:
        src = temp
    if(selected == 1):
      temp = menuHandler.input('Selection destin', list(LANGUAGES.values()))
      if temp != -1:
        dest = temp