from typing import ContextManager
import urllib.parse, urllib.request
import requests
import time
import driverI2C

secret_key = "VqdjGXcUAXZ7DqKXTjtYVXVxk22t4Sba"
base_url = "http://raspberry-polytech.joanteriihoania.repl.co"
#base_url = "http://localhost:3000"
device_id = 1
api_url = "/api/v1"
auth_key = ""

def code_pin():
    code, registry = send_post('/device/ask_link', {}, checkauth = False)
    device_id = registry['device_id']
    driverI2C
    return

def check_auth():
    if(device_id == -1):
        code_pin()
    code, content = send_get("/device_info/:device_id:", {}, checkauth = False)
    if(code == 400 and content == "Appareil inconnu"):
        code_pin()

def send_post(url, fields, checkauth = True):
    if(checkauth): check_auth()
    url = url.replace(':device_id:', str(device_id))
    fields['auth_key'] = secret_key
    while True:
        resp = requests.post(base_url + api_url + url, data=fields)
        if(resp.status_code == 429):
            time.sleep(1)
        else:
            if(resp.status_code == 200):
                return resp.status_code, resp.text
            else:
                return resp.status_code, resp.text

def send_get(url, fields, checkauth = True):
    if(checkauth): check_auth()
    url = url.replace(':device_id:', str(device_id))
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
                return 200, resp.text
            else:
                return resp.status_code, resp.text