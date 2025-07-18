@echo off

for /F "tokens=2" %%i in ('date /t') do set mydate=%%i
set mytime=%time%
echo TAIL SIMULATOR: Current time is %mydate%:%mytime%