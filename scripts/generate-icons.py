"""Generate Drink Good extension icons (wine glass on premium dark)."""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "public"

BG = (28, 25, 23)       # #1C1917
GOLD = (161, 98, 7)     # #A16207
GOLD_LIGHT = (202, 138, 4)  # highlight
TRANSPARENT = (0, 0, 0, 0)


def _set_px(px: list[tuple[int, int, int, int]], size: int, x: int, y: int, color: tuple[int, int, int]) -> None:
    if 0 <= x < size and 0 <= y < size:
        px[y * size + x] = (*color, 255)


def _fill_circle(px: list[tuple[int, int, int, int]], size: int, cx: int, cy: int, r: int, color: tuple[int, int, int]) -> None:
    for y in range(size):
        for x in range(size):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2:
                px[y * size + x] = (*color, 255)


def _draw_glass(px: list[tuple[int, int, int, int]], size: int) -> None:
    scale = size / 128.0
    cx = size // 2

    def s(value: float) -> int:
        return int(round(value * scale))

    # Bowl
    left, right = cx - s(28), cx + s(28)
    top, bottom = s(30), s(72)
    for y in range(top, bottom + 1):
        t = (y - top) / max(bottom - top, 1)
        half = int(s(26) * (0.55 + 0.45 * t))
        for x in range(left + s(28) - half, left + s(28) + half + 1):
            _set_px(px, size, x, y, GOLD)

    # Stem
    for y in range(bottom + 1, s(92)):
        for x in range(cx - s(4), cx + s(5)):
            _set_px(px, size, x, y, GOLD)

    # Base
    for y in range(s(92), s(100)):
        half = s(16)
        for x in range(cx - half, cx + half + 1):
            _set_px(px, size, x, y, GOLD)

    # Highlight arc
    for angle in range(200, 340):
        rad = math.radians(angle)
        x = int(cx - s(12) + math.cos(rad) * s(14))
        y = int(s(42) + math.sin(rad) * s(16))
        _set_px(px, size, x, y, GOLD_LIGHT)


def render_icon(size: int) -> list[tuple[int, int, int, int]]:
    px = [(*BG, 255) for _ in range(size * size)]
    _fill_circle(px, size, size // 2, size // 2, size // 2 - 1, BG)
    _draw_glass(px, size)
    return px


def png_bytes(size: int) -> bytes:
    px = render_icon(size)
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            raw.extend(px[y * size + x])

    compressed = zlib.compress(bytes(raw), 9)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", compressed) + chunk(b"IEND", b"")


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    for size in (16, 48, 128):
        path = ROOT / f"icon-{size}.png"
        path.write_bytes(png_bytes(size))
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
