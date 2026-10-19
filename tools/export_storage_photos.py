import argparse
import io
import json
from pathlib import Path

import pypdf.filters
import numpy as np
from PIL import Image, ImageChops, ImageCms
from pypdf import PdfReader


SOURCES = {
    "rectangular": [
        (2, 7, "01RC400"), (2, 6, "01RC550"), (2, 5, "01RC650"),
        (2, 4, "01RC1000"), (2, 3, "01RC1300"), (2, 2, "01RC2250"),
        (2, 0, "01RC2000"), (2, 1, "01RC2500"), (2, 8, "01RC4200"),
        (3, 0, "01RC3000"), (3, 1, "01RC5000"), (3, 3, "01RC6600"),
        (3, 2, "01RC2600"), (3, 4, "01RC3700"),
    ],
    "square": [(3, 5, "01SQ400"), (3, 7, "01SQ1000"), (3, 6, "01SQ4300")],
    "divided": [(5, 0, "01-SG450/280ml"), (5, 1, "01-SSG400/280/280ml"), (5, 3, "01-CTXSSG1700ml")],
    "baking": [(6, 0, "01-KP2000ml"), (6, 1, "01-KP2500ml"), (6, 2, "01-KP3000ml"), (6, 3, "01-KP5000ml")],
    "sets": [
        (7, 3, "01-BXH650/1300ml"), (7, 2, "01-BXH650/1300/2250ml"),
        (7, 1, "01-B01-BXH400*2/2000ml"), (7, 0, "01-KP650*2/2500ml"),
        (8, 1, "01-BXH1000*2/4200ml"), (8, 0, "01-KP650*2/1300*2/5000ml"),
        (8, 3, "01-CTX650*2/2600ml"), (8, 2, "01-CTX1000*2/3700ml"),
        (9, 0, "01-KP400*2/1000/4300ml"), (9, 1, "01-KP1000*2/4300ml"),
        (9, 2, "01-KP400*4/4300ml"),
    ],
    "silicone-glass": [
        (10, 6, "10RC600"), (10, 7, "10RC900"), (10, 8, "10RC1200"),
        (11, 0, "10r280"), (11, 1, "10R630"), (11, 2, "10R1200"), (11, 3, "10R2100"),
    ],
    "silicone": [
        (10, 0, "10RC600"), (10, 1, "10RC900"), (10, 2, "10RC1200"),
        (10, 3, "10RC600"), (10, 4, "10RC900"), (10, 5, "10RC1200"),
    ],
    "alternate-pp": [(11, 4, "01RC550"), (11, 5, "01RC1300"), (11, 6, "01RC450/280")],
    "value": [(12, 0, "02RC580"), (12, 1, "02RC850"), (12, 2, "02RC1200"), (12, 3, "02R700"), (12, 4, "02R1050")],
}


COOL_CAST_CORRECTIONS = {
    "rectangular-12", "rectangular-13", "divided-19",
    "sets-0", "sets-3", "sets-6", "sets-7",
}


def neutralize_cool_cast(image):
    pixels = np.asarray(image.convert("RGB"), dtype=np.float32)
    red, green, blue = np.moveaxis(pixels, -1, 0)
    weight = np.clip((np.maximum(green, blue) - red) / 10, 0, 1) * 0.95
    weight[red > green + 6] = 0
    neutral = 0.2126 * red + 0.7152 * green + 0.0722 * blue
    corrected = pixels + weight[..., None] * (neutral[..., None] - pixels)
    return Image.fromarray(np.clip(np.rint(corrected), 0, 255).astype(np.uint8))


def neutralize_existing_photos(destination):
    manifest_path = destination / "source.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for entry in manifest["images"]:
        key = Path(entry["file"]).stem.removesuffix("-neutral")
        if key not in COOL_CAST_CORRECTIONS:
            continue
        filename = key + "-neutral.webp"
        with Image.open(destination / (key + ".webp")) as original:
            corrected = neutralize_cool_cast(original)
            corrected.save(destination / filename, "WEBP", lossless=True, method=6, icc_profile=original.info["icc_profile"])
        entry["file"] = "assets/catalog-white/" + filename
        entry["colorAdjustment"] = {"method": "Selective cool-cast neutralization", "strength": 0.95, "preserves": "Red seals, warm reflections, luminance and white background"}
    manifest["treatment"] = "Original embedded photographs; color-managed CMYK to sRGB, composited onto white. Seven user-identified photographs also receive selective cool-cast neutralization; red seals are preserved. No image generation."
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    print("Neutralized", len(COOL_CAST_CORRECTIONS), "identified photos; other photographs unchanged.")


def export_photos(catalog, destination, cmyk_profile):
    pypdf.filters.ZLIB_MAX_OUTPUT_LENGTH = 300_000_000
    document = PdfReader(catalog)
    srgb_profile = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB"))
    print_profile = ImageCms.getOpenProfile(str(cmyk_profile))
    transform = ImageCms.buildTransformFromOpenProfiles(print_profile, srgb_profile, "CMYK", "RGB", renderingIntent=0)
    destination.mkdir(parents=True, exist_ok=True)
    manifest = {"catalog": catalog.name, "treatment": "Original embedded photographs; color-managed CMYK to sRGB, composited onto white. No creative recoloring or image generation.", "colorManagement": {"sourceProfile": ImageCms.getProfileDescription(print_profile).strip(), "outputProfile": "sRGB", "renderingIntent": "Perceptual", "deviceCmykAssumption": "DeviceCMYK photographs have no embedded output intent; the supplied US Web Coated SWOP profile is used."}, "images": []}
    for collection, sources in SOURCES.items():
        for index, (page, image_index, code) in enumerate(sources):
            asset = document.pages[page - 1].images[image_index]
            image_object = asset.indirect_reference.get_object()
            color_space = image_object.get("/ColorSpace")
            indexed_cmyk = isinstance(color_space, list) and color_space[:2] == ["/Indexed", "/DeviceCMYK"]
            if color_space == "/DeviceCMYK" or indexed_cmyk:
                if image_object.get("/BitsPerComponent") != 8:
                    raise ValueError("Unsupported CMYK image encoding: " + asset.name)
                dimensions = (image_object["/Width"], image_object["/Height"])
                if indexed_cmyk:
                    if image_object.get("/Decode") not in (None, [0, 255]):
                        raise ValueError("Unsupported indexed CMYK decode: " + asset.name)
                    palette_object = color_space[3].get_object()
                    palette = palette_object.get_data() if hasattr(palette_object, "get_data") else bytes(palette_object)
                    palette = palette.ljust(1024, b"\0")
                    indices = image_object.get_data()
                    channels = [Image.frombytes("L", dimensions, indices.translate(palette[channel::4])) for channel in range(4)]
                    original = Image.merge("CMYK", channels)
                else:
                    if image_object.get("/Decode"):
                        raise ValueError("Unsupported CMYK decode: " + asset.name)
                    original = Image.frombytes("CMYK", dimensions, image_object.get_data())
                picture = ImageCms.applyTransform(original, transform).convert("RGBA")
                if "/SMask" in image_object:
                    mask = image_object["/SMask"].get_object()
                    if mask.get("/BitsPerComponent") != 8:
                        raise ValueError("Unsupported alpha encoding: " + asset.name)
                    alpha = Image.frombytes("L", (mask["/Width"], mask["/Height"]), mask.get_data())
                    picture.putalpha(alpha)
            else:
                picture = asset.image.convert("RGBA")
            white = Image.new("RGBA", picture.size, "white")
            picture = Image.alpha_composite(white, picture).convert("RGB")
            bounds = ImageChops.difference(picture, Image.new("RGB", picture.size, "white")).getbbox()
            if bounds:
                picture = picture.crop(bounds)
            picture.thumbnail((600, 440), Image.Resampling.LANCZOS)
            canvas = Image.new("RGB", (640, 480), "white")
            canvas.paste(picture, ((640 - picture.width) // 2, (480 - picture.height) // 2))
            model_index = [6, 7, 9, 10][index] if collection == "baking" else index + {"square": 14, "divided": 17}.get(collection, 0)
            filename = collection + "-" + str(model_index) + ".webp"
            canvas.save(destination / filename, "WEBP", quality=94, method=6, icc_profile=srgb_profile.tobytes())
            color_space_name = "/Indexed /DeviceCMYK" if indexed_cmyk else str(color_space)
            manifest["images"].append({"file": "assets/catalog-white/" + filename, "code": code, "page": page, "imageIndex": image_index, "object": asset.name, "sourceColorSpace": color_space_name})
    (destination / "source.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    neutralize_existing_photos(destination)
    print("Exported", len(manifest["images"]), "catalog-original product photos to", destination)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", type=Path)
    parser.add_argument("--cmyk-profile", type=Path)
    parser.add_argument("--neutralize-existing", action="store_true")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "assets" / "catalog-white")
    arguments = parser.parse_args()
    if arguments.neutralize_existing:
        neutralize_existing_photos(arguments.output)
    else:
        if not arguments.catalog or not arguments.cmyk_profile:
            parser.error("--catalog and --cmyk-profile are required for source extraction")
        export_photos(arguments.catalog, arguments.output, arguments.cmyk_profile)
