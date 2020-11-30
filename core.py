import sys
import time
import os
import terminalsize
import threading

CURSOR_UP_ONE = '\x1b[1A' 
ERASE_LINE = '\x1b[2K'
shutdown = False

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

# Set to FALSE to disable specified channel of echo function
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

# Replace the previous line by a new one
def overecho(toPrint, type="", end="\n"):
    deletePrevLines()
    echo(toPrint, type, end, isoverecho=True)

# Function to print text ands logs on the console with time and type information
# @Parameters :
#  toPrint  (String | Array)
#  type String: Type of text [INFO, TIPS, ERROR, SUCCESS, WARN, FATAL] that will influence the formatting
#  end String: Changes the end of the print() function
#  tab String: When passing an array in toPrint, the elements are passed recursively one by one with tab at the beginning
#  isoverecho Bool: Internal variable if the calling func is overecho
# @Return void
lastToPrint = ""
nbRepeatPrint = 0
def echo(toPrint, type="", end="\n", tab="  ", isoverecho=False):
    global lastToPrint
    global nbRepeatPrint

    if(not isoverecho):
        if(toPrint == lastToPrint):
            nbRepeatPrint += 1
        else:
            nbRepeatPrint = 0
    lastToPrint = toPrint

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
    
    repeatTag = ""
    if(nbRepeatPrint > 0):
        deletePrevLines()
        repeatTag = f" [x{nbRepeatPrint}]"
        time.sleep(0.1)

    toPrint = f"[{color}{type}{bcolors.ENDC}][{time.strftime('%H:%M:%S', time.localtime())}]{repeatTag} {color}{toPrint}{bcolors.ENDC}"
    columns, rows = terminalsize.get_terminal_size()
    if(len(toPrint) >= columns):
        print(str(toPrint[:columns-10]) + "...")
    else:
        print(toPrint, end=end)
    

# Function that exit the algorithm with an exit code of `code`.
# Only purpose : Simplify the exit instruction.
def terminate(code = 0, msg = ""):
    if msg != "":
        typeReason = "FATAL"
        if(code >= 0): typeReason = "EXIT"
        echo(msg, typeReason, tab="")

    #echo("Script terminated with code " + str(code), "EXIT")
    sys.exit(code)

# @Desc Remove the check file while the process is running
# @Note Check file is a file created by a external control process to see if an instance is running
#       After 3 seconds, if the check file is not deleted, if considers the instance inactive and will execute another one
def removeCheckFile():
    while not shutdown:
        if(fileExists("/home/jopro/raspberry-polytech/ressources/tmp_active_check")):
            os.unlink("/home/jopro/raspberry-polytech/ressources/tmp_active_check")
        time.sleep(1)

# Creates a running thread of removeCheckFile() at start
t = threading.Thread(target=removeCheckFile)
t.start()
