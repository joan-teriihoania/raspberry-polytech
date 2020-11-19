import sys
import time
import os
import terminalsize

CURSOR_UP_ONE = '\x1b[1A' 
ERASE_LINE = '\x1b[2K'

class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


done = f"{bcolors.OKGREEN}done{bcolors.ENDC}"
failed = f"{bcolors.FAIL}failed{bcolors.ENDC}"
aborted = f"{bcolors.WARNING}aborted{bcolors.ENDC}"

COMMAND_OPTIONS = {
    "display": {
        "TIPS": True,
        "WARN": True
    }
}



# Function that check if a given path of a file exists.
# @Parameters :
# path  String
# @Return Boolean
def fileExists(path):
    if(os.path.isfile(path)):
        if(os.path.exists(path)):
            return True

def deletePrevLines(n=1): 
    for _ in range(n): 
        sys.stdout.write(CURSOR_UP_ONE) 
        sys.stdout.write(ERASE_LINE) 


def overecho(toPrint, type="", end="\n"):
    deletePrevLines()
    echo(toPrint, type, end)

# Function to print text ands logs on the console with time and type information
# @Parameters :
#  toPrint  String
# @Return void
def echo(toPrint, type="", end="\n", tab="  "):
    if(type == ""): type="INFO"
    if(len(type) <= 4): type = type + (" "*(4-len(type)))
    else: type = type[:4]

    color = bcolors.BOLD
    if(type == "INFO"):
        color = bcolors.OKCYAN
    elif(type == "TIPS"):
        if not (COMMAND_OPTIONS['display']['TIPS']): return
        color = bcolors.OKBLUE
    elif(type == "ERRO"):
        color = bcolors.FAIL
    elif(type == "SUCC"):
        color = bcolors.OKGREEN
    elif(type == "WARN"):
        if not (COMMAND_OPTIONS['display']['WARN']): return
        color = bcolors.WARNING
    elif(type == "FATA"):
        color = bcolors.HEADER

    if(isinstance(toPrint, list)):
        for elt in toPrint:
            echo(tab + str(elt), type, end)
        return
    
    
    if(len(toPrint.split("\n"))>1):
        echo(str(toPrint).split("\n"), type, end, tab)
        return


    if(toPrint == ""): return
    
    toPrint = f"[{color}{type}{bcolors.ENDC}][{time.strftime('%H:%M:%S', time.localtime())}] {color}{toPrint}{bcolors.ENDC}"
    columns, rows = terminalsize.get_terminal_size()
    if(len(toPrint) >= columns):
        print(str(toPrint[:columns-10]) + "...")
    else:
        print(toPrint, end=end)
    

# Function that exit the algorithm with an exit code of 0.
# Only purpose : Simplify the exit instruction.
def terminate(code = 0, msg = ""):
    if msg != "":
        typeReason = "FATAL"
        if(code >= 0): typeReason = "EXIT"
        echo(msg, typeReason, tab="")

    echo("Script terminated with code " + str(code), "EXIT")
    sys.exit(code)