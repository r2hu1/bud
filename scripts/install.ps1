$ErrorActionPreference = "Stop"

$repo = "r2hu1/bud"
$binaryName = "bud.exe"

Write-Host "Installing bud..."

$os = "windows"
$arch = $env:PROCESSOR_ARCHITECTURE

if ($arch -eq "AMD64") {
    $arch = "x64"
} elseif ($arch -eq "ARM64") {
    $arch = "arm64"
} else {
    Write-Host "Unsupported architecture: $arch"
    exit 1
}

$filename = "bud-$os-$arch.exe"
$url = "https://github.com/$repo/releases/latest/download/$filename"

$tmp = New-TemporaryFile

Write-Host "Downloading $filename..."
Invoke-WebRequest -Uri $url -OutFile $tmp

$installDir = "$env:USERPROFILE\.local\bin"

if (!(Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir | Out-Null
}

$dest = Join-Path $installDir $binaryName
Move-Item $tmp $dest -Force

Write-Host "Installed to $dest"

$path = [Environment]::GetEnvironmentVariable("PATH", "User")

if ($path -notlike "*$installDir*") {
    Write-Host "Adding to PATH..."
    [Environment]::SetEnvironmentVariable(
        "PATH",
        "$installDir;$path",
        "User"
    )
    Write-Host "Restart terminal to use bud"
}

Write-Host ""
Write-Host "✔ bud installed successfully"
Write-Host "Run: bud setup"
