@echo off
:: Agendador de Tarefas do Windows
:: Roda o painel toda SEGUNDA-FEIRA às 11:00
:: Execute este arquivo como Administrador (clique direito > Executar como administrador)

set SCRIPT_DIR=%~dp0
set PYTHON_SCRIPT=%SCRIPT_DIR%atualizar_e_enviar.py

echo Criando tarefa agendada: "JCPM Painel Semana"...

:: Remove tarefa antiga se existir
schtasks /delete /tn "JCPM Painel Semana" /f 2>nul

:: Cria nova tarefa: toda segunda-feira às 11:00
schtasks /create ^
  /tn "JCPM Painel Semana" ^
  /tr "python \"%PYTHON_SCRIPT%\"" ^
  /sc WEEKLY ^
  /d MON ^
  /st 11:00 ^
  /ru "%USERNAME%" ^
  /rl HIGHEST ^
  /f

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Tarefa criada com sucesso!
    echo    Nome: JCPM Painel Semana
    echo    Agenda: Toda segunda-feira às 11:00
    echo    Script: %PYTHON_SCRIPT%
    echo.
    echo Para verificar: Abra o "Agendador de Tarefas" do Windows e procure por "JCPM Painel Semana"
) else (
    echo.
    echo ❌ Erro ao criar tarefa. Certifique-se de executar como Administrador.
)

pause
