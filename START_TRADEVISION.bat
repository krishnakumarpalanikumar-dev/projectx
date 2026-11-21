@echo off
title Launch TradeVision AI

echo ===================================================
echo           Starting TradeVision AI Stack
echo ===================================================

echo [1/3] Starting FastAPI Backend on port 8000...
start "TradeVision AI - FastAPI Backend" cmd /k "cd /d "%~dp0backend" && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/3] Starting Vite Frontend on port 3000...
start "TradeVision AI - Vite Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening TradeVision AI in default browser...
start http://localhost:3000

echo ===================================================
echo TradeVision AI is running!
echo Backend:  http://localhost:8000 (Docs: /docs)
echo Frontend: http://localhost:3000
echo ===================================================
