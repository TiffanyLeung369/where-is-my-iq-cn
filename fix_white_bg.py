import os
from PIL import Image, ImageDraw

def clear_stubborn_white_bg(filename):
    path = f"C:/Users/user/.gemini/antigravity/scratch/cangzaina/images/{filename}"
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    img = Image.open(path).convert("RGBA")
    rgb_img = img.convert("RGB")
    
    # 用魔棒点除背景，宽容度给�?5
    ImageDraw.floodfill(rgb_img, (0, 0), (255, 0, 255), thresh=45)
    
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b = rgb_img.getpixel((x, y))
            if r == 255 and g == 0 and b == 255:
                img.putpixel((x, y), (0, 0, 0, 0))
                
    img.save(path)
    print(f"Successfully erased background from {filename}!")

if __name__ == '__main__':
    clear_stubborn_white_bg('crab_fight.png')
