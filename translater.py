import html
import urllib.request
from translate import Translator
from translate.providers import base
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
    base_url = "https://raspberry-polytech.joanteriihoania.repl.co/"
    api_url = "/api/v1/device/" + str(device_id) + "/translate"
    data = urllib.request.urlopen(base_url + api_url)
    if(data.getCode() == 200):
        content = data.read()
        content = content.json()
        return content.translation
    return None

def translate_with_Translator(text, from_lang="french", to_lang="english"):
    translator = Translator(from_lang=from_lang, to_lang=to_lang)
    translation = translator.translate(text)
    
    if("HTTPS://MYMEMORY.TRANSLATED.NET/DOC/USAGELIMITS.PHP" in translation):
        core.terminate(1)

    if(isinstance(translation, str)):
        translation = html.unescape(translation)
    return translation

print(translate("salut tout le monde", "fr", "en"))