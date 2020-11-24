# coding: utf-8
import smbus
import core
import time
import sys
import termios
import tty

bus = smbus.SMBus(1)  # pour I2C-1 (0 pour I2C-0)


# Indiquez ici les deux adresses de l'ecran LCD
# celle pour les couleurs du fond d'ecran
# et celle pour afficher des caracteres
DISPLAY_RGB_ADDR = 0x62
DISPLAY_TEXT_ADDR = 0x3e

# [Insérer specif]
def setColor(color):
		if color == "red":
				setRGB(255,0,0)
		if color == "green":
				setRGB(0,255,0)
		if color == "blue":
				setRGB(0,0,255)
		if color == "yellow":
				setRGB(255,255,0)
		if color == "pink":
				setRGB(255,0,255)
		if color == "aqua":
				setRGB(0,255,255)
		if color == "white":
				setRGB(255,255,255)

# Completez le code de la fonction permettant de choisir la couleur
# du fond d'ecran, n'oubliez pas d'initialiser l'ecran
def setRGB(rouge,vert,bleu):
		# rouge, vert et bleu sont les composantes de la couleur qu'on vous demande
		bus.write_byte_data(DISPLAY_RGB_ADDR,0x00,0x00)
		bus.write_byte_data(DISPLAY_RGB_ADDR,0x01,0x00)
		bus.write_byte_data(DISPLAY_RGB_ADDR,0x04,rouge)
		bus.write_byte_data(DISPLAY_RGB_ADDR,0x03,vert)
		bus.write_byte_data(DISPLAY_RGB_ADDR,0x02,bleu)
		bus.write_byte_data(DISPLAY_RGB_ADDR,0x08,0xAA)

# Envoie  a l'ecran une commande concerant l'affichage des caracteres
# (cette fonction vous est donnes gratuitement si vous
# l'utilisez dans la fonction suivante, sinon donnez 2000€
# a la banque et allez dictement en prison :)
def textCmd(cmd):
	bus.write_byte_data(DISPLAY_TEXT_ADDR,0x80,cmd)
	time.sleep(0.1)

windowSize = 16
windowLines = 2

# Completez le code de la fonction permettant d'ecrire le texte recu en parametre
# Si le texte contient un \n ou plus de 16 caracteres pensez a gerer
# le retour a la ligne
def setText(texte):
		global windowSize
		global windowLines
		clearText()
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
		textCmd(0x01)
		textCmd(0x0F)
		textCmd(0x38)

def display(texte):
	setText(texte)

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