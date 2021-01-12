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
bDOWN = 2
bUP = 3
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
      "Source: " + list(LANGUAGES.values())[src],
      "Destin: " + list(LANGUAGES.values())[dest]
    ]
  )

  if(selected == -1):
    pass
    # lance mode ecoute passive

  if(selected == 0):
    temp = menuHandler.input('Sélection source', list(LANGUAGES.values()))
    if temp != -1:
      src = temp
  if(selected == 1):
    temp = menuHandler.input('Sélection destin', list(LANGUAGES.values()))
    if temp != -1:
      src = temp
