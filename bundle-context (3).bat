@echo off
setlocal enabledelayedexpansion
REM Run from the project root (the folder that contains "src").
REM Creates two files:
REM   context-folders.md : everything needed to redo the nested Folders feature
REM   context-urdu.md    : everything needed to redo the earlier Urdu/Kasheeda work
REM Send me context-folders.md first.

REM =====================================================================
REM  1) FOLDERS
REM =====================================================================
set "OUT=context-folders.md"
> "%OUT%" echo # Likho - context bundle: nested Folders feature
>> "%OUT%" echo.
>> "%OUT%" echo Read FOLDERS-PROGRESS.md first. The folder files listed there as done were lost, so they must be rebuilt. If they exist below, they are the recovered copies.
>> "%OUT%" echo.

call :add "FOLDERS-PROGRESS.md"
call :add "AGENTS.md"
call :add "package.json"
call :add "tsconfig.json"
call :add "drizzle.config.ts"

REM --- DB ---
call :add "src\db\schema.ts"
call :add "src\db\index.ts"

REM --- Folder files (only exist if recovered) ---
for %%F in (src\lib\folders\*.ts src\lib\folders\*.tsx) do call :add "%%F"
call :add "src\app\api\folders\_shared.ts"
call :add "src\app\api\folders\route.ts"
call :add "src\app\api\folders\[id]\route.ts"
call :add "src\app\api\notes\[id]\folder\route.ts"
for %%F in (src\components\folders\*.tsx) do call :add "%%F"

REM --- Notes API ---
call :add "src\app\api\notes\_shared.ts"
call :add "src\app\api\notes\route.ts"
call :add "src\app\api\notes\[id]\route.ts"
call :add "src\app\api\notes\[id]\share\route.ts"

REM --- Store + sync (hook depends on these) ---
for %%F in (src\lib\store\*.ts) do call :add "%%F"
for %%F in (src\lib\sync\*.ts) do call :add "%%F"
call :add "src\lib\types.ts"
call :add "src\lib\utils.ts"
call :add "src\lib\session.ts"
call :add "src\lib\auth-client.ts"

REM --- UI to patch ---
call :add "src\components\AppShell.tsx"
call :add "src\components\NotesSidebar.tsx"
call :add "src\components\NoteList.tsx"
call :add "src\components\DeleteNoteDialog.tsx"
call :add "src\components\WritingPad.tsx"
call :add "src\components\SaveButton.tsx"
call :add "src\components\SaveRequiredPrompt.tsx"
call :add "src\components\AppToaster.tsx"
call :add "src\components\Icon.tsx"
call :add "src\components\styles.ts"
call :add "src\components\format.ts"
call :add "src\components\useNow.ts"
call :add "src\components\userDisplay.ts"
call :add "src\components\share\SharePopover.tsx"
call :add "src\components\ui\popover.tsx"
call :add "src\components\ui\dialog.tsx"
call :add "src\components\ui\sheet.tsx"
call :add "src\components\ui\button.tsx"
call :add "src\app\dashboard\page.tsx"
call :add "src\app\page.tsx"

echo.
echo Created %OUT%

REM =====================================================================
REM  2) URDU / KASHEEDA
REM =====================================================================
set "OUT=context-urdu.md"
> "%OUT%" echo # Likho - context bundle: Urdu / Kasheeda work
>> "%OUT%" echo.
>> "%OUT%" echo Earlier work to redo: Kasheeda size-adjust 125%% and font file, bold Urdu fix, corrected Urdu keymap (U types the hamza-yeh letter), live keyboard layout panel, English / Urdu toggle embedded in the notebook.
>> "%OUT%" echo.

call :add "KASHEEDA-SETUP.md"
call :add "src\app\globals.css"
call :add "src\app\layout.tsx"
call :add "src\lib\urdu\keymap.ts"
call :add "src\components\editor\urdu.ts"
call :add "src\components\editor\editor.css"
call :add "src\components\editor\NoteEditor.tsx"
call :add "src\components\editor\theme.ts"
call :add "src\components\editor\livePreview.ts"
call :add "src\components\editor\syntax.ts"
call :add "src\components\UrduKeyboard.tsx"
call :add "src\components\UrduLayoutPanel.tsx"
call :add "src\components\UrduToggle.tsx"
call :add "src\components\FontPopover.tsx"
call :add "src\components\appearance.ts"
call :add "src\components\WritingPad.tsx"
call :add "src\components\WritingPad.css"
call :add "src\components\SegmentedControl.tsx"
call :add "src\components\shared-note.css"
call :add "src\components\share\shared-note.css"

echo.
echo Created %OUT%
echo.
for %%A in (context-folders.md context-urdu.md) do echo %%A : %%~zA bytes
endlocal
exit /b 0

:add
set "P=%~1"
if not exist "%P%" (
  echo [skip] %P%
  exit /b 0
)
set "EXT=%~x1"
set "LANG=!EXT:~1!"
if /I "!LANG!"=="ts" set "LANG=typescript"
if /I "!LANG!"=="md" set "LANG=markdown"
set "SHOW=!P:\=/!"
>> "%OUT%" echo.
>> "%OUT%" echo ## !SHOW!
>> "%OUT%" echo.
>> "%OUT%" echo ```!LANG!
>> "%OUT%" type "%P%"
>> "%OUT%" echo.
>> "%OUT%" echo ```
echo [ok]   %P%
exit /b 0
