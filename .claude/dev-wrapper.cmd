@echo off
set "NODEDIR=C:\Users\benne\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.18.0-win-x64"
set "PATH=%NODEDIR%;%PATH%"
cd /d "%~dp0.."
"%NODEDIR%\npm.cmd" run dev
