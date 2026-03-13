"""
Crop facility photos from Canva slide screenshots.
Slides are 3840×2160 (1920×1080 viewport at 2x deviceScaleFactor).

Run: python3 scripts/crop-photos.py

The Canva slides are in portrait-ish format displayed on a landscape viewport,
so the actual slide content sits centered horizontally with black bars on sides.

Slide content area (approximate):
  - Left:   ~1100px
  - Right:  ~2740px
  - Top:    ~10px
  - Bottom: ~2060px
"""

from PIL import Image
import os

SLIDES_DIR = "/tmp/canva-slides"
OUT_DIR = "/tmp/project-photos"
os.makedirs(OUT_DIR, exist_ok=True)

# Each entry: (slide_file, output_name, crop_box_ltrb, description)
# crop_box is (left, top, right, bottom) in the 3840×2160 image
CROPS = [
    # === Project 1: Novovolynsk Sports School (slide 06) ===
    # Building exterior with Ukrainian flag (top-right of slide)
    ("slide-06.png", "novovolynsk-building.jpg", (1980, 310, 2680, 1320), "Novovolynsk Sports School building exterior"),
    # Aerial view of the complex (bottom of slide, full width of content)
    ("slide-06.png", "novovolynsk-aerial.jpg", (1100, 1440, 2740, 2060), "Novovolynsk Sports School aerial view"),

    # === Project 2: Sheptytskyi Solar (slide 18) ===
    # Building + solar panels (right side, mid-bottom)
    ("slide-18.png", "sheptytskyi-building.jpg", (1960, 900, 2700, 1340), "Sheptytskyi municipal enterprise with solar panels"),
    # Solar panel close-up (bottom of slide)
    ("slide-18.png", "sheptytskyi-solar.jpg", (1100, 1400, 2740, 2060), "Solar panels close-up at Sheptytskyi"),

    # === Project 3: Nadvirna Children's Hospital Solar (slide 29) ===
    # Solar panel field (top-right, labeled "solar panel field")
    ("slide-29.png", "nadvirna-children-solar.jpg", (2100, 280, 2700, 1120), "Solar panels at Nadvirna Children's Hospital"),
    # Hospital building (bottom of slide)
    ("slide-29.png", "nadvirna-children-hospital.jpg", (1100, 1380, 2740, 2060), "Nadvirna Children's Hospital building"),

    # === Project 4: Nadvirna Central Hospital Thermo (slide 30) ===
    # Hospital building (top center, below title)
    ("slide-30.png", "nadvirna-central-hospital.jpg", (1220, 340, 2620, 780), "Nadvirna Central District Hospital inpatient building"),

    # === Project 5: Velyki Mosty Water Treatment (slide 40) ===
    # Pumping station interior - teal/blue industrial photo (right side)
    ("slide-40.png", "velyki-mosty-pumping.jpg", (1840, 1320, 2740, 2060), "Velyki Mosty pumping station interior"),
    # Second water treatment photo (bottom-left area)
    ("slide-40.png", "velyki-mosty-water.jpg", (1100, 1320, 1840, 2060), "Velyki Mosty water treatment facility"),

    # === Project 6: Ladyzhyn Rehabilitation Center Solar (slide 14) ===
    # 3D render of solar power plant (top-right)
    ("slide-14.png", "ladyzhyn-render.jpg", (2000, 320, 2700, 800), "Ladyzhyn Rehabilitation Center solar power plant model"),
    # Roof shading analysis model (middle-right)
    ("slide-14.png", "ladyzhyn-shading.jpg", (2000, 820, 2700, 1360), "Ladyzhyn roof shading analysis"),
    # Aerial render of full complex (bottom)
    ("slide-14.png", "ladyzhyn-aerial.jpg", (1100, 1380, 2740, 2060), "Ladyzhyn Rehabilitation Center aerial render"),

    # === Project 7: Samar Hospital Solar (slide 34) ===
    # Hospital aerial with autumn trees (top-right)
    ("slide-34.png", "samar-hospital-aerial.jpg", (1900, 260, 2740, 1200), "Samar Central Hospital surgical building aerial view"),
    # Solar roof close-up (bottom-left)
    ("slide-34.png", "samar-solar-closeup.jpg", (1100, 1220, 1920, 1870), "Solar panels close-up on Samar Hospital roof"),
    # Rooftop view (bottom-right)
    ("slide-34.png", "samar-rooftop.jpg", (1920, 1220, 2740, 1870), "Solar rooftop installation at Samar Hospital"),

    # === Project 8: Samar Primary Health Care Facade (slide 33) ===
    # Building exterior (bottom half of slide)
    ("slide-33.png", "samar-healthcare-facade.jpg", (1100, 1300, 2740, 2060), "City Center of Primary Health Care building in Samar"),
]


def main():
    success = 0
    errors = 0

    for slide_file, out_name, box, desc in CROPS:
        src = os.path.join(SLIDES_DIR, slide_file)
        dst = os.path.join(OUT_DIR, out_name)

        if not os.path.exists(src):
            print(f"  MISSING: {src}")
            errors += 1
            continue

        try:
            img = Image.open(src)
            # Clamp crop box to image dimensions
            w, h = img.size
            left = max(0, min(box[0], w))
            top = max(0, min(box[1], h))
            right = max(0, min(box[2], w))
            bottom = max(0, min(box[3], h))

            cropped = img.crop((left, top, right, bottom))

            # Save as high-quality JPEG
            cropped.save(dst, "JPEG", quality=90)
            cw, ch = cropped.size
            print(f"  OK: {out_name} ({cw}x{ch}) — {desc}")
            success += 1
        except Exception as e:
            print(f"  ERROR: {out_name} — {e}")
            errors += 1

    print(f"\nDone: {success} photos cropped, {errors} errors")
    print(f"Output: {OUT_DIR}/")


if __name__ == "__main__":
    main()
