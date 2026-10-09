# 批量替换 WXML 中的 cloud:// 路径为 {{R.xxx}}
$files = @(
  'pages/home/home.wxml',
  'pages/game/game.wxml',
  'pages/map/map.wxml',
  'pages/shop/shop.wxml'
)

$base = 'cloud://cloud1-d0ge8bft6c22959bf.636c-cloud1-d0ge8bft6c22959bf-1426615585/cangzaina/images/'

$map = @{
  'ad_icon_clean.png' = '{{R.ad_icon_clean}}'
  'box.png' = '{{R.box}}'
  'btn_map-2.png' = '{{R.btn_map}}'
  'btn_skin-2.png' = '{{R.btn_skin}}'
  'calendar.png' = '{{R.calendar}}'
  'check.png' = '{{R.check}}'
  'clear.png' = '{{R.clear}}'
  'coin.png' = '{{R.coin}}'
  'face_lose.png' = '{{R.face_lose}}'
  'gear.png' = '{{R.gear}}'
  'gift.png' = '{{R.gift}}'
  'heart_active.png' = '{{R.heart_active}}'
  'heart_empty.png' = '{{R.heart_empty}}'
  'hint.png' = '{{R.hint}}'
  'home.png' = '{{R.home}}'
  'infinite.png' = '{{R.infinite}}'
  'lock.png' = '{{R.lock}}'
  'logo.png' = '{{R.logo}}'
  'moon.png' = '{{R.moon}}'
  'music.png' = '{{R.music}}'
  'shell.png' = '{{R.shell}}'
  'sound.png' = '{{R.sound}}'
  'star.png' = '{{R.star}}'
  'tap_2.png' = '{{R.tap_2}}'
  'vibrate.png' = '{{R.vibrate}}'
  'share_filled.svg' = '{{R.share_filled}}'
  'share_bg.png' = '{{R.share_bg}}'
  'crab_walk_1.png' = '{{R.crab_walk_1}}'
  'crab_walk_2.png' = '{{R.crab_walk_2}}'
  'crab.png' = '{{R.crab}}'
  'island_1.png' = '{{R.island_1}}'
  'island_3.png' = '{{R.island_3}}'
  'island_sky.png' = '{{R.island_sky}}'
}

foreach ($f in $files) {
  $content = Get-Content $f -Raw -Encoding UTF8
  foreach ($k in $map.Keys) {
    $old = $base + $k
    $new = $map[$k]
    $content = $content.Replace($old, $new)
  }
  Set-Content $f -Value $content -Encoding UTF8 -NoNewline
  Write-Host "Processed $f"
}

Write-Host "Done!"
