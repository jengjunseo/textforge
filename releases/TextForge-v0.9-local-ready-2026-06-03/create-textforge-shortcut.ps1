$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$iconPath = Join-Path $root "TextForge.ico"
$launcherPath = Join-Path $root "launch-textforge-app.bat"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "TextForge.lnk"

Add-Type -AssemblyName System.Drawing

$bitmap = New-Object System.Drawing.Bitmap 256, 256
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml("#202328"))

$whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#F1F3F5"))
$accentBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#6EA8FE"))

$graphics.FillRectangle($whiteBrush, 54, 62, 148, 34)
$graphics.FillRectangle($whiteBrush, 111, 92, 34, 112)
$graphics.FillRectangle($accentBrush, 111, 127, 101, 34)

$hicon = $bitmap.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hicon)
$stream = [System.IO.File]::Create($iconPath)
$icon.Save($stream)
$stream.Close()

$graphics.Dispose()
$whiteBrush.Dispose()
$accentBrush.Dispose()
$bitmap.Dispose()

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $env:ComSpec
$shortcut.Arguments = "/c `"`"$launcherPath`"`""
$shortcut.WorkingDirectory = $root
$shortcut.IconLocation = "$iconPath,0"
$shortcut.Description = "TextForge local document workspace"
$shortcut.Save()

Write-Output "Created: $shortcutPath"
Write-Output "Icon: $iconPath"
