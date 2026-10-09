import os

files = ['pages/game/game.wxml', 'pages/home/home.wxml', 'pages/shop/shop.wxml']
REPLACE_CHAR = chr(0xfffd)

for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Apply all specific text replacements
    text = text.replace('藏在' + REPLACE_CHAR, '藏在哪')
    text = text.replace('全网同一' + REPLACE_CHAR, '全网同一关')
    text = text.replace('每日挑' + REPLACE_CHAR, '每日挑战')
    text = text.replace('放一' + REPLACE_CHAR, '放一只')
    text = text.replace('退' + REPLACE_CHAR, '退出')
    text = text.replace(REPLACE_CHAR + '{{level}} ' + REPLACE_CHAR, '第 {{level}} 关')
    text = text.replace(REPLACE_CHAR + '{{currentLevel}} ' + REPLACE_CHAR, '第 {{currentLevel}} 关')
    text = text.replace(REPLACE_CHAR + '{{survivalRound}}' + REPLACE_CHAR, '第 {{survivalRound}} 关')
    # If the user saw "第1 ？" in survival, it means there is "第{{survivalRound}} "
    text = text.replace('第{{survivalRound}}' + REPLACE_CHAR, '第{{survivalRound}} 关')
    text = text.replace('第 {{survivalRound}}' + REPLACE_CHAR, '第 {{survivalRound}} 关')
    
    # other common fixes if they exist
    text = text.replace('{{item.day}} ' + REPLACE_CHAR, '{{item.day}} 次')
    text = text.replace('已找到 ' + REPLACE_CHAR, '已找到 ')
    text = text.replace('已找' + REPLACE_CHAR, '已找到')
    text = text.replace(REPLACE_CHAR, '') # Wipe out any other remaining replacement characters blindly!

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

print('Repaired strings and removed all U+FFFD')
