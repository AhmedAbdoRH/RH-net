@echo off
chcp 65001 >nul
cd /d C:\Users\Ahmed\RH-net-2
start /b npm run dev
timeout /t 5 /nobreak >nul
start chrome http://localhost:3000
