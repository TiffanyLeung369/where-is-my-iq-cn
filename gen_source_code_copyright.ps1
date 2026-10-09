# Source code copyright material generator (H5 version)
# Generates front 1501 lines and back 1501 lines

$baseDir = 'c:\Users\user\.gemini\antigravity\scratch'
$projectDir = Join-Path $baseDir ([char]0x85CF + [char]0x5728 + [char]0x54EA + '_H5' + [char]0x56FD + [char]0x5185 + [char]0x7248)
$outDirName = [char]0x8F6F + [char]0x8457 + [char]0x7533 + [char]0x8BF7 + [char]0x6750 + [char]0x6599
$outDir = Join-Path $projectDir $outDirName
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

$files = @(
  'index.html',
  'js/app.js',
  'js/router.js',
  'js/main.js',
  'js/components/toast.js',
  'js/components/modal.js',
  'js/utils/audioManager.js',
  'js/utils/adManager.js',
  'js/pages/home.js',
  'js/pages/game.js',
  'js/pages/map.js',
  'js/pages/shop.js',
  'utils/gameConfig.js',
  'utils/presetPuzzles.js',
  'utils/puzzleGenerator.js',
  'utils/dailyPuzzles.js',
  'css/global.css',
  'css/home.css',
  'css/game.css',
  'css/map.css',
  'css/shop.css'
)

$titleLine = ([char]0x8F6F + [char]0x4EF6 + [char]0x540D + [char]0x79F0 + [char]0xFF1A + [char]0x770B + [char]0x4F60 + [char]0x667A + [char]0x5546 + [char]0x85CF + [char]0x54EA + ' V1.0')

$allLines = [System.Collections.Generic.List[string]]::new()
$allLines.Add($titleLine)
$allLines.Add('')

foreach ($f in $files) {
  $fullPath = Join-Path $projectDir ($f -replace '/', '\')
  if (!(Test-Path $fullPath)) {
    Write-Host "WARNING: File not found: $f"
    continue
  }
  $allLines.Add("// ===== File: $f =====")
  $content = [System.IO.File]::ReadAllLines($fullPath, [System.Text.Encoding]::UTF8)
  foreach ($line in $content) {
    if ($line.Trim().Length -gt 0) {
      $allLines.Add($line)
    }
  }
}

$effective = [System.Collections.Generic.List[string]]::new()
$effective.Add($allLines[0])
$effective.Add('')
for ($i = 2; $i -lt $allLines.Count; $i++) {
  $line = $allLines[$i]
  if ($line.Trim().Length -gt 0) {
    $effective.Add($line)
  }
}

$totalLines = $effective.Count
Write-Host "Total effective lines: $totalLines"

$frontName = ([char]0x6E90 + [char]0x4EE3 + [char]0x7801 + '_' + [char]0x524D + '30' + [char]0x9875 + '.txt')
$backName = ([char]0x6E90 + [char]0x4EE3 + [char]0x7801 + '_' + [char]0x540E + '30' + [char]0x9875 + '.txt')

# Front 1501 lines
$frontCount = [Math]::Min(1501, $totalLines)
$frontFile = Join-Path $outDir $frontName
$encoding = New-Object System.Text.UTF8Encoding($true)
$sw = [System.IO.StreamWriter]::new($frontFile, $false, $encoding)
for ($i = 0; $i -lt $frontCount; $i++) {
  $sw.WriteLine($effective[$i])
}
$sw.Close()
Write-Host "Front file: $frontCount lines -> $frontFile"

# Back 1501 lines
$backCount = [Math]::Min(1501, $totalLines)
$startIdx = [Math]::Max(0, $totalLines - $backCount)
$backFile = Join-Path $outDir $backName
$sw2 = [System.IO.StreamWriter]::new($backFile, $false, $encoding)
for ($i = $startIdx; $i -lt $totalLines; $i++) {
  $sw2.WriteLine($effective[$i])
}
$sw2.Close()
$actualBack = $totalLines - $startIdx
Write-Host "Back file: $actualBack lines -> $backFile"
Write-Host "Done!"
