from translate import Translator
import html
import core


def translate(text, from_lang="french", to_lang="english"):
    translator= Translator(from_lang=from_lang, to_lang=to_lang)
    translation = translator.translate(text)
    
    if("HTTPS://MYMEMORY.TRANSLATED.NET/DOC/USAGELIMITS.PHP" in translation):
        core.terminate(1)

    if(isinstance(translation, str)):
        translation = html.unescape(translation)
    return translation