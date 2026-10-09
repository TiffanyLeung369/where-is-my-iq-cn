import os
from PIL import Image

def build_walk_frame():
    source_path = 'C:/Users/user/.gemini/antigravity/scratch/cangzaina/images/crab.png'
    dest_path = 'C:/Users/user/.gemini/antigravity/brain/6bfead6e-d182-4eb7-aa27-197acf47182a/crab_walk_2_wide.png'
    dest_path_app = 'C:/Users/user/.gemini/antigravity/scratch/cangzaina/images/crab_walk_2.png'

    if not os.path.exists(source_path):
        print(f"Source file not found: {source_path}")
        return

    img = Image.open(source_path).convert('RGBA')
    w, h = img.size
    print(f"Loaded crab.png size: {w}x{h}")
    
    new_img = Image.new('RGBA', (w, h), (255,255,255,0))
    
    # 局部形变矩阵：让底部的腿极大向外张开扩展，幅度做大
    for y in range(h):
        for x in range(w):
            if y > h * 0.53: # Start separating at bottom half
                # factor decreases, pulling pixels from closer to the center out to the edges
                intensity = ((y - h * 0.53) / (h * 0.47))
                
                # Make it spread outwards by assigning a squish < 1
                # 0.7 means it looks 30% wider
                squish = 1.0 - (intensity * 0.35) 
                
                # add a slight vertical drop to the feet when spread
                src_y = int(y + (intensity * 5)) 
                
                center_x = w / 2.0
                src_x = int((x - center_x) * squish + center_x)
                if 0 <= src_x < w and 0 <= src_y < h:
                    new_img.putpixel((x, y), img.getpixel((src_x, src_y)))
            else:
                new_img.putpixel((x, y), img.getpixel((x, y)))
                
    new_img.save(dest_path)
    new_img.save(dest_path_app)
    print(f"Successfully generated wide walk frame 2 at: {dest_path}")

if __name__ == '__main__':
    build_walk_frame()
