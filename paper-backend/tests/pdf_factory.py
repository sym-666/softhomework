import pymupdf


def make_pdf(pages: list[str]) -> bytes:
    """生成带真实文字的 PDF，页内容为空字符串时生成空白页。"""
    document = pymupdf.open()
    for text in pages:
        page = document.new_page()
        if text:
            page.insert_textbox(pymupdf.Rect(50, 50, 550, 780), text, fontsize=10)
    return document.tobytes()
