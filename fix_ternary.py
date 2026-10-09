import re

def fix_ternary(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    matches = set(re.findall(r'\{\{([^?}]*?:.*?)\}\}', text, re.DOTALL))
    
    for m in matches:
        if m.count(':') != 1:
            continue
            
        parts = m.split(':')
        left = parts[0]
        right = parts[1]
        
        # We need to turn 'condition  trueVal ' into 'condition ? trueVal '
        fixed_left = left.replace('  ', ' ? ')
        if left == fixed_left:
            # If no double space was found, fallback to regex
            fixed_left = re.sub(r'(\s+)(\S+\s*)$', r' ? \2', left)
            
        fixed_m = fixed_left + ':' + right
        text = text.replace('{{' + m + '}}', '{{' + fixed_m + '}}')
        print(f"Fixed in {path}: {fixed_m.strip()}")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

fix_ternary('pages/game/game.wxml')
fix_ternary('pages/home/home.wxml')
fix_ternary('pages/shop/shop.wxml')
