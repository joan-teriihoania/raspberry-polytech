from typing import ContextManager
import urllib.parse, urllib.request
import requests
import time
import json
import driverI2C
import config
import audio
import core
import config

secret_key = "VqdjGXcUAXZ7DqKXTjtYVXVxk22t4Sba"
base_url = "http://raspberry-polytech.joanteriihoania.repl.co"
#base_url = "http://localhost:3000"
pin_code = ""
api_url = "/api/v1"
auth_key = ""

def register():
    global pin_code
    code, registry = send_post('/device/ask_link', {}, checkauth = False)
    if(code != 200):
        core.terminate(-3)
    config.setConfig("device_id", registry['device_id'])

def code_pin():
    audio.say('This device is not registered yet')
    code, content = send_get("/device/:device_id:/info", {}, checkauth = False)
    if(code != 200):
        register()
        code, content = send_get("/device/:device_id:/info", {}, checkauth = False)

    if(code == 200):
        while(content['device_id'] == str(config.getConfig()['device_id']) and content['linked'] == "false"):
            _, content = send_get("/device/:device_id:/info", {}, checkauth = False)
            driverI2C.display('Code PIN:\n' + content['pin_code'])
            time.sleep(1)
    return

def check_auth():
    if(config.getConfig()['device_id'] == -1):
        code_pin()
    
    code, content = send_get("/device/:device_id:/info", {}, checkauth = False)
    if(code != 200 and content == "Appareil inconnu"):
        code_pin()
    if(code == 200):
        if(content['device_id'] == str(config.getConfig()['device_id']) and content['linked'] == "false"):
            code_pin()

def send_post(url, fields, checkauth = True):
    if(checkauth): check_auth()
    url = url.replace(':device_id:', str(config.getConfig()['device_id']))
    fields['auth_key'] = secret_key
    while True:
        resp = requests.post(base_url + api_url + url, data=fields)
        if(resp.status_code == 429):
            time.sleep(1)
        else:
            if(resp.status_code == 200):
                try:
                    json_decode = json.loads(resp.text)
                    return resp.status_code, json_decode
                except:
                    return resp.status_code, resp.text
            else:
                return resp.status_code, resp.text

def send_get(url, fields, checkauth = True):
    if(checkauth): check_auth()
    url = url.replace(':device_id:', str(config.getConfig()['device_id']))
    fields['auth_key'] = secret_key
    url = url + "?"
    for attr, value in fields.items():
        url = url + attr + "=" + urllib.parse.quote(value) + "&"
    url = url[:-1]

    while True:
        resp = requests.get(base_url + api_url + url)
        if(resp.status_code == 429):
            time.sleep(1)
        else:
            if(resp.status_code == 200):
                try:
                    json_decode = json.loads(resp.text)
                    return resp.status_code, json_decode
                except:
                    return resp.status_code, resp.text
            else:
                return resp.status_code, resp.text