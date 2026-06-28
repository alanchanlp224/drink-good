# Download the latest Drink Good release zip and replace an unpacked extension folder.
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$ExtensionFolder,

    [string]$GitHubRepo = $env:GITHUB_REPO
)

$ErrorActionPreference = "Stop"

if (-not $GitHubRepo) {
    $GitHubRepo = "alanchanlp224/drink-good"
}

$ZipName = "drink-good.zip"
$ApiUrl = "https://api.github.com/repos/$GitHubRepo/releases/latest"

if (-not (Test-Path -LiteralPath $ExtensionFolder -PathType Container)) {
    throw "Target folder does not exist: $ExtensionFolder"
}

Write-Host "Fetching latest release from $GitHubRepo..."
$headers = @{
    Accept = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}
$release = Invoke-RestMethod -Uri $ApiUrl -Headers $headers
$asset = $release.assets | Where-Object { $_.name -eq $ZipName } | Select-Object -First 1

if (-not $asset) {
    throw "No $ZipName asset on latest release. Publish a release with the CI zip first."
}

$tempRoot = Join-Path $env:TEMP ("drink-good-update-" + [guid]::NewGuid().ToString())
$zipPath = Join-Path $tempRoot $ZipName
$extractDir = Join-Path $tempRoot "extract"

try {
    New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null
    Write-Host "Downloading $($release.tag_name)..."
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipPath
    Expand-Archive -LiteralPath $zipPath -DestinationPath $extractDir -Force

    Write-Host "Updating $ExtensionFolder..."
    Get-ChildItem -LiteralPath $ExtensionFolder -Force | Remove-Item -Recurse -Force
    Copy-Item -Path (Join-Path $extractDir "*") -Destination $ExtensionFolder -Recurse -Force

    Write-Host "Done. Open chrome://extensions and click Reload on Drink Good."
}
finally {
    if (Test-Path -LiteralPath $tempRoot) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force
    }
}
