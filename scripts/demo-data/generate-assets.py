from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = ROOT / 'demo-data' / 'catalog.json'
ASSET_ROOT = ROOT / 'demo-data' / 'assets'

PNG_ACCENTS = {
    'AX20': ('#0F254A', '#4FB3FF'),
    'BAT': ('#222831', '#F2C94C'),
    'CTRL': ('#1F3B57', '#18A36D'),
    'DT': ('#1D3557', '#7CC6FE'),
    'HDM': ('#1E3A5F', '#1677FF'),
    'HT': ('#2D3250', '#7DC4FF'),
    'MB': ('#2D4059', '#39A0ED'),
    'SEN': ('#214E34', '#63D297'),
    'TAB': ('#233451', '#4FA7FF'),
    'TX': ('#232946', '#F97316'),
}


def load_catalog():
    return json.loads(CATALOG_PATH.read_text(encoding='utf-8'))


def ensure_parent(path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)


def font(size: int):
    try:
        return ImageFont.truetype('arial.ttf', size)
    except OSError:
        return ImageFont.load_default()


def draw_png(target: Path, title: str, model: str):
    ensure_parent(target)
    prefix = model.split('-')[0]
    bg, accent = PNG_ACCENTS.get(prefix, ('#243B55', '#4CC9F0'))
    image = Image.new('RGB', (1440, 1080), color=bg)
    draw = ImageDraw.Draw(image)

    draw.rounded_rectangle((120, 120, 1320, 960), radius=48, outline=accent, width=8)
    draw.rounded_rectangle((180, 210, 1260, 780), radius=36, fill='#F5F8FC')
    draw.rectangle((220, 260, 1220, 720), fill=accent)
    draw.text((240, 840), model, fill='white', font=font(72))
    draw.text((240, 920), title, fill='#DDE7F4', font=font(36))
    draw.text((920, 150), 'DEMO', fill=accent, font=font(44))
    image.save(target, format='PNG')


def draw_pdf(target: Path, title: str, model: str, kind: str, tags: list[str]):
    ensure_parent(target)
    pdf = canvas.Canvas(str(target), pagesize=A4)
    width, height = A4

    pdf.setFillColor(HexColor('#0F172A'))
    pdf.rect(0, height - 120, width, 120, fill=1, stroke=0)
    pdf.setFillColor(HexColor('#FFFFFF'))
    pdf.setFont('Helvetica-Bold', 28)
    pdf.drawString(48, height - 70, title)
    pdf.setFont('Helvetica', 14)
    pdf.drawString(48, height - 96, f'{model} | {kind}')

    pdf.setFillColor(HexColor('#111827'))
    pdf.setFont('Helvetica-Bold', 18)
    pdf.drawString(48, height - 170, '演示资料说明')
    pdf.setFont('Helvetica', 12)
    pdf.drawString(48, height - 198, '本文件由仓库内脚本自动生成，用于客户演示环境初始化。')
    pdf.drawString(48, height - 218, '真实业务上线时可直接替换为正式规格书、图纸、测试报告或报价附件。')

    pdf.setFont('Helvetica-Bold', 16)
    pdf.drawString(48, height - 276, '资料标签')
    pdf.setFont('Helvetica', 12)
    pdf.drawString(48, height - 300, ' / '.join(tags) if tags else '无')

    pdf.setFont('Helvetica-Bold', 16)
    pdf.drawString(48, height - 352, '建议演示要点')
    tips = [
        '1. 资料中心可按型号、分类、资料类型快速检索。',
        '2. 商品详情页支持从主资料、规格参数和报价记录联动讲解。',
        '3. 后台修改资料标题、主图或关联对象后，前台刷新即可看到结果。',
    ]
    y = height - 378
    pdf.setFont('Helvetica', 12)
    for tip in tips:
      pdf.drawString(48, y, tip)
      y -= 22

    pdf.showPage()
    pdf.save()


def draw_text(target: Path, title: str, model: str, tags: list[str]):
    ensure_parent(target)
    content = '\n'.join([
        title,
        '=' * len(title),
        '',
        f'型号: {model}',
        f'标签: {", ".join(tags) if tags else "无"}',
        '',
        '本文件用于演示环境初始化，支持前台资料打开与后台关联管理。',
        '你可以将它替换为真实的接线说明、选型表、测试摘要或报价附件。',
    ])
    target.write_text(content, encoding='utf-8')


def main():
    catalog = load_catalog()
    manifests = []

    for document in catalog['documents']:
        storage_path = document['storagePath']
        target = ASSET_ROOT / storage_path
        suffix = target.suffix.lower()

        if document['fileType'] == 'image':
            draw_png(target, document['title'], document['variantModel'])
            mime_type = 'image/png'
        elif suffix == '.pdf':
            draw_pdf(
                target,
                document['title'],
                document['variantModel'],
                document['documentKind'],
                document.get('tags', []),
            )
            mime_type = 'application/pdf'
        else:
            draw_text(
                target,
                document['title'],
                document['variantModel'],
                document.get('tags', []),
            )
            mime_type = 'text/plain'

        manifests.append(
            {
                'documentKey': document['key'],
                'localPath': str(target.relative_to(ROOT)).replace('\\', '/'),
                'mimeType': mime_type,
                'storagePath': storage_path,
                'title': document['title'],
            },
        )

    manifest_path = ASSET_ROOT / 'manifest.json'
    ensure_parent(manifest_path)
    manifest_path.write_text(
        json.dumps(manifests, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8',
    )
    print(f'Generated {len(manifests)} demo assets at {ASSET_ROOT}')


if __name__ == '__main__':
    main()
