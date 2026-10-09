import os, re

files = [
    'app.wxss',
    'pages/game/game.wxss',
    'pages/home/home.wxss',
    'pages/map/map.wxss',
    'pages/shop/shop.wxss'
]

def repl(match):
    size = int(match.group(1))
    if size < 28:
        return f"font-size: 28rpx"
    return match.group(0)

count = 0
for file in files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content, n = re.subn(r'font-size:\s*(\d+)rpx', repl, content)
        if new_content != content:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            count += 1
            print(f"Updated {file}")

print(f"Done! Modified {count} files.")
