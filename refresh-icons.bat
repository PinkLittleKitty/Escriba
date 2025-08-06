@echo off
echo Refreshing Windows icon cache...
ie4uinit.exe -show
taskkill /f /im explorer.exe
start explorer.exe
echo Icon cache refreshed! Please check your executable now.
pause