$projectRoot = Get-Item "c:\Users\user\.gemini\antigravity\scratch\*小程序" | Select-Object -First 1 -ExpandProperty FullName
$imagesDir = Join-Path $projectRoot "images"

$images = Get-ChildItem $imagesDir -File | ForEach-Object { $_.Name }

# Collect all source files
$sourceFiles = @()
$exts = @("*.js","*.json","*.wxml","*.wxss")
foreach ($ext in $exts) {
    $sourceFiles += Get-ChildItem $projectRoot -Recurse -File -Filter $ext -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "\\images\\" }
}

$unused = @()
foreach ($img in $images) {
    $found = $false
    foreach ($sf in $sourceFiles) {
        $content = Get-Content $sf.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -and $content.Contains($img)) {
            $found = $true
            break
        }
    }
    if (-not $found) {
        $size = (Get-Item (Join-Path $imagesDir $img)).Length
        $sizeKB = [math]::Round($size / 1024)
        $unused += "$img ($sizeKB KB)"
    }
}

Write-Output "=== Unused Images: $($unused.Count) ==="
foreach ($u in $unused) {
    Write-Output $u
}
