import html
import urllib
import json
#from translate import Translator
#from translate.providers import base
import core

# @Desc : Translate given text from a language to another
# @Params:
#  - text: Text to translate
#  - from_lang: Language of text
#  - to_lang: Language to translate to
# @Returns: The translated text
# @Exception:
#   UsageLimit: If the API has used the daily quota of translation assigned
def translate(text, from_lang="french", to_lang="english"):
    device_id = 41
    base_url = "https://raspberry-polytech.joanteriihoania.repl.co"
    api_url = "/api/v1/device/" + str(device_id) + "/translate"
    auth_key = ""
    try:
        data = urllib.request.urlopen(base_url + api_url + "?from_lang="+from_lang+"&to_lang="+to_lang+"&text="+urllib.parse.quote(text)+"&auth_key="+auth_key)
        if(data.status == 200):
            content = str(data.read().decode('UTF-8'))
            content = json.loads(content)
            return content['translation']
        
        if(data.status == 402):
            core.terminate(1)

            

        return None
    except:
        return None

# def translate_with_Translator(text, from_lang="french", to_lang="english"):
#     translator = Translator(from_lang=from_lang, to_lang=to_lang)
#     translation = translator.translate(text)
    
#     if("HTTPS://MYMEMORY.TRANSLATED.NET/DOC/USAGELIMITS.PHP" in translation):
#         core.terminate(1)

#     if(isinstance(translation, str)):
#         translation = html.unescape(translation)
#     return translation
