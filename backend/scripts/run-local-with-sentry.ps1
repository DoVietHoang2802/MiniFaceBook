# Chay BE profile local (doc application-local.yml — DSN trong file, khong can $env moi lan)
# Tao file: backend/src/main/resources/application-local.yml (xem .example)

$localYml = Join-Path $PSScriptRoot "..\src\main\resources\application-local.yml"
if (-not (Test-Path $localYml)) {
  Write-Host "Thieu application-local.yml" -ForegroundColor Yellow
  Write-Host "Copy application-local.yml.example -> application-local.yml va dan DSN Spring Boot"
  exit 1
}

Write-Host "Profile: local | file: application-local.yml" -ForegroundColor Green
Write-Host "Test sau khi len: http://localhost:8080/api/dev/sentry-test" -ForegroundColor Cyan

Set-Location (Join-Path $PSScriptRoot "..")
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
