import html
import urllib
import json
#from translate import Translator
#from translate.providers import base
import core
import jz_translation_server

# @Desc : Translate given text from a language to another
# @Params:
#  - text: Text to translate
#  - from_lang: Language of text
#  - to_lang: Language to translate to
# @Returns: The translated text
# @Exception:
#   UsageLimit: If the API has used the daily quota of translation assigned
def translate(text, from_lang="fr", to_lang="en"):
    status, res = jz_translation_server.send_get("/device/:device_id:/translate", {
        "from_lang": from_lang,
        "to_lang": to_lang,
        "text": text
    })

    if(status == 200):
        return status, res['translation']
    if(status != 200):
        core.echo("[HTTP]["+str(status)+"] " + str(res), "ERROR")
    if(status == 402):
        core.terminate(1)

    return status, res

# def translate_with_Translator(text, from_lang="french", to_lang="english"):
#     translator = Translator(from_lang=from_lang, to_lang=to_lang)
#     translation = translator.translate(text)
    
#     if("HTTPS://MYMEMORY.TRANSLATED.NET/DOC/USAGELIMITS.PHP" in translation):
#         core.terminate(1)

#     if(isinstance(translation, str)):
#         translation = html.unescape(translation)
#     return translation

# for i in range(20):
#     status, data = translate("bonjour tout le monde")
#     if(status == 200):
#         print(data)
#     else:
#         print('An error occured : ' + str(data))