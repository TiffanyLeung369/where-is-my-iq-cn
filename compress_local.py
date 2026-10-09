import os
from PIL import Image

folder = 'local_assets'
for fn in os.listdir(folder):
    if fn.endswith('.png'):
        path = os.path.join(folder, fn)
        img = Image.open(path)
        # Convert to P mode with 256 colors for extreme size reduction without huge quality loss
        img = img.convert('P', palette=Image.ADAPTIVE, colors=256)
        img.save(path, optimize=True)
        print(f"Compressed {fn}, new size: {os.path.getsize(path)} bytes")
