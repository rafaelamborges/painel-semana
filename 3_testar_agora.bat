@echo off
:: Executa o script agora para testar (sem esperar a segunda-feira)
echo Executando atualizacao e envio de e-mail...
echo.
python "%~dp0atualizar_e_enviar.py"
echo.
pause
