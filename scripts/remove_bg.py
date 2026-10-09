from PIL import Image

def remove_background(input_path, output_path):
    img = Image.open(input_path).convert('RGBA')
    data = img.getdata()
    new_data = []
    
    for item in data:
        # Check if the pixel is light-colored (near white or light gray)
        # Assuming r, g, b values above 200 are the background
        if item[0] > 200 and item[1] > 200 and item[2] > 200:
            # Change background to transparent
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path)
    print(f"Saved to {output_path}")

remove_background('images/ad_icon.png', 'images/ad_icon_transparent.png')
