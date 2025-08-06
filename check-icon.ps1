# PowerShell script to check if icon is embedded in the executable
$exePath = "dist\win-unpacked\Escriba.exe"

if (Test-Path $exePath) {
    Write-Host "Checking icon for: $exePath" -ForegroundColor Green
    
    # Get file properties
    $fileInfo = Get-ItemProperty $exePath
    Write-Host "File exists: $($fileInfo.Name)" -ForegroundColor Yellow
    
    # Try to get icon information
    try {
        $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($exePath)
        if ($icon) {
            Write-Host "Icon found! Size: $($icon.Width)x$($icon.Height)" -ForegroundColor Green
            Write-Host "Icon format: $($icon.ToString())" -ForegroundColor Cyan
        } else {
            Write-Host "No icon found in executable" -ForegroundColor Red
        }
    } catch {
        Write-Host "Error extracting icon: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Check installer too
    $installerPath = "dist\Escriba Setup 1.0.0.exe"
    if (Test-Path $installerPath) {
        Write-Host "`nChecking installer icon..." -ForegroundColor Green
        try {
            $installerIcon = [System.Drawing.Icon]::ExtractAssociatedIcon($installerPath)
            if ($installerIcon) {
                Write-Host "Installer icon found! Size: $($installerIcon.Width)x$($installerIcon.Height)" -ForegroundColor Green
            }
        } catch {
            Write-Host "Error extracting installer icon: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
} else {
    Write-Host "Executable not found at: $exePath" -ForegroundColor Red
    Write-Host "Please run 'npm run build-win' first" -ForegroundColor Yellow
}

Write-Host "`nNote: If icons don't appear in Windows Explorer, try:" -ForegroundColor Cyan
Write-Host "1. Run refresh-icons.bat as administrator" -ForegroundColor White
Write-Host "2. Restart Windows Explorer" -ForegroundColor White
Write-Host "3. Install the app using the installer" -ForegroundColor White