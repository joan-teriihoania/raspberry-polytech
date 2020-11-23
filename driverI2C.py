# coding: utf-8
import smbus
import time

bus = smbus.SMBus(1)  # pour I2C-1 (0 pour I2C-0)


# Indiquez ici les deux adresses de l'ecran LCD
# celle pour les couleurs du fond d'ecran 
# et celle pour afficher des caracteres
DISPLAY_RGB_ADDR = 0x62
DISPLAY_TEXT_ADDR = 0x3e

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

# Completez le code de la fonction permettant d'ecrire le texte recu en parametre
# Si le texte contient un \n ou plus de 16 caracteres pensez a gerer
# le retour a la ligne
def setText(texte):
	textCmd(0x01)
	textCmd(0x0F)
	textCmd(0x38)
	length = 0
	windowSize = 16
	for char in texte:
		if char == '\n':
			textCmd(0xc0)
			length = 0
		else:
			#time.sleep(0.1)
			bus.write_byte_data(DISPLAY_TEXT_ADDR,0x40,ord(char))
			length += 1
		
		if length >= 16:
			textCmd(0xc0)
			length = 0
	# pour un caractere c a afficher :
	# bus.write_byte_data(DISPLAY_TEXT_ADDR,0x40,ord(c))
	# ...
	# if ....:  # si on rencontre \n ou si on depasse 16 caracteres
	# 	textCommand(0xc0) # pour passer a la ligne
	# ...
	# ...
	print ("Texte écrit")


print("Initiated")
textCmd(0x01)
textCmd(0x0F)
textCmd(0x38)