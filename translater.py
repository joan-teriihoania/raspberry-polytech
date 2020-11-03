from translate import Translator



def translate(str, from_lang="french", to_lang="english"):
    translator= Translator(from_lang=from_lang, to_lang=to_lang)
    translation = translator.translate(str)
    return translation