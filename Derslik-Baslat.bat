@echo off
cd /d "%~dp0"

set "TARGET_URL=http://127.0.0.1:5173/signin-with-chatgpt?return_to=/"

curl --noproxy "*" --fail --silent --output NUL --max-time 2 "%TARGET_URL%"
if %errorlevel% equ 0 (
    start "" "%TARGET_URL%"
    exit /b 0
)

where npm.cmd >nul 2>&1
if %errorlevel% neq 0 (
    echo HATA: npm.cmd bulunamadi. Lutfen Node.js yuklu oldugundan emin olun.
    pause
    exit /b 1
)

start "Derslik Sunucu" cmd /c "npm.cmd run dev -- --hostname 127.0.0.1"

set /a ATTEMPTS=0

:check_loop
if %ATTEMPTS% geq 90 goto timeout_err

timeout /t 2 /nobreak >nul
set /a ATTEMPTS+=1

curl --noproxy "*" --fail --silent --output NUL --max-time 2 "%TARGET_URL%"
if %errorlevel% equ 0 (
    start "" "%TARGET_URL%"
    exit /b 0
)

goto check_loop

:timeout_err
echo HATA: Sunucu 90 denemede hazir hale gelemedi.
pause
exit /b 1
