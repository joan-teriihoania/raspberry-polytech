if [ "$1" = "force" ] then
    sudo pkill -f raspberry-polytech
    sudo python3.7 /home/jopro/raspberry-polytech/main.py
    exit 0
fi

FILE=/home/jopro/raspberry-polytech/ressources/tmp_active_check
if test -f "$FILE"; then
    rm "$FILE"
fi
echo "CHECKING FOR ACTIVITY (THIS FILE SHOULD BE REMOVED BY 3 SECONDS AFTER ITS CREATION IF IN INSTANCE IS RUNNING)" > "$FILE" 
sleep 3
if test -f "$FILE"; then
    sudo python3.7 /home/jopro/raspberry-polytech/main.py
fi

exit 0