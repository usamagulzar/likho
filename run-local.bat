@echo off
REM Likho: run locally for testing (Windows).
REM   run-local.bat          Local-only mode (default): no database, sign-in disabled.
REM   run-local.bat --cloud  Re-enable the Neon database.
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js 20+ is required: https://nodejs.org & pause & exit /b 1)
where pnpm >nul 2>nul || call npm install -g pnpm
call pnpm install || exit /b 1
set DATABASE_URL=
set BETTER_AUTH_SECRET=
set BETTER_AUTH_URL=
if /i "%1"=="--cloud" goto cloud
if exist .env.local move /y .env.local .env.local.cloud-backup >nul
echo Local-only mode: database OFF. Notes are stored in your browser.
echo Starting Likho at http://localhost:3000  ^(Ctrl+C to stop^)
call pnpm dev
exit /b

:cloud
if not exist .env.local if exist .env.local.cloud-backup move /y .env.local.cloud-backup .env.local >nul
if not exist .env.local (
  set /p DB_URL=Paste Neon DATABASE_URL: 
  for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"') do set SECRET=%%i
  (
    echo DATABASE_URL=%DB_URL%
    echo BETTER_AUTH_SECRET=%SECRET%
    echo BETTER_AUTH_URL=http://localhost:3000
    echo NEXT_PUBLIC_SITE_URL=http://localhost:3000
    echo GMAIL_USER=
    echo GMAIL_APP_PASSWORD=
  ) > .env.local
)
call pnpm db:migrate || exit /b 1
call pnpm dev
