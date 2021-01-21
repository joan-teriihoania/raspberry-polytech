import json
from pathlib import Path

filename = './config.json'
config_file = Path(filename)
if(not config_file.is_file()):
    f = open(filename, 'w+')
    f.write("{}")
    f.close()

data = json.load(open(filename, 'r'))

def setConfig(field, value):
    data[field] = value
    saveConfig()

def getConfig():
    return json.load(open(filename, 'r'))


def saveConfig():
    json.dump(data, open(filename, 'w+'))

if("device_id" not in data):
    setConfig("device_id", -1)
if("from_lang" not in data):
    setConfig("from_lang", "en")
if("to_lang" not in data):
    setConfig("to_lang", "fr")

