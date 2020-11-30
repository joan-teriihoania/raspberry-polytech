from translate import Translator
import html
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
    translator = Translator(from_lang=from_lang, to_lang=to_lang)
    translation = translator.translate(text)
    
    if("HTTPS://MYMEMORY.TRANSLATED.NET/DOC/USAGELIMITS.PHP" in translation):
        core.terminate(1)

    if(isinstance(translation, str)):
        translation = html.unescape(translation)
    return translation