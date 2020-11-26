# coding: utf-8
import smbus
import core
import time
import sys
import termios
import tty
import threading

bus = smbus.SMBus(1)  # pour I2C-1 (0 pour I2C-0)


# Indiquez ici les deux adresses de l'ecran LCD
# celle pour les couleurs du fond d'ecran
# et celle pour afficher des caracteres
DISPLAY_RGB_ADDR = 0x62
DISPLAY_TEXT_ADDR = 0x3e
a_red, a_green, a_blue = (0,0,0)

def setAnimatedRGB(rouge, vert, bleu, duration=0.5):
	global a_red, a_green, a_blue
	nbTicks = 10
	waitingTime = duration/nbTicks

	bus.write_byte_data(DISPLAY_RGB_ADDR,0x00,0x00)
	bus.write_byte_data(DISPLAY_RGB_ADDR,0x01,0x00)

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

# Completez le code de la fonction permettant de choisir la couleur
# du fond d'ecran, n'oubliez pas d'initialiser l'ecran
def setRGB(rouge,vert,bleu):
	t = threading.Thread(target=setAnimatedRGB, args=(rouge, vert, bleu))
	t.start()


def extractRGB(text):
	text  = text.lstrip('#')
	if(isinstance(text, str) and len(text) == 6):
		return tuple(int(text[i:i+2], 16) for i in (0, 2, 4))
	return False

# [Insérer specif]
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
		temp = extractRGB(color)
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

# Completez le code de la fonction permettant d'ecrire le texte recu en parametre
# Si le texte contient un \n ou plus de 16 caracteres pensez a gerer
# le retour a la ligne
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

def clearText():
	bus.write_byte_data(DISPLAY_TEXT_ADDR,0x80,0x01)
	bus.write_byte_data(DISPLAY_TEXT_ADDR,0x80,0x0F)
	bus.write_byte_data(DISPLAY_TEXT_ADDR,0x80,0x38)

def display(texte, instant=False):
	setText(texte, instant)

def setLongText1(texte):
		sizeText = 32
		arrayText = [texte[i:i+sizeText] for i in range(0, len(texte), sizeText)]
		for i in range(0, len(arrayText)):
				setText(arrayText[i])
				time.sleep(1)


def setLongText2(texte):
		sizeText = 16
		arrayText = [texte[i:i+sizeText] for i in range(0, len(texte), sizeText)]
		for i in range(1, len(arrayText)):
				setText(arrayText[i-1] + arrayText[i])
				time.sleep(1)


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




core.echo("LCD display has been initiated")
textCmd(0x01)
time.sleep(0.5)
textCmd(0x0F)
time.sleep(0.5)
textCmd(0x38)