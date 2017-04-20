#!/bin/sh

if [ -z "$1" ]; then 
    echo "Sorry script requires an argument for the file you want to pull."
    exit 1
fi

adb shell "run-as akylas.alpi.maps ls '/data/data/akylas.alpi.maps/$1'"
adb shell "run-as akylas.alpi.maps cp '/data/data/akylas.alpi.maps/$1' '/sdcard'"
# adb pull "/sdcard/$1"
# adb shell "rm '/sdcard/$1'"