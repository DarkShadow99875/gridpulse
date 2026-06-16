# GridPulse - Avvio rapido (versione semplice per PowerShell 5.1)

Write-Host "Caricamento variabili da .env..." -ForegroundColor Cyan

if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            $value = $value.Trim('"''')
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            Write-Host "   $name = $value" -ForegroundColor DarkGray
        }
    }
    Write-Host "Variabili caricate." -ForegroundColor Green
} else {
    Write-Host "File .env non trovato. Uso valori di default." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Avvio backend con profilo local..." -ForegroundColor Cyan
Write-Host ""

Set-Location backend
$env:SPRING_PROFILES_ACTIVE = "local"

if (Test-Path ".\mvnw.cmd") {
    .\mvnw.cmd spring-boot:run
} else {
    mvn spring-boot:run
}
