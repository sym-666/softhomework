from app.models import Paper
from app.services.export import (
    bibtex_entry,
    citation_key,
    escape_bibtex,
    format_authors,
    papers_to_bibtex,
)


def make_paper(**fields) -> Paper:
    values = {
        "id": 1,
        "title": "Attention Is All You Need",
        "authors": "Ashish Vaswani, Noam Shazeer",
        "year": 2017,
        "source_url": None,
    }
    return Paper(**(values | fields))


def test_escape_covers_special_characters() -> None:
    assert escape_bibtex("R&D 100% $x_1$ #1") == r"R\&D 100\% \$x\_1\$ \#1"
    assert escape_bibtex("a{b}") == r"a\{b\}"


def test_escape_keeps_backslash_replacement_intact() -> None:
    # 逐字符替换：反斜杠替换结果里的花括号不能被再次转义
    assert escape_bibtex("a\\b") == r"a\textbackslash{}b"


def test_escape_flattens_line_breaks() -> None:
    assert escape_bibtex("line one\n  line two") == "line one line two"


def test_authors_are_joined_with_and() -> None:
    assert format_authors("Ashish Vaswani, Noam Shazeer") == "Ashish Vaswani and Noam Shazeer"
    assert format_authors("A B; C D and E F") == "A B and C D and E F"
    assert format_authors("张三、李四") == "张三 and 李四"


def test_et_al_becomes_others() -> None:
    assert format_authors("Vaswani et al.") == "Vaswani and others"


def test_key_uses_surname_year_and_first_meaningful_word() -> None:
    assert citation_key(make_paper()) == "vaswani2017attention"
    assert citation_key(make_paper(title="On the Origin")) == "vaswani2017origin"


def test_key_strips_accents() -> None:
    assert citation_key(make_paper(authors="José Núñez")) == "nunez2017attention"


def test_key_falls_back_to_id_for_non_ascii_names() -> None:
    assert citation_key(make_paper(id=7, authors="张三")) == "paper7"
    assert citation_key(make_paper(id=8, title="注意力机制")) == "paper8"


def test_entry_contains_all_fields() -> None:
    entry = bibtex_entry(make_paper(source_url="https://example.com/a_b"), "key1")

    assert entry.startswith("@article{key1,\n")
    assert "  title = {Attention Is All You Need}," in entry
    assert "  author = {Ashish Vaswani and Noam Shazeer}," in entry
    assert "  year = {2017}," in entry
    assert "  url = {https://example.com/a_b}," in entry
    assert entry.endswith("\n}")


def test_entry_without_url_has_no_url_field() -> None:
    assert "url" not in bibtex_entry(make_paper(), "key1")


def test_duplicate_keys_get_a_suffix() -> None:
    text = papers_to_bibtex([make_paper(id=1), make_paper(id=2), make_paper(id=3)])

    assert "@article{vaswani2017attention," in text
    assert "@article{vaswani2017attention2," in text
    assert "@article{vaswani2017attention3," in text


def test_empty_library_exports_nothing() -> None:
    assert papers_to_bibtex([]) == ""
