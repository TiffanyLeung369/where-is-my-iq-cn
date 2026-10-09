import os
from PIL import Image, ImageDraw

def clear_stubborn_white_bg():
    path = "C:/Users/user/.gemini/antigravity/scratch/cangzaina/images/coin.png"
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    # Load image and ensure it's RGBA
    img = Image.open(path).convert("RGBA")
    
    # Create an RGB copy for floodfill (to find the contiguous background)
    rgb_img = img.convert("RGB")
    
    # Floodfill from the top-left corner (0,0) with a magic color (Magenta)
    # The threshold of 40 handles slightly off-white pencil sketch artefacts natively
    ImageDraw.floodfill(rgb_img, (0, 0), (255, 0, 255), thresh=40)
    
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b = rgb_img.getpixel((x, y))
            # If the pixel was painted Magenta by floodfill, it's background!
            if r == 255 and g == 0 and b == 255:
                img.putpixel((x, y), (0, 0, 0, 0))
                
    img.save(path)
    print("Successfully erased the continuous white background from the coin icon!")

if __name__ == '__main__':
    clear_stubborn_white_bg()
