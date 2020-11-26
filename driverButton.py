import grovepi

buttonPin = 3
ledPin = 0

grovepi.pinMode(ledPin, "OUTPUT")
grovepi.pinMode(buttonPin, "INPUT")

def isButtonPushed():
    return grovepi.digitalRead(buttonPin)