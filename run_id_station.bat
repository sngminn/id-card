@echo off
chcp 65001
echo ==========================================
echo  PureClient ID Station - Web Launcher
echo ==========================================
echo.

:: 1. Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js가 설치되지 않았습니다.
    echo https://nodejs.org/ 에서 LTS 버전을 설치해주세요.
    pause
    exit
)

:: 2. Install Dependencies (if needed)
if not exist "node_modules" (
    echo [INFO] 라이브러리 설치 중... (첫 실행이라 시간이 걸립니다)
    call npm install
)

:: 3. Build Project (Updates)
echo [INFO] 최신 버전 빌드 중...
call npm run build

:: 4. Run Server
echo.
echo [SUCCESS] 프로그램을 실행합니다!
echo 브라우저가 자동으로 열리지 않으면 http://localhost:4173 으로 접속하세요.
echo.
echo (프로그램을 끄려면 이 창을 닫으세요)
echo.

:: Opens default browser and runs preview
start http://localhost:4173
call npm run preview -- --host
pause
