# Convert rawPuzzles.json to compact dailyPuzzles.js
$ErrorActionPreference = 'Stop'
$base = Split-Path -Parent $PSScriptRoot
if (-not $base) { $base = (Get-Location).Path }
$jsonPath = Join-Path $PSScriptRoot 'rawPuzzles.json'
if (-not (Test-Path $jsonPath)) {
    $jsonPath = Join-Path (Get-Location).Path 'scripts\rawPuzzles.json'
}
$raw = [System.IO.File]::ReadAllText($jsonPath)
$puzzles = $raw | ConvertFrom-Json
$hexChars = '0123456789ab'
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('const D=[')
foreach ($puzzle in $puzzles) {
    $regHex = New-Object System.Text.StringBuilder
    for ($row = 0; $row -lt 12; $row++) {
        for ($col = 0; $col -lt 12; $col++) {
            $val = [int]$puzzle.regions[$row][$col]
            [void]$regHex.Append($hexChars[$val])
        }
    }
    $starCols = New-Object System.Collections.ArrayList
    for ($row = 0; $row -lt 12; $row++) {
        for ($col = 0; $col -lt 12; $col++) {
            if ([int]$puzzle.solution[$row][$col] -eq 1) {
                [void]$starCols.Add($col)
                break
            }
        }
    }
    $colStr = $starCols -join ','
    [void]$sb.AppendLine('["' + $regHex.ToString() + '",[' + $colStr + ']],')
}
[void]$sb.AppendLine('];')
$jsCode = @'
function dr(h){var g=[];for(var r=0;r<12;r++){var w=[];for(var c=0;c<12;c++){var x=h[r*12+c];w.push(x>='a'?x.charCodeAt(0)-87:parseInt(x))}g.push(w)}return g}
function getDailyPuzzle(){var n=new Date();var s=new Date(n.getFullYear(),0,0);var d=Math.floor((n-s)/864e5);var i=d%D.length;var h=D[i][0];var sc=D[i][1];var r=dr(h);var sol=[];for(var j=0;j<12;j++){var row=[];for(var k=0;k<12;k++)row.push(k===sc[j]?1:0);sol.push(row)}return{size:12,starsPerUnit:1,regions:r,solution:sol,difficulty:8}}
module.exports={getDailyPuzzle:getDailyPuzzle,DAILY_PUZZLE_COUNT:100};
'@
[void]$sb.Append($jsCode)
$outPath = Join-Path (Get-Location).Path 'utils\dailyPuzzles.js'
[System.IO.File]::WriteAllText($outPath, $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Host "Done! $($puzzles.Count) puzzles -> $outPath"
