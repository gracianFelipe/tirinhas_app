@echo off
setlocal
set ADB=C:\platform-tools\adb.exe
set DEST=src\database\reino_das_tirinhas.db

echo [Reino das Tirinhas] Puxando banco de dados atualizado do emulador...
echo.

:: Tenta puxar da pasta de Download pública (não exige root/run-as)
"%ADB%" -s emulator-5554 pull /sdcard/Download/reino_das_tirinhas.db %DEST%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCESSO] Banco de dados copiado para %DEST%
    echo O arquivo ja pode ser aberto no seu PC (DBeaver, DB Browser, etc).
) else (
    echo.
    echo [ERRO] Nao foi possivel encontrar o banco no emulador.
    echo Certifique-se de:
    echo 1. O emulador esta ligado.
    echo 2. Voce clicou no botao "EXPORTAR .DB" dentro do App na tela da Forja.
)

echo.
pause
