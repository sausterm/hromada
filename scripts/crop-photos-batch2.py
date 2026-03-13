"""
Crop facility photos from Canva slide screenshots — Batch 2 (12 new projects).
Slides are 3840×2160 (1920×1080 viewport at 2x deviceScaleFactor).

Run: python3 scripts/crop-photos-batch2.py
"""

from PIL import Image
import os

SLIDES_DIR = "/tmp/canva-slides"
OUT_DIR = "/tmp/project-photos-batch2"
os.makedirs(OUT_DIR, exist_ok=True)

# Each entry: (slide_file, output_name, crop_box_ltrb, description)
# crop_box is (left, top, right, bottom) in the 3840×2160 image
CROPS = [
    # === 1. Novovolynsk Sports School (slide 06) ===
    ("slide-06.png", "novovolynsk-building.jpg", (2012, 329, 2611, 1260), "Sports school building exterior"),
    ("slide-06.png", "novovolynsk-aerial.jpg", (1156, 1394, 2683, 2025), "Sports school aerial view"),

    # === 2. Novovolynsk Lyceum Pool (slide 05) ===
    ("slide-05.png", "novovolynsk-pool-heatpump.jpg", (2012, 328, 2612, 1265), "Heat pump equipment for pool"),
    ("slide-05.png", "novovolynsk-pool.jpg", (1156, 1434, 2683, 2040), "Lyceum swimming pool"),

    # === 3. Sheptytskyi Disability (slide 18) ===
    ("slide-18.png", "sheptytskyi-building.jpg", (2015, 960, 2645, 1341), "Municipal enterprise building"),
    ("slide-18.png", "sheptytskyi-solar.jpg", (1156, 1397, 2683, 2139), "Solar panel installation"),

    # === 4. Nadvirna Children's Hospital (slide 29) ===
    ("slide-29.png", "nadvirna-children-solar.jpg", (2058, 311, 2612, 1100), "Solar stock photo for hospital"),
    ("slide-29.png", "nadvirna-children-hospital.jpg", (1477, 1412, 2426, 1998), "Children's hospital building"),

    # === 5. Nadvirna Central Hospital (slide 30) — 1 photo ===
    ("slide-30.png", "nadvirna-central-hospital.jpg", (1344, 260, 2494, 778), "Central hospital inpatient building"),

    # === 6. Ladyzhyn Rehab Center (slide 14) ===
    ("slide-14.png", "ladyzhyn-render.jpg", (2012, 354, 2612, 750), "Solar power plant 3D render"),
    ("slide-14.png", "ladyzhyn-shading.jpg", (2012, 852, 2612, 1295), "Roof shading analysis"),
    ("slide-14.png", "ladyzhyn-aerial.jpg", (1156, 1394, 2683, 2025), "Rehabilitation center aerial"),

    # === 7. Samar Dental Solar (slide 31) ===
    ("slide-31.png", "samar-dental-aerial.jpg", (1246, 1626, 1879, 2000), "Dental clinic aerial overlay"),
    ("slide-31.png", "samar-dental-clinic.jpg", (1976, 1515, 2530, 2000), "Dental clinic building"),

    # === 8. Samar Dental Thermo (slide 32) ===
    ("slide-32.png", "samar-dental-thermo-closeup.jpg", (2040, 458, 2654, 1071), "Facade thermal closeup"),
    ("slide-32.png", "samar-dental-thermo-wide.jpg", (1156, 1519, 2683, 2000), "Building wide view"),

    # === 9. Samar Healthcare Facade (slide 33) — 1 photo ===
    ("slide-33.png", "samar-healthcare-facade.jpg", (1354, 1274, 2431, 1986), "Primary health care building"),

    # === 10. Zelenodolsk Lyceum (slide 12) ===
    ("slide-12.png", "zelenodolsk-solar.jpg", (2012, 329, 2611, 1265), "Solar reference image"),
    ("slide-12.png", "zelenodolsk-lyceum-3d.jpg", (1156, 1394, 2683, 2101), "Lyceum 3D model rendering"),

    # === 11. Pryiutivka ASC (slide 16) ===
    ("slide-16.png", "pryiutivka-solar.jpg", (2012, 329, 2612, 1267), "Solar and chimney installation"),
    ("slide-16.png", "pryiutivka-asc.jpg", (1156, 1394, 2683, 1982), "ASC building exterior"),

    # === 12. Slobozhanske ASC (slide 07) ===
    ("slide-07.png", "slobozhanske-3d.jpg", (2093, 328, 2649, 740), "3D model with solar panels"),
    ("slide-07.png", "slobozhanske-thermal.jpg", (2093, 801, 2649, 1245), "Thermal analysis view"),
    ("slide-07.png", "slobozhanske-building.jpg", (1156, 1347, 2683, 2066), "ASC building exterior"),
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
            w, h = img.size
            left = max(0, min(box[0], w))
            top = max(0, min(box[1], h))
            right = max(0, min(box[2], w))
            bottom = max(0, min(box[3], h))

            cropped = img.crop((left, top, right, bottom))
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
