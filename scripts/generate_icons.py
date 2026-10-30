#!/usr/bin/env python3
"""Generate KeepAwake app icon source and tray icons.

Requires Pillow and numpy. Run from the repository root:

    python3 scripts/generate_icons.py

Then regenerate the platform icon set with:

    npx tauri icon src-tauri/icons/source.png
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT / "src-tauri" / "icons"
SUPERSAMPLE = 4


def lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def vertical_gradient(
    size: int,
    top: tuple[int, int, int],
    bottom: tuple[int, int, int],
    top_alpha: int = 255,
    bottom_alpha: int = 255,
) -> Image.Image:
    columns = np.zeros((size, 1, 4), dtype=np.uint8)
    for y in range(size):
        t = y / max(1, size - 1)
        color = lerp(top, bottom, t)
        alpha = round(top_alpha + (bottom_alpha - top_alpha) * t)
        columns[y, 0] = (*color, alpha)
    return Image.fromarray(columns, "RGBA").resize((size, size), Image.Resampling.NEAREST)


def rounded_mask(size: int, radius: float) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return mask


def draw_sun(
    canvas: Image.Image,
    center: tuple[float, float],
    core_radius: float,
    ray_inner: float,
    ray_outer: float,
    ray_width: float,
    colors: tuple[tuple[int, int, int], tuple[int, int, int]],
    glow_color: tuple[int, int, int, int],
    glow_radius: float,
    glow_blur: float,
) -> None:
    width, height = canvas.size
    cx, cy = center

    # Soft glow behind the sun.
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse(
        (cx - glow_radius, cy - glow_radius, cx + glow_radius, cy + glow_radius),
        fill=glow_color,
    )
    canvas.alpha_composite(glow.filter(ImageFilter.GaussianBlur(glow_blur)))

    # Sun rays as rounded capsules.
    rays = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    rdraw = ImageDraw.Draw(rays)
    ray_color = lerp(colors[0], colors[1], 0.45) + (255,)
    for index in range(8):
        angle = math.radians(index * 45)
        x1 = cx + math.cos(angle) * ray_inner
        y1 = cy + math.sin(angle) * ray_inner
        x2 = cx + math.cos(angle) * ray_outer
        y2 = cy + math.sin(angle) * ray_outer
        rdraw.line((x1, y1, x2, y2), fill=ray_color, width=round(ray_width))
        cap = ray_width / 2
        rdraw.ellipse((x1 - cap, y1 - cap, x1 + cap, y1 + cap), fill=ray_color)
        rdraw.ellipse((x2 - cap, y2 - cap, x2 + cap, y2 + cap), fill=ray_color)
    canvas.alpha_composite(rays)

    # Sun core with a diagonal gradient and a soft highlight.
    core_size = max(1, int(core_radius * 2))
    core = vertical_gradient(core_size, colors[0], colors[1])
    core_mask = Image.new("L", (core_size, core_size), 0)
    ImageDraw.Draw(core_mask).ellipse((0, 0, core_size - 1, core_size - 1), fill=255)
    core_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    core_layer.paste(
        core,
        (int(cx - core_radius), int(cy - core_radius)),
        core_mask,
    )

    highlight = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(highlight)
    hdraw.ellipse(
        (cx - core_radius * 0.62, cy - core_radius * 0.72, cx + core_radius * 0.2, cy - core_radius * 0.08),
        fill=(255, 255, 255, 70),
    )
    core_layer.alpha_composite(highlight.filter(ImageFilter.GaussianBlur(core_radius * 0.12)))
    canvas.alpha_composite(core_layer)


def build_app_icon() -> None:
    size = 1024
    scale = SUPERSAMPLE
    work = size * scale
    radius = work * 0.225
    # macOS 图标规范：1024 画布中实际圆角矩形内容为 824×824，四周留 100px。
    content_ratio = 824 / 1024

    background = vertical_gradient(work, (17, 28, 49), (6, 33, 43)).convert("RGBA")
    background.putalpha(rounded_mask(work, radius))

    # Subtle top-left sheen.
    sheen = Image.new("RGBA", (work, work), (0, 0, 0, 0))
    ImageDraw.Draw(sheen).ellipse(
        (-work * 0.25, -work * 0.5, work * 0.72, work * 0.42),
        fill=(120, 180, 255, 26),
    )
    background.alpha_composite(sheen.filter(ImageFilter.GaussianBlur(work * 0.06)))

    # Inner hairline border for a crisp edge.
    border = Image.new("RGBA", (work, work), (0, 0, 0, 0))
    ImageDraw.Draw(border).rounded_rectangle(
        (4 * scale, 4 * scale, work - 4 * scale, work - 4 * scale),
        radius=radius - 4 * scale,
        outline=(255, 255, 255, 30),
        width=max(1, 2 * scale),
    )
    background.alpha_composite(border)

    draw_sun(
        background,
        center=(work / 2, work / 2),
        core_radius=work * 0.175,
        ray_inner=work * 0.238,
        ray_outer=work * 0.302,
        ray_width=work * 0.032,
        colors=((110, 231, 183), (34, 211, 238)),  # emerald-300 -> cyan-400
        glow_color=(52, 211, 153, 110),
        glow_radius=work * 0.33,
        glow_blur=work * 0.07,
    )

    # 关键：最后再按圆角遮罩裁剪一次。顶部高光在合成时会溢出圆角，
    # 若保留这些低透明度像素，macOS 会按矩形 alpha 绘制出方角阴影。
    background.putalpha(
        ImageChops.multiply(background.getchannel("A"), rounded_mask(work, radius))
    )

    content_size = round(size * content_ratio)
    content = background.resize(
        (content_size, content_size), Image.Resampling.LANCZOS
    )
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset = (size - content_size) // 2
    icon.alpha_composite(content, (offset, offset))
    icon.save(ICONS / "source.png", optimize=True)
    print(f"wrote {ICONS / 'source.png'}")


def build_tray_icon(active: bool) -> None:
    size = 64
    scale = SUPERSAMPLE
    work = size * scale
    canvas = Image.new("RGBA", (work, work), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    cx = cy = work / 2

    if active:
        # Green sun, readable on both light and dark menu bars.
        draw_sun(
            canvas,
            center=(cx, cy),
            core_radius=work * 0.235,
            ray_inner=work * 0.315,
            ray_outer=work * 0.415,
            ray_width=work * 0.072,
            colors=((134, 239, 172), (34, 197, 94)),  # green-300 -> green-500
            glow_color=(34, 197, 94, 80),
            glow_radius=work * 0.45,
            glow_blur=work * 0.05,
        )
    else:
        # Neutral gray crescent moon.
        moon = Image.new("RGBA", (work, work), (0, 0, 0, 0))
        mdraw = ImageDraw.Draw(moon)
        mdraw.ellipse(
            (cx - work * 0.30, cy - work * 0.30, cx + work * 0.30, cy + work * 0.30),
            fill=(142, 142, 147, 255),
        )
        cut = Image.new("RGBA", (work, work), (0, 0, 0, 0))
        ImageDraw.Draw(cut).ellipse(
            (cx - work * 0.20, cy - work * 0.39, cx + work * 0.40, cy + work * 0.21),
            fill=(0, 0, 0, 255),
        )
        moon.paste((0, 0, 0, 0), (0, 0, work, work), cut.split()[3])
        canvas.alpha_composite(moon)

    icon = canvas.resize((size, size), Image.Resampling.LANCZOS)
    name = "tray-active.png" if active else "tray-idle.png"
    icon.save(ICONS / name, optimize=True)
    print(f"wrote {ICONS / name}")


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    build_app_icon()
    build_tray_icon(active=False)
    build_tray_icon(active=True)


if __name__ == "__main__":
    main()
