# coding: utf-8
import smbus
import core
import time
import sys
import termios
import tty
import threading
from RPLCD import CharLCD

bus = smbus.SMBus(1)  # pour I2C-1 (0 pour I2C-0)

################################
# BASIC CONFIGURATION
################################
DISPLAY_RGB_ADDR = 0x62
DISPLAY_TEXT_ADDR = 0x3e
a_red, a_green, a_blue = (0,0,0)
lcd = CharLCD('PCF8574', 0x27)

def set_cursor_pos(x, y):
	lcd.cursor_pos = (x, y)

def write(text):
	lcd.write_string(text)



# @Desc: Change the color from current (stored in a_{color}) to new bgcolors with fading animation
# @Params:
#	- rouge: Integer [0,255] of red color
#	- vert: Integer [0,255] of green color
#	- bleu: Integer [0,255] of blue color
#	- duration: Duration of animation (Float)
# @Returns: Void
# @Recommended: Use with threading to avoid blocking the execution
def setAnimatedRGB(rouge, vert, bleu, duration=0.5):
	global a_red, a_green, a_blue
	nbTicks = 10
	waitingTime = duration/nbTicks

	v_red = int((rouge - a_red)/nbTicks)
	v_green = int((vert - a_green)/nbTicks)
	v_blue = int((bleu - a_blue)/nbTicks)

	for i in range(nbTicks):
		a_red += v_red
		a_green += v_green
		a_blue += v_blue
		bus.write_byte_data(DISPLAY_RGB_ADDR,0x04,a_red)
		bus.write_byte_data(DISPLAY_RGB_ADDR,0x03,a_green)
		bus.write_byte_data(DISPLAY_RGB_ADDR,0x02,a_blue)
		bus.write_byte_data(DISPLAY_RGB_ADDR,0x08,0xAA)
		time.sleep(waitingTime)
	bus.write_byte_data(DISPLAY_RGB_ADDR,0x04,rouge)
	bus.write_byte_data(DISPLAY_RGB_ADDR,0x03,vert)
	bus.write_byte_data(DISPLAY_RGB_ADDR,0x02,bleu)
	bus.write_byte_data(DISPLAY_RGB_ADDR,0x08,0xAA)

# @Desc: Change the bgcolor to a new one with or without fading animation
# @Params:
#	- rouge: Integer [0,255] of red color
#	- vert: Integer [0,255] of green color
#	- bleu: Integer [0,255] of blue color
#	- fade: Boolean if we animate the change with or without fading
#		If TRUE, will launch a thread of setAnimatedRGB with specified args
#		and return without waiting for it to finish
# @Returns: Void
def setRGB(rouge, vert, bleu, fade=True):
	bus.write_byte_data(DISPLAY_RGB_ADDR,0x00,0x00)
	bus.write_byte_data(DISPLAY_RGB_ADDR,0x01,0x00)
	if(fade):
		t = threading.Thread(target=setAnimatedRGB, args=(rouge, vert, bleu))
		t.start()
	else:
		bus.write_byte_data(DISPLAY_RGB_ADDR,0x04,rouge)
		bus.write_byte_data(DISPLAY_RGB_ADDR,0x03,vert)
		bus.write_byte_data(DISPLAY_RGB_ADDR,0x02,bleu)
		bus.write_byte_data(DISPLAY_RGB_ADDR,0x08,0xAA)

# @Desc: Convert a given string of hexadecimal colors to RGB colors
# @Params:
#	- text: String of valid hexadecimal color (with or without # at the begining)
# @Returns: Tuple of length 3 of color RED, GREEN and BLUE
def hexaToRGB(text):
	text  = text.lstrip('#')
	if(isinstance(text, str) and len(text) == 6):
		return tuple(int(text[i:i+2], 16) for i in (0, 2, 4))
	return False

class setColorList:
	RED = "red",
	GREEN = "green",
	BLUE = "blue",
	YELLOW = "yellow",
	PINK = "pink",
	AQUA = "aqua",
	WHITE = "white",
	BLACK = "black"

# @Desc: Change the bgcolor to a new one with or without fading animation
# @Params:
#	- color: String of a color listed in setColorList or an hexadecimal color
# @Returns: Void
# @Note: Automatically use fading animation
def setColor(color):
	if color == "red":
		setRGB(255,0,0)
	elif color == "green":
		setRGB(0,255,0)
	elif color == "blue":
		setRGB(0,0,255)
	elif color == "yellow":
		setRGB(255,255,0)
	elif color == "pink":
		setRGB(255,0,255)
	elif color == "aqua":
		setRGB(0,255,255)
	elif color == "white":
		setRGB(255,255,255)
	elif color == "black":
		setRGB(0,0,0)
	else:
		temp = hexaToRGB(color)
		if(temp != False):
			setRGB(temp[0], temp[1], temp[2])

# Envoie  a l'ecran une commande concerant l'affichage des caracteres
# (cette fonction vous est donnes gratuitement si vous
# l'utilisez dans la fonction suivante, sinon donnez 2000€
# a la banque et allez dictement en prison :)
def textCmd(cmd):
	bus.write_byte_data(DISPLAY_TEXT_ADDR,0x80,cmd)

windowSize = 16
windowLines = 2

# @Desc: Display given text on I2C LCD screen
# @Params:
#	texte: String of text to display
#	instant: (Bool) Use of temporization when clearing the LCD screen
#		If TRUE, will not wait after the text is cleared.
#		WARN: Temporization is used to wait a moment before writing to avoid any data loss
#			  as text clearing may take a moment before being completed which, without
#			  temporization, may result in the first chars displayed of the text be ignored or cleared in the process
#		Set to TRUE for animation or rapid succession of text
# @Note: texte will be automatically be returned to line if it exceeds window width or with "\n" char
# @Note: If the length of texte exceeds the window char display capacity, the text will not be displayed
def setText(texte, instant=False):
	global windowSize
	global windowLines
	clearText()
	if(not instant): time.sleep(0.05)
	length = 0

	if len(texte) > windowSize * windowLines:
		return

	for char in texte:
		if char == '\n':
			textCmd(0xc0)
			length = 0
		else:
			bus.write_byte_data(DISPLAY_TEXT_ADDR,0x40,ord(char))
			length += 1

		if length >= windowSize:
			textCmd(0xc0) # Passe à la ligne
			length = 0

# @Desc : Clear the content of the LCD screen
def clearText():
	bus.write_byte_data(DISPLAY_TEXT_ADDR,0x80,0x01)
	bus.write_byte_data(DISPLAY_TEXT_ADDR,0x80,0x0F)
	bus.write_byte_data(DISPLAY_TEXT_ADDR,0x80,0x38)

# @Desc: Display the given text
# @Note: Used to centralize input to edit its behavior
# @Params:
#	- color: String of a color listed in setColorList or an hexadecimal color
def display(texte, instant=False, color=None):
	setText(texte, instant)
	if(color != None):
		setColor(color)

# Experimental function
def setLongText1(texte):
		sizeText = 32
		arrayText = [texte[i:i+sizeText] for i in range(0, len(texte), sizeText)]
		for i in range(0, len(arrayText)):
				setText(arrayText[i])
				time.sleep(1)

# Experimental function
def setLongText2(texte):
		sizeText = 16
		arrayText = [texte[i:i+sizeText] for i in range(0, len(texte), sizeText)]
		for i in range(1, len(arrayText)):
				setText(arrayText[i-1] + arrayText[i])
				time.sleep(1)

# Experimental function
def echoing():
		print("What you write here will be echoed on the LCD.")
		print("Press ESC or ENTER to exit this utility.")
		print()
		old_settings = termios.tcgetattr(sys.stdin.fileno())
		tty.setraw(sys.stdin.fileno())
		c=''
		while True:
				new = sys.stdin.read(1)
				if new == chr(27) or new == chr(10):
						break

				if new == 'ù':
						c = c[:-1]
						new = ''

				if len(c) > 31:
						c = ''

				c+=new
				print(new, end = '')
				sys.stdout.flush()
				setText(c)

		print()
		termios.tcsetattr(sys.stdin.fileno(), termios.TCSADRAIN, old_settings)


#######################
# INITIALIZATION
#######################

core.echo("LCD display has been initiated")
textCmd(0x01)
time.sleep(0.5)
textCmd(0x0F)
time.sleep(0.5)
textCmd(0x38)