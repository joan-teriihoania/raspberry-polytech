import grovepi

buttonPin = 3
ledPin = 0

grovepi.pinMode(ledPin, "OUTPUT")
grovepi.pinMode(buttonPin, "INPUT")

# @Desc Returns if the button configured is pushed
# @Return Bool
def isButtonPushed():
    return grovepi.digitalRead(buttonPin)