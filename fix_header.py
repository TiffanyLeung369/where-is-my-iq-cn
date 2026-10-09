import re

with open(r'pages/game/game.wxml', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace row 2 left item
row2_target = r'''      <!-- 第二行：金币\+ 红心居中 -->\s*<view class="header-row">\s*<view class="left-item">\s*<view class="coin-display \{\{coinVaultPulse \? 'coin-pulse' : ''\}\}">\s*<image src="\{\{R\.coin\}\}" class="coin-icon" mode="aspectFit" />\s*<text class="coin-value">\{\{coins\}\}</text>\s*</view>\s*</view>'''
row2_repl = r'''      <!-- 第二行：红心居中 -->\n      <view class="header-row" wx:if="{{mode === 'daily' || mode === 'survival'}}">\n        <view class="left-item"></view>'''
content = re.sub(row2_target, row2_repl, content)

# Replace row 3 left item
row3_target = r'''      <!-- 第三行：倒计时（每日挑战和生存模式显示） -->\s*<view class="header-row" wx:if="\{\{mode === 'daily' \|\| mode === 'survival'\}\}">\s*<view class="left-item"></view>'''
row3_repl = r'''      <!-- 第三行：金币 + 倒计时（每日挑战和生存模式显示） -->\n      <view class="header-row" wx:if="{{mode === 'daily' || mode === 'survival'}}">\n        <view class="left-item">\n          <view class="coin-display {{coinVaultPulse ? 'coin-pulse' : ''}}">\n            <image src="{{R.coin}}" class="coin-icon" mode="aspectFit" />\n            <text class="coin-value">{{coins}}</text>\n          </view>\n        </view>'''
content = re.sub(row3_target, row3_repl, content)

with open(r'pages/game/game.wxml', 'w', encoding='utf-8') as f:
    f.write(content)

print('Replaced')
