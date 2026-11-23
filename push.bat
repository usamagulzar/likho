@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
title Auto Push - GitHub + Vercel

echo ============================================
echo   GitHub + Vercel auto push
echo ============================================
echo.

REM ---------------------------------------------------------------
REM  0. Tools check
REM ---------------------------------------------------------------
where git >nul 2>&1
if errorlevel 1 (
  echo [X] Git is not installed. Get it from https://git-scm.com/download/win
  goto :fail
)

REM ---------------------------------------------------------------
REM  1. Git repo + identity + .gitignore safety
REM ---------------------------------------------------------------
if not exist ".git" (
  echo [setup] No git repo here. Initialising...
  git init -b main
  if errorlevel 1 goto :fail
)

set "GN="
set "GE="
for /f "delims=" %%i in ('git config user.name 2^>nul') do set "GN=%%i"
for /f "delims=" %%i in ('git config user.email 2^>nul') do set "GE=%%i"
if "!GN!"=="" (
  set /p "GN=[setup] Your name for commits: "
  git config user.name "!GN!"
)
if "!GE!"=="" (
  set /p "GE=[setup] Your email for commits: "
  git config user.email "!GE!"
)

set "BRANCH="
for /f "delims=" %%i in ('git branch --show-current 2^>nul') do set "BRANCH=%%i"
if "!BRANCH!"=="" set "BRANCH=main"

if not exist ".gitignore" type nul > ".gitignore"
call :ensure_ignore .env
call :ensure_ignore .env.local
call :ensure_ignore .vercel
call :ensure_ignore node_modules
call :ensure_ignore .next
REM make sure secrets are never tracked even if they were added earlier
git rm -r --cached --ignore-unmatch -q .env .env.local >nul 2>&1

REM ---------------------------------------------------------------
REM  2. Commit (asks for a message)
REM ---------------------------------------------------------------
echo.
echo Branch: !BRANCH!
git add -A
git diff --cached --quiet
if errorlevel 1 (
  git rev-parse --verify HEAD >nul 2>&1
  if errorlevel 1 (
    set "DEFMSG=Initial commit"
  ) else (
    set "DEFMSG=Update !DATE! !TIME:~0,5!"
  )
  set "MSG="
  set /p "MSG=Commit message [Enter = !DEFMSG!]: "
  if "!MSG!"=="" set "MSG=!DEFMSG!"
  >"%TEMP%\gitmsg.txt" echo(!MSG!
  git commit -F "%TEMP%\gitmsg.txt"
  if errorlevel 1 goto :fail
  del "%TEMP%\gitmsg.txt" >nul 2>&1
) else (
  echo Nothing new to commit.
)

REM ---------------------------------------------------------------
REM  3. GitHub remote (first time only)
REM ---------------------------------------------------------------
git remote get-url origin >nul 2>&1
if errorlevel 1 goto :make_remote
goto :push

:make_remote
echo.
echo [setup] No GitHub remote yet.
where gh >nul 2>&1
if errorlevel 1 goto :manual_remote
gh auth status >nul 2>&1
if errorlevel 1 (
  echo [setup] Logging in to GitHub in your browser...
  gh auth login -w
  if errorlevel 1 goto :manual_remote
)
set "REPO="
set /p "REPO=[setup] New GitHub repo name: "
if "!REPO!"=="" goto :manual_remote
set "VIS="
set /p "VIS=[setup] Private repo? [Y/n]: "
set "VFLAG=--private"
if /i "!VIS!"=="n" set "VFLAG=--public"
gh repo create "!REPO!" !VFLAG! --source=. --remote=origin --push
if errorlevel 1 goto :manual_remote
goto :push

:manual_remote
echo.
echo Create an EMPTY repo at https://github.com/new  (no README), then paste its URL.
echo Tip: "winget install GitHub.cli" makes this step fully automatic next time.
set "URL="
set /p "URL=Repo URL (https://github.com/you/repo.git): "
if "!URL!"=="" (
  echo [X] No URL given.
  goto :fail
)
git remote add origin "!URL!"
if errorlevel 1 goto :fail

REM ---------------------------------------------------------------
REM  4. Push
REM ---------------------------------------------------------------
:push
echo.
echo Pushing to GitHub...
git push -u origin "!BRANCH!"
if errorlevel 1 (
  echo.
  echo Push was rejected. Trying pull --rebase then push again...
  git pull --rebase origin "!BRANCH!"
  if errorlevel 1 (
    echo [X] Merge conflict. Fix the files, run: git rebase --continue, then run this script again.
    goto :fail
  )
  git push -u origin "!BRANCH!"
  if errorlevel 1 goto :fail
)
echo [OK] Pushed to GitHub.

REM ---------------------------------------------------------------
REM  5. Vercel (first time only)
REM ---------------------------------------------------------------
if exist ".vercel\project.json" goto :done

echo.
echo [setup] Vercel is not linked yet. Setting it up...
where npx >nul 2>&1
if errorlevel 1 (
  echo [X] Node.js is not installed. Get it from https://nodejs.org
  goto :fail
)
set "VC=npx --yes vercel@latest"
where vercel >nul 2>&1
if not errorlevel 1 set "VC=vercel"

call !VC! whoami >nul 2>&1
if errorlevel 1 (
  echo [setup] Log in to Vercel in your browser...
  call !VC! login
  if errorlevel 1 goto :fail
)

set "VNAME="
set /p "VNAME=[setup] Vercel project name (lowercase, no spaces): "
if "!VNAME!"=="" (
  call !VC! link
) else (
  call !VC! link --yes --project "!VNAME!"
  if errorlevel 1 call !VC! link
)
if not exist ".vercel\project.json" (
  echo [X] Vercel link did not complete.
  goto :fail
)

echo.
echo [setup] Connecting the GitHub repo to Vercel, so every push deploys automatically...
call !VC! git connect --yes
if errorlevel 1 (
  echo [warn] Could not connect automatically. In the Vercel dashboard open your project,
  echo     Settings, Git, and connect the GitHub repo. Then pushes will auto deploy.
)

echo.
echo ----------------------------------------------------------------
echo  Add the variables from .env.example in Vercel now:
echo  Project, Settings, Environment Variables. Without them the build may fail.
echo ----------------------------------------------------------------
pause

set "DEP="
set /p "DEP=Deploy to production now? [Y/n]: "
if /i not "!DEP!"=="n" (
  call !VC! --prod
)

:done
echo.
if /i not "!BRANCH!"=="main" (
  echo Note: you are on branch "!BRANCH!". Vercel makes a PREVIEW deploy for it.
  echo       Merge into main for the production site.
)
echo.
echo All done.
pause
exit /b 0

:fail
echo.
echo [X] Stopped because of an error. Read the messages above.
pause
exit /b 1

REM ---------------------------------------------------------------
:ensure_ignore
findstr /x /l /c:%1 ".gitignore" >nul 2>&1
if errorlevel 1 (
  echo.>>".gitignore"
  echo %1>>".gitignore"
)
exit /b 0
