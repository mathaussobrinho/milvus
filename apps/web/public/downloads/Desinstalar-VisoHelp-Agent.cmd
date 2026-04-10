@echo off
title VisoHelp Agent - Desinstalar
REM Remove arranque automatico, atalho na area de trabalho e pasta %LocalAppData%\VisoHelp
REM Encerra o processo VisoHelp.Agent se estiver a correr. Nao requer administrador.

powershell -NoProfile -ExecutionPolicy Bypass -Command "& { $ErrorActionPreference = 'SilentlyContinue'; Get-Process -Name 'VisoHelp.Agent' -ErrorAction SilentlyContinue | Stop-Process -Force; Remove-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'VisoHelpAgent' -ErrorAction SilentlyContinue; $desk = [Environment]::GetFolderPath('Desktop'); Remove-Item -LiteralPath (Join-Path $desk 'VisoHelp Abrir chamado.url') -ErrorAction SilentlyContinue; Remove-Item -LiteralPath (Join-Path $env:LOCALAPPDATA 'VisoHelp') -Recurse -Force -ErrorAction SilentlyContinue; Write-Host ''; Write-Host 'VisoHelp Agent removido.' }"

echo.
pause
