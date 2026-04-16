from __future__ import annotations

import base64
import hashlib
import io
import os
from datetime import datetime
from pathlib import Path
from typing import Any

import requests
import streamlit as st
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps


BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / "config" / ".SAAS"
PROMPT_TEMPLATE_PATH = BASE_DIR / "config" / "skill"
OUTPUT_DIR = BASE_DIR / "outputs"

DEFAULT_PROMPT_TEMPLATE = """
You are a senior home textile pattern designer.
Transform the user's short idea into a polished English image prompt for a refined design concept board.

User idea:
{user_description}

Reference image instruction:
{reference_note}

Prompt requirements:
- Create an elegant home textile design concept image.
- Use the uploaded reference image as inspiration for structure, mood, color, or material.
- Emphasize premium fabric texture, refined pattern repeat, clear composition, commercial design board quality.
- Include style, motif, palette, layout, material feel, lighting, and finish.
- Avoid text, watermark, logos, distorted human figures, messy layout, low resolution.
""".strip()


def load_config(path: Path) -> dict[str, str]:
    config: dict[str, str] = {}
    if not path.exists():
        return config

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        config[key.strip()] = value.strip().strip('"').strip("'")
    return config


def load_prompt_template(path: Path) -> str:
    if not path.exists():
        return DEFAULT_PROMPT_TEMPLATE
    content = path.read_text(encoding="utf-8").strip()
    return content or DEFAULT_PROMPT_TEMPLATE


def get_setting(config: dict[str, str], key: str, default: str = "") -> str:
    return os.getenv(key) or config.get(key, default)


def compose_prompt(template: str, user_description: str, reference_note: str) -> str:
    prompt = template.replace("{user_description}", user_description.strip())
    prompt = prompt.replace("{reference_note}", reference_note.strip())
    return "\n".join(line.strip() for line in prompt.splitlines() if line.strip())


def call_chat_completion(
    api_key: str,
    base_url: str,
    model: str,
    template_prompt: str,
    user_description: str,
    reference_note: str,
) -> str:
    endpoint = f"{base_url.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "temperature": 0.45,
        "max_tokens": 1600,
        "messages": [
            {
                "role": "system",
                "content": (
                    "你是专业家纺纹样设计师和图像生成提示词工程师。"
                    "最终必须在 assistant content 中输出一段英文 image prompt，"
                    "不要 Markdown，不要中文解释。"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"{template_prompt}\n\n"
                    f"Original Chinese idea: {user_description}\n"
                    f"Reference focus: {reference_note}\n\n"
                    "Return one concise but rich English prompt for generating a beautiful design concept image."
                ),
            },
        ],
    }
    response = requests.post(endpoint, headers=headers, json=payload, timeout=90)
    if not response.ok:
        raise RuntimeError(extract_api_error(response, "Chat API"))

    payload = response.json()
    message = payload.get("choices", [{}])[0].get("message", {})
    content = (message.get("content") or "").strip()
    if not content:
        content = (message.get("reasoning_content") or "").strip()
    if not content:
        raise RuntimeError("Chat API did not return prompt content.")
    return content


def prepare_reference_image(uploaded_file: Any | None) -> tuple[Image.Image | None, bytes | None]:
    if uploaded_file is None:
        return None, None

    image = Image.open(uploaded_file)
    image = ImageOps.exif_transpose(image).convert("RGB")
    image.thumbnail((1536, 1536))

    buffer = io.BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    return image, buffer.getvalue()


def call_openai_image_api(
    api_key: str,
    prompt: str,
    reference_png: bytes | None,
    model: str,
    size: str,
    quality: str,
) -> bytes:
    headers = {"Authorization": f"Bearer {api_key}"}

    if reference_png:
        endpoint = "https://api.openai.com/v1/images/edits"
        data = {
            "model": model,
            "prompt": prompt,
            "n": "1",
            "size": size,
            "quality": quality,
            "output_format": "png",
        }
        files = {"image": ("reference.png", reference_png, "image/png")}
        response = requests.post(endpoint, headers=headers, data=data, files=files, timeout=180)
    else:
        endpoint = "https://api.openai.com/v1/images/generations"
        payload = {
            "model": model,
            "prompt": prompt,
            "n": 1,
            "size": size,
            "quality": quality,
            "output_format": "png",
        }
        response = requests.post(endpoint, headers=headers, json=payload, timeout=180)

    if not response.ok:
        raise RuntimeError(extract_api_error(response, "OpenAI Image API"))

    payload = response.json()
    image_data = payload.get("data", [{}])[0].get("b64_json")
    if not image_data:
        raise RuntimeError("Image API did not return image data.")
    return base64.b64decode(image_data)


def extract_api_error(response: requests.Response, label: str) -> str:
    try:
        payload = response.json()
    except ValueError:
        return f"{label} error {response.status_code}: {response.text[:500]}"

    message = payload.get("error", {}).get("message")
    if message:
        return f"{label} error {response.status_code}: {message}"
    return f"{label} error {response.status_code}: {payload}"


def text_palette(description: str) -> list[tuple[int, int, int]]:
    lowered = description.lower()
    presets: list[list[tuple[int, int, int]]] = [
        [(31, 44, 52), (222, 82, 70), (250, 213, 92), (52, 158, 139), (245, 247, 248)],
        [(38, 55, 68), (220, 118, 90), (111, 174, 142), (238, 205, 111), (248, 249, 246)],
        [(39, 53, 48), (185, 52, 70), (235, 181, 83), (92, 157, 174), (247, 246, 240)],
        [(32, 39, 45), (76, 170, 160), (237, 105, 87), (241, 196, 83), (250, 250, 247)],
    ]

    if any(word in lowered or word in description for word in ["海", "水", "浪", "blue", "ocean"]):
        return [(22, 49, 64), (56, 153, 171), (237, 194, 91), (236, 109, 92), (246, 248, 247)]
    if any(word in description for word in ["牡丹", "花", "玫瑰", "莲", "浪漫"]):
        return [(43, 45, 50), (194, 61, 82), (244, 166, 95), (89, 154, 122), (249, 247, 243)]
    if any(word in description for word in ["儿童", "童趣", "可爱", "星"]):
        return [(40, 55, 70), (255, 123, 102), (255, 210, 97), (83, 180, 168), (247, 249, 251)]

    digest = hashlib.sha256(description.encode("utf-8")).digest()
    return presets[digest[0] % len(presets)]


def create_local_concept_image(
    description: str,
    reference_image: Image.Image | None,
    size: tuple[int, int] = (1024, 1024),
) -> bytes:
    palette = text_palette(description)
    ink, accent, gold, teal, paper = palette

    canvas = Image.new("RGB", size, paper)
    draw = ImageDraw.Draw(canvas, "RGBA")
    width, height = size

    draw.rectangle((0, 0, width, height), fill=paper)
    add_reference_wash(canvas, reference_image, accent)
    draw_fabric_texture(draw, width, height, ink)

    motif_layer = Image.new("RGBA", size, (0, 0, 0, 0))
    motif_draw = ImageDraw.Draw(motif_layer, "RGBA")
    draw_pattern(motif_draw, description, width, height, palette)
    motif_layer = motif_layer.filter(ImageFilter.GaussianBlur(0.15))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), motif_layer)

    board = ImageDraw.Draw(canvas, "RGBA")
    board.rectangle((52, 52, width - 52, height - 52), outline=(*ink, 180), width=3)
    board.rectangle((72, 72, width - 72, height - 72), outline=(*gold, 130), width=1)

    draw_swatches(board, palette, width, height)
    draw_reference_tile(canvas, reference_image, width, height)
    draw_badge(board, width, height, ink, accent, gold)

    buffer = io.BytesIO()
    canvas.convert("RGB").save(buffer, format="PNG", optimize=True)
    return buffer.getvalue()


def add_reference_wash(canvas: Image.Image, reference_image: Image.Image | None, accent: tuple[int, int, int]) -> None:
    if reference_image is None:
        overlay = Image.new("RGBA", canvas.size, (*accent, 18))
        canvas.paste(Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB"))
        return

    wash = reference_image.copy().convert("RGB")
    wash.thumbnail(canvas.size)
    background = Image.new("RGB", canvas.size, accent)
    x = (canvas.width - wash.width) // 2
    y = (canvas.height - wash.height) // 2
    background.paste(wash, (x, y))
    background = background.resize(canvas.size).filter(ImageFilter.GaussianBlur(18))
    background = ImageEnhance.Color(background).enhance(0.55)
    background = ImageEnhance.Brightness(background).enhance(1.12)
    blended = Image.blend(canvas, background, 0.28)
    canvas.paste(blended)


def draw_fabric_texture(draw: ImageDraw.ImageDraw, width: int, height: int, ink: tuple[int, int, int]) -> None:
    for x in range(0, width, 12):
        draw.line((x, 0, x, height), fill=(*ink, 10), width=1)
    for y in range(0, height, 10):
        draw.line((0, y, width, y), fill=(*ink, 8), width=1)
    for x in range(-height, width, 34):
        draw.line((x, 0, x + height, height), fill=(*ink, 7), width=1)


def draw_pattern(
    draw: ImageDraw.ImageDraw,
    description: str,
    width: int,
    height: int,
    palette: list[tuple[int, int, int]],
) -> None:
    ink, accent, gold, teal, _paper = palette
    floral = any(word in description for word in ["花", "牡丹", "玫瑰", "莲", "植物"])
    ocean = any(word in description for word in ["海", "水", "浪"])
    childlike = any(word in description for word in ["儿童", "童趣", "可爱", "星"])

    step = 164 if floral else 138
    for row, y in enumerate(range(118, height - 110, step)):
        offset = 72 if row % 2 else 0
        for x in range(118 + offset, width - 118, step):
            if floral:
                draw_flower(draw, x, y, 46, accent, gold, teal)
            elif ocean:
                draw_wave(draw, x, y, 74, teal, gold)
            elif childlike:
                draw_star(draw, x, y, 48, accent, gold)
            else:
                draw_geo_motif(draw, x, y, 58, ink, accent, gold, teal)


def draw_flower(
    draw: ImageDraw.ImageDraw,
    cx: int,
    cy: int,
    radius: int,
    accent: tuple[int, int, int],
    gold: tuple[int, int, int],
    teal: tuple[int, int, int],
) -> None:
    for dx, dy in [(0, -34), (31, -12), (20, 28), (-20, 28), (-31, -12)]:
        draw.ellipse(
            (cx + dx - radius, cy + dy - radius, cx + dx + radius, cy + dy + radius),
            fill=(*accent, 82),
            outline=(*accent, 145),
            width=2,
        )
    draw.ellipse((cx - 28, cy - 28, cx + 28, cy + 28), fill=(*gold, 180))
    draw.arc((cx - 78, cy - 72, cx + 76, cy + 82), 205, 338, fill=(*teal, 150), width=5)


def draw_wave(
    draw: ImageDraw.ImageDraw,
    cx: int,
    cy: int,
    radius: int,
    teal: tuple[int, int, int],
    gold: tuple[int, int, int],
) -> None:
    for i in range(4):
        box = (cx - radius + i * 16, cy - 34 + i * 8, cx + radius + i * 16, cy + 78 + i * 8)
        draw.arc(box, 188, 342, fill=(*teal, 150), width=7)
    draw.ellipse((cx - 13, cy - 13, cx + 13, cy + 13), fill=(*gold, 185))


def draw_star(
    draw: ImageDraw.ImageDraw,
    cx: int,
    cy: int,
    radius: int,
    accent: tuple[int, int, int],
    gold: tuple[int, int, int],
) -> None:
    points = [
        (cx, cy - radius),
        (cx + 14, cy - 14),
        (cx + radius, cy),
        (cx + 14, cy + 14),
        (cx, cy + radius),
        (cx - 14, cy + 14),
        (cx - radius, cy),
        (cx - 14, cy - 14),
    ]
    draw.polygon(points, fill=(*gold, 140), outline=(*accent, 170))
    draw.ellipse((cx - 12, cy - 12, cx + 12, cy + 12), fill=(*accent, 160))


def draw_geo_motif(
    draw: ImageDraw.ImageDraw,
    cx: int,
    cy: int,
    radius: int,
    ink: tuple[int, int, int],
    accent: tuple[int, int, int],
    gold: tuple[int, int, int],
    teal: tuple[int, int, int],
) -> None:
    draw.rectangle((cx - radius, cy - radius, cx + radius, cy + radius), outline=(*ink, 115), width=4)
    draw.ellipse((cx - radius + 16, cy - radius + 16, cx + radius - 16, cy + radius - 16), outline=(*accent, 155), width=5)
    draw.line((cx - radius, cy, cx + radius, cy), fill=(*gold, 150), width=4)
    draw.line((cx, cy - radius, cx, cy + radius), fill=(*teal, 150), width=4)


def draw_swatches(draw: ImageDraw.ImageDraw, palette: list[tuple[int, int, int]], width: int, height: int) -> None:
    swatch_size = 42
    gap = 12
    start_x = width - 52 - (swatch_size + gap) * len(palette) + gap
    y = height - 112
    for idx, color in enumerate(palette):
        x = start_x + idx * (swatch_size + gap)
        draw.rounded_rectangle((x, y, x + swatch_size, y + swatch_size), radius=6, fill=(*color, 230), outline=(24, 30, 34, 110))


def draw_reference_tile(canvas: Image.Image, reference_image: Image.Image | None, width: int, height: int) -> None:
    if reference_image is None:
        return

    tile = reference_image.copy().convert("RGB")
    tile.thumbnail((196, 196))
    frame = Image.new("RGBA", (224, 224), (248, 249, 249, 218))
    x = (224 - tile.width) // 2
    y = (224 - tile.height) // 2
    frame.paste(tile.convert("RGBA"), (x, y))
    frame_draw = ImageDraw.Draw(frame, "RGBA")
    frame_draw.rounded_rectangle((0, 0, 223, 223), radius=8, outline=(31, 44, 52, 165), width=2)
    canvas.alpha_composite(frame, (76, height - 300))


def draw_badge(
    draw: ImageDraw.ImageDraw,
    width: int,
    height: int,
    ink: tuple[int, int, int],
    accent: tuple[int, int, int],
    gold: tuple[int, int, int],
) -> None:
    draw.rounded_rectangle((74, 78, 328, 126), radius=8, fill=(*ink, 205))
    draw.rounded_rectangle((84, 88, 318, 116), radius=6, fill=(*accent, 180))
    draw.line((360, 102, width - 96, 102), fill=(*gold, 130), width=3)


def save_output(image_bytes: bytes) -> Path:
    OUTPUT_DIR.mkdir(exist_ok=True)
    file_path = OUTPUT_DIR / f"design_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    file_path.write_bytes(image_bytes)
    return file_path


def render_reserved_controls() -> None:
    st.caption("预留能力")
    cols = st.columns(4)
    labels = ["历史版本", "局部重绘", "批量四宫格", "设计说明导出"]
    for col, label in zip(cols, labels, strict=True):
        col.button(label, disabled=True, width="stretch")


def main() -> None:
    st.set_page_config(page_title="家纺设计智能体 Demo", page_icon="AI", layout="wide")

    st.markdown(
        """
        <style>
        .stApp { background: #f7f9f9; }
        div[data-testid="stSidebar"] { background: #eef5f3; }
        .block-container { padding-top: 2rem; }
        div.stButton > button {
            border-radius: 8px;
            border: 1px solid #273744;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

    config = load_config(CONFIG_PATH)
    template = load_prompt_template(PROMPT_TEMPLATE_PATH)

    st.title("家纺设计智能体 Demo")
    st.write("输入简单描述，上传参考图，调用 GLM-5 优化提示词，再生成一张设计理念图。")

    with st.sidebar:
        st.subheader("运行配置")
        mode_options = ["glm5-local", "local", "openai-image"]
        configured_mode = get_setting(config, "IMAGE_PROVIDER", "glm5-local")
        if configured_mode not in mode_options:
            configured_mode = "glm5-local"
        provider = st.selectbox(
            "生成模式",
            mode_options,
            index=mode_options.index(configured_mode),
            help="glm5-local 会调用 GLM-5 优化提示词，再用本地生成器出图。",
        )
        api_base_url = st.text_input("API_BASE_URL", value=get_setting(config, "API_BASE_URL", "https://models.sjtu.edu.cn/api/v1"))
        api_key = st.text_input("API_KEY", value=get_setting(config, "API_KEY", ""), type="password")
        llm_model = st.text_input("LLM_MODEL", value=get_setting(config, "LLM_MODEL", "glm-5"))

        with st.expander("可选：真实图像接口"):
            image_api_key = st.text_input("OPENAI_IMAGE_API_KEY", value=get_setting(config, "OPENAI_IMAGE_API_KEY", ""), type="password")
            image_model = st.selectbox("图像模型", ["gpt-image-1.5", "gpt-image-1", "gpt-image-1-mini"], index=0)
            size = st.selectbox("输出尺寸", ["1024x1024", "1024x1536", "1536x1024"], index=0)
            quality = st.selectbox("质量", ["low", "medium", "high"], index=0)

        st.caption(f"配置文件：{CONFIG_PATH}")
        st.caption(f"提示词模板：{PROMPT_TEMPLATE_PATH}")

    left, right = st.columns([0.92, 1.08], gap="large")

    with left:
        user_description = st.text_area(
            "描述框",
            value="新中式牡丹花纹，适合高端床品，颜色要清雅但有一点金色点缀",
            height=150,
            placeholder="例如：海浪和玉兰花融合，适合春夏床品，清爽、精致、轻奢",
        )
        uploaded_file = st.file_uploader("参考图", type=["png", "jpg", "jpeg", "webp"])
        reference_note = st.text_input("参考图侧重点", value="提取参考图的构图、色彩气质和材质感觉")
        generate = st.button("开始生成", type="primary", width="stretch")
        render_reserved_controls()

    with right:
        result_slot = st.container()

    if uploaded_file:
        with left:
            st.image(uploaded_file, caption="已上传参考图", width="stretch")

    if generate:
        if not user_description.strip():
            st.error("请先输入设计描述。")
            return

        try:
            reference_image, reference_png = prepare_reference_image(uploaded_file)
        except Exception as exc:  # noqa: BLE001
            st.error(f"参考图读取失败：{exc}")
            return

        base_prompt = compose_prompt(template, user_description, reference_note)
        prompt = base_prompt
        used_provider = provider

        with st.spinner("正在生成设计理念图..."):
            try:
                if provider == "glm5-local":
                    if not api_key:
                        st.warning("未检测到 API_KEY，已使用模板提示词和本地生成器。")
                    else:
                        prompt = call_chat_completion(api_key, api_base_url, llm_model, base_prompt, user_description, reference_note)
                    image_bytes = create_local_concept_image(f"{user_description}\n{prompt}", reference_image)
                elif provider == "openai-image":
                    if not image_api_key:
                        st.warning("未检测到 OPENAI_IMAGE_API_KEY，已自动切换到本地生成器。")
                        image_bytes = create_local_concept_image(user_description, reference_image)
                        used_provider = "local"
                    else:
                        image_bytes = call_openai_image_api(image_api_key, base_prompt, reference_png, image_model, size, quality)
                else:
                    image_bytes = create_local_concept_image(user_description, reference_image)
            except Exception as exc:  # noqa: BLE001
                st.error(f"生成失败：{exc}")
                return

        output_path = save_output(image_bytes)
        with result_slot:
            st.image(image_bytes, caption=f"生成结果：{used_provider}", width="stretch")
            st.download_button(
                "下载图片",
                data=image_bytes,
                file_name=output_path.name,
                mime="image/png",
                width="stretch",
            )
            st.success(f"已保存到：{output_path}")
            with st.expander("本次 GLM/模板提示词"):
                st.code(prompt, language="text")

    else:
        with result_slot:
            st.info("生成结果会显示在这里。")


if __name__ == "__main__":
    main()
