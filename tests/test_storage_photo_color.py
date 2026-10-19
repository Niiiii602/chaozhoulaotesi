import importlib.util
from pathlib import Path
import unittest

import numpy as np
from PIL import Image


PROJECT = Path(__file__).resolve().parents[1]
MODULE_SPEC = importlib.util.spec_from_file_location("storage_photo_exporter", PROJECT / "tools" / "export_storage_photos.py")
EXPORTER = importlib.util.module_from_spec(MODULE_SPEC)
MODULE_SPEC.loader.exec_module(EXPORTER)


class StoragePhotoColorTests(unittest.TestCase):
    def test_white_and_neutral_gray_stay_unchanged(self):
        pixels = np.array([[[255, 255, 255], [200, 200, 200], [40, 40, 40]]], dtype=np.uint8)
        np.testing.assert_array_equal(np.asarray(EXPORTER.neutralize_cool_cast(Image.fromarray(pixels))), pixels)

    def test_cool_metal_becomes_neutral_without_changing_luminance(self):
        pixels = np.array([[[100, 130, 145], [170, 200, 215], [30, 45, 50]]], dtype=np.uint8)
        corrected = np.asarray(EXPORTER.neutralize_cool_cast(Image.fromarray(pixels)))
        self.assertLessEqual(int(np.ptp(corrected.astype(int), axis=-1).max()), 3)
        weights = np.array([0.2126, 0.7152, 0.0722])
        self.assertLessEqual(float(np.abs(corrected @ weights - pixels @ weights).max()), 1)

    def test_red_and_magenta_seals_and_warm_reflections_are_preserved(self):
        pixels = np.array([[[130, 30, 60], [170, 40, 195], [200, 160, 120]]], dtype=np.uint8)
        np.testing.assert_array_equal(np.asarray(EXPORTER.neutralize_cool_cast(Image.fromarray(pixels))), pixels)

    def test_adjustment_does_not_mutate_the_source(self):
        original = Image.new("RGB", (3, 3), (100, 130, 145))
        before = original.tobytes()
        EXPORTER.neutralize_cool_cast(original)
        self.assertEqual(original.tobytes(), before)

    def test_all_seven_saved_images_match_the_lossless_correction(self):
        self.assertEqual(len(EXPORTER.COOL_CAST_CORRECTIONS), 7)
        for key in EXPORTER.COOL_CAST_CORRECTIONS:
            with self.subTest(photo=key):
                with Image.open(PROJECT / "assets" / "catalog-white" / (key + ".webp")) as original:
                    expected = EXPORTER.neutralize_cool_cast(original)
                    original_profile = original.info["icc_profile"]
                with Image.open(PROJECT / "assets" / "catalog-white" / (key + "-neutral.webp")) as saved:
                    self.assertEqual(saved.size, (640, 480))
                    self.assertEqual(saved.info["icc_profile"], original_profile)
                    np.testing.assert_array_equal(np.asarray(saved.convert("RGB")), np.asarray(expected))


if __name__ == "__main__":
    unittest.main()
