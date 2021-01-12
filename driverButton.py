import grovepi

def isButtonPushed(buttonPin):
    grovepi.pinMode(buttonPin, "INPUT")
    return grovepi.digitalRead(buttonPin) == 1