import driverButton
import driverI2C
import time

#PIN BUTTONS
bDOWN = 2
bUP = 3
bSELECT = 7
bBACK = 8

# Display a list of choice to the user with LCD
# Display will differ depending on choice size
# Returns index of selected item in list
# or -1 if cancelled
def input(title, choices):
  if(len(choices) == 0): return -1
  if(len(choices) == 2):
    return inputCursor(title, choices)
  
  return inputList(title, choices)


def isAnyButtonPressed():
  return driverButton.isButtonPushed(bSELECT) or driverButton.isButtonPushed(bBACK) or driverButton.isButtonPushed(bDOWN) or driverButton.isButtonPushed(bUP)

def inputCursor(title, choices):
  index = 0
  prev_index = 1
  wasButtonPressed = False

  while True:
    print(str(wasButtonPressed) + " " + str(isAnyButtonPressed()))
    if(wasButtonPressed and isAnyButtonPressed()):
      continue

    if driverButton.isButtonPushed(bSELECT):
      break
    if driverButton.isButtonPushed(bBACK):
      return -1

    if driverButton.isButtonPushed(bDOWN):
      index += 1
    if driverButton.isButtonPushed(bUP):
      index -= 1
    
    if index < 0:
      index = len(choices)-1 
    if index >= len(choices):
      index = 0
    
    if index != prev_index:
      cursor0 = '>' if index == 0 else ' '
      cursor1 = '>' if index == 1 else ' '
      line1 = cursor0 + " " + choices[0]
      line2 = cursor1 + " " + choices[1]

      line1 = line1 if len(line1) <= 16 else line1[0:15]
      line2 = line2 if len(line2) <= 16 else line2[0:15]
      driverI2C.setText(line1 + "\n" + line2)
  
    prev_index = index
    wasButtonPressed = isAnyButtonPressed()
  return index

def inputList(title, choices):
  index = 0
  prev_index = 1
  wasButtonPressed = False

  while True:
    if(wasButtonPressed and isAnyButtonPressed()):
      continue
    
    if driverButton.isButtonPushed(bSELECT):
      break
    if driverButton.isButtonPushed(bBACK):
      return -1
    if driverButton.isButtonPushed(bDOWN):
      index += 1
    if driverButton.isButtonPushed(bUP):
      index -= 1
    
    if index < 0:
      index = len(choices)-1 
    if index >= len(choices):
      index = 0 

    if index != prev_index:
      line1 = title if len(title) <= 16 else title[0:15]
      line2 = choices[index] if len(choices[index]) <= 16 else choices[index][0:15]
      driverI2C.setText(line1 + "\n" + line2)
  
    prev_index = index
    wasButtonPressed = isAnyButtonPressed()
  return index