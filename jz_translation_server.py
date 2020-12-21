import urllib.parse, urllib.request
from urllib.error import HTTPError

secret_key = "VqdjGXcUAXZ7DqKXTjtYVXVxk22t4Sba"
base_url = "http://localhost:3000"
device_id = 1
api_url = "/api/v1"
auth_key = ""

def send_post(url, fields):
    url = url.replace(':device_id:', str(device_id))
    fields['auth_key'] = secret_key
    try:
        print(base_url + api_url + url)
        data = urllib.parse.urlencode(fields).encode()
        req =  urllib.request.Request(base_url + api_url + url, data=data) # this will make the method "POST"
        resp = urllib.request.urlopen(req)
        if(resp.status == 200):
            return resp.status, str(resp.read().decode('UTF-8'))
        else:
            return resp.status, None
    except HTTPError as err:
        return err.code, err

def send_get(url, fields):
    url = url.replace(':device_id:', str(device_id))
    fields['auth_key'] = secret_key
    url = url + "?"
    for attr, value in fields.items():
        url = url + attr + "=" + urllib.parse.quote(value) + "&"
    url = url[:-1]
    
    try:
        print(base_url + api_url + url)
        resp = urllib.request.urlopen(base_url + api_url + url)
        if(resp.status == 200):
            return resp.status, str(resp.read().decode('UTF-8'))
        else:
            return resp.status, None
    except HTTPError as err:
        return err.code, err


#print(send_post('/device/ask_link', {}))