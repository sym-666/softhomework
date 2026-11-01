from fastapi.testclient import TestClient

from app.services.pdf_text import PageText
from app.services.references import (
    find_reference_section,
    guess_title,
    parse_references,
    split_references,
)
from tests.pdf_factory import make_pdf
from tests.test_papers import upload

BRACKETED = (
    "Body of the paper cites [1] and [2]. Acknowledgments go here. References "
    "[1] Jimmy Lei Ba, Jamie Kiros, and Geoffrey Hinton. Layer normalization. "
    "arXiv preprint arXiv:1607.06450, 2016. "
    "[2] Sepp Hochreiter and Jurgen Schmidhuber. Long short-term memory. "
    "Neural computation, 9(8):1735-1780, 1997. 10"
)


def pages_of(*texts: str) -> list[PageText]:
    return [PageText(index + 1, text) for index, text in enumerate(texts)]


def test_bracketed_references_are_split() -> None:
    references = parse_references(pages_of(BRACKETED))

    assert [item.index for item in references] == [1, 2]
    assert references[0].title == "Layer normalization"
    assert references[0].year == 2016
    assert references[1].title == "Long short-term memory"
    assert references[1].year == 1997


def test_page_number_is_removed_from_entry() -> None:
    assert parse_references(pages_of(BRACKETED))[1].text.endswith("1997.")


def test_section_continues_across_pages() -> None:
    first = "References [1] Alice Smith. A first paper title. Journal, 2010."
    second = "[2] Bob Jones. A second paper title. Journal, 2011."

    assert len(parse_references(pages_of(first, second))) == 2


def test_citations_in_body_do_not_split_entries() -> None:
    text = (
        "References [1] Alice Smith. Extending the method of [7] further. Journal, 2010. "
        "[2] Bob Jones. Another study entirely. Journal, 2011."
    )

    references = parse_references(pages_of(text))

    assert len(references) == 2
    assert "[7]" in references[0].text


def test_dot_numbered_references() -> None:
    text = (
        "References 1. Alice Smith. A first paper title. Journal, 2010. "
        "2. Bob Jones. A second paper title. Journal, 2011."
    )

    references = parse_references(pages_of(text))

    assert [item.title for item in references] == ["A first paper title", "A second paper title"]


def test_paragraph_references_without_numbers() -> None:
    text = (
        "References\n\nSmith, A. (2010). A first paper title. Journal.\n\n"
        "Jones, B. (2011). A second paper title. Journal."
    )

    assert len(parse_references(pages_of(text))) == 2


def test_author_year_references_on_one_line() -> None:
    text = (
        "References Smith, A. (2010). A first paper title. Journal of Things. "
        "Jones, B. (2011). A second paper title. Journal of Stuff."
    )

    assert len(parse_references(pages_of(text))) == 2


def test_chinese_heading() -> None:
    text = (
        "参考文献 [1] 张三. 注意力机制研究进展综述. 计算机学报, 2020. "
        "[2] 李四. 深度学习方法综述. 软件学报, 2021."
    )

    references = parse_references(pages_of(text))

    assert [item.year for item in references] == [2020, 2021]


def test_appendix_after_references_is_trimmed() -> None:
    text = BRACKETED[:-3] + " Appendix Attention Visualizations Input-Input Layer5 and more text"

    assert parse_references(pages_of(text))[-1].text.endswith("1997.")


def test_last_heading_with_numbers_wins() -> None:
    text = (
        "Our Bibliography tool is described here. References "
        "[1] Alice Smith. A first paper title. Journal, 2010. "
        "[2] Bob Jones. A second paper title. Journal, 2011."
    )

    assert find_reference_section(pages_of(text)).startswith("[1] Alice")


def test_lowercase_word_is_not_a_heading() -> None:
    assert find_reference_section(pages_of("the references below are useful")) == ""


def test_paper_without_references() -> None:
    assert parse_references(pages_of("Just a body of text with no such section.")) == []


def test_split_keeps_only_sequential_numbers() -> None:
    assert len(split_references("[1] first entry here [3] not next [2] second entry")) == 2


def test_title_skips_authors_and_venue() -> None:
    text = "A. Author, B. Author. In Proceedings of ACL, pages 1-2. A real title here. ACL, 2010."

    assert guess_title(text) == "A real title here"


def test_title_with_commas_is_not_mistaken_for_authors() -> None:
    text = "Slav Petrov and Dan Klein. Learning accurate, compact, and interpretable trees. ACL."

    assert guess_title(text) == "Learning accurate, compact, and interpretable trees"


def test_title_keeps_question_mark_and_drops_year() -> None:
    assert (
        guess_title("Ada King. Can active memory replace attention? NIPS, 2016.")
        == "Can active memory replace attention?"
    )
    assert guess_title("Ada King. Gradient flow in nets, 2001.") == "Gradient flow in nets"


def test_unusual_format_falls_back_to_text() -> None:
    assert guess_title("Ada King, 2016") == "Ada King, 2016"


def references_url(paper_id: int) -> str:
    return f"/api/Papers/{paper_id}/references"


def test_references_endpoint_reads_the_pdf(user_client: TestClient) -> None:
    paper_id = upload(user_client, make_pdf([BRACKETED]))

    response = user_client.get(references_url(paper_id))

    assert response.status_code == 200
    body = response.json()
    assert [item["title"] for item in body] == ["Layer normalization", "Long short-term memory"]


def test_external_paper_has_no_references(user_client: TestClient) -> None:
    created = user_client.post(
        "/api/Papers",
        data={"Title": "T", "Authors": "A", "Year": "2020", "Url": "https://example.com"},
    )

    assert user_client.get(references_url(created.json()["id"])).json() == []


def test_references_for_missing_paper(user_client: TestClient) -> None:
    assert user_client.get(references_url(999)).status_code == 404


def test_references_require_login(client: TestClient) -> None:
    assert client.get(references_url(1)).status_code == 401
