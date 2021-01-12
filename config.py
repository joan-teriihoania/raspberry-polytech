import core
import json

filename = './config.json'
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