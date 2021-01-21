# Projet raspberry FASE ASIOT
Le traducteur ou JZ Translater (JZ pour plus court) est un appareil de traduction de langue utile pour les voyages à l'étranger. Ce répertoire contient le code exécutable sur Raspberry Pi 3 en python ainsi que le code du serveur NodeJS servant de liaison avec Google Traduction.

# Appareil
Téléchargez le contenu du répertoire et exécutez-le sur une Raspberry Pi 3 (https://www.raspberrypi.org/). Utilisez le fichier watchdog.sh dans un crontab pour qu'une instance soit en permanence en cours d'exécution. 

### Composants
 - Microphone (USB)
 - Haut-parleur (Prise jack)
 - Ecran LCD (I2C port 1)
 - 3 boutons (Port digital 2, 3, 7 et 8)

## Dépendances
 - GTTS (https://pypi.org/project/gTTS/)
 - Google Translate
 - Speech Recognition (https://pypi.org/project/SpeechRecognition/)
 - pyaudio (https://pypi.org/project/PyAudio/)
 - RPLCD (https://pypi.org/project/RPLCD/)
 - Python 3.7 (*Version de développement et testée*)

# Installation, configuration, exécution
## Serveur NodeJS
Le serveur NodeJS est contenu dans le dossier web. Pour l'installer tous les modules nécessaires, exécutez la commande `npm install`. Créez un fichier .env qui contiendra la configuration globale comme suit :
```
AUTH_GOOGLE_CLIENT_ID = ...
AUTH_GOOGLE_KEY = ...
AUTH_GOOGLE_REDIRECT = "http://hostname:port/path/to/login"

SECRET_KEY = Must be the same as secret_key in jz_translation_server.py
PORT = 3000
MAX_REQUEST_PER_SECOND = 10
API_PATH_PREF = "/api/v1"
```

Une fois cela fait, lancez le serveur avec `node server.js`



## Raspberry
Dans les fichiers :
 - audio.py
 - core.py
 - driverMicro.py
 - main.py
 - watchdog.sh

Remplacez les passages "*/home/jopro/raspberry-polytech*" par le chemin d'accès contenant le répertoire.

### watchdog.sh
Ce fichier permet l'exécution du projet directement en instanciant le fichier main.py si aucune instance n'est déjà en cours d'exécution. Pour fermer les instances et forcer une nouvelle exécution, utilisez l'option `force`.

**Syntaxe :**
`bash watchdog.sh [force]`

### main.py
> **Il est important qu'une seule et unique instance de ce fichier soit exécutée pour éviter tout conflit entre processus.**

Vérifiez avant tout que le serveur de liaison de traduction soit bien renseigné et corresponde bien au vôtre. Pour cela, rendez-vous dans le fichier jz_translation_server.py et vérifiez les variables :
```
secret_key = Same as SECRET_KEY in NodeJS server
base_url = URL to NodeJS server
```

Puis, lancez le fichier via Python 3.7 (`sudo python3.7 main.py`)