import time
import RPi.GPIO as GPIO
from pygame import mixer

# Pins definitions
btn_pin = 4
led_pin = 12

# Set up pins
GPIO.setmode(GPIO.BCM)
GPIO.setup(btn_pin, GPIO.IN)
GPIO.setup(led_pin, GPIO.OUT)

# Initialize pygame mixer
mixer.init()

# Remember the current and previous button states
current_state = True
prev_state = True

# Load the sounds
sound = mixer.Sound('applause-1.wav')

# If button is pushed, light up LED
try:
    while True:

        # If button is pressed, turn on LED and play sound
        current_state = GPIO.input(btn_pin)
        if (current_state == False) and (prev_state == True):
            if mixer.get_busy():
                sound.stop()
            else:
                GPIO.output(led_pin, GPIO.HIGH)
                sound.play()

        # Only turn off LED if sound has stopped playing
        if mixer.get_busy() == False:
            GPIO.output(led_pin, GPIO.LOW)

        # Save state of switch to use in next iteration of the loop
        prev_state = current_state

# When you press ctrl+c, this will be called
finally:
    GPIO.cleanup()






