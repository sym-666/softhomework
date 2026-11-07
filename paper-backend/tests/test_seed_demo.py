import random
from datetime import UTC, datetime, timedelta

from scripts.seed_demo import (
    PAPERS,
    find_highlights,
    normalize_rects,
    parse_arxiv_feed,
    parse_notes,
    pick_key_sentences,
    review_state,
    spread_times,
)
from tests.pdf_factory import make_pdf

FEED = """<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/1706.03762v7</id>
    <published>2017-06-12T17:57:34Z</published>
    <title>Attention Is All
      You Need</title>
    <summary>  The dominant sequence transduction models
      are based on recurrent networks.  </summary>
    <author><name>Ashish Vaswani</name></author>
    <author><name>Noam   Shazeer</name></author>
  </entry>
  <entry>
    <id>http://arxiv.org/abs/broken</id>
    <title></title>
  </entry>
</feed>"""


def test_feed_is_parsed_without_version_and_extra_spaces():
    result = parse_arxiv_feed(FEED)

    assert list(result) == ["1706.03762"]
    meta = result["1706.03762"]
    assert meta.title == "Attention Is All You Need"
    assert meta.authors == "Ashish Vaswani, Noam Shazeer"
    assert meta.year == 2017
    assert meta.abstract == (
        "The dominant sequence transduction models are based on recurrent networks."
    )
    assert meta.url == "https://arxiv.org/abs/1706.03762"


def test_notes_keep_only_known_pages_and_valid_items():
    data = {
        "notes": [
            {"content": " 注意力取代循环结构 ", "page": 2},
            {"content": "编造的页码", "page": 99},
            {"content": "布尔值不是页码", "page": True},
            {"content": ""},
            "not a dict",
            {"content": "第四条", "page": 3},
        ]
    }

    notes = parse_notes(data, {2, 3}, limit=3)

    assert [(note.content, note.page) for note in notes] == [
        ("注意力取代循环结构", 2),
        ("编造的页码", None),
        ("布尔值不是页码", None),
    ]


def test_notes_ignore_unexpected_shape():
    assert parse_notes({"notes": "oops"}, {1}) == []
    assert parse_notes({}, {1}) == []


def test_key_sentences_are_contribution_statements_of_reasonable_length():
    text = (
        "Recurrent models are slow. In this work we propose the Transformer, a model "
        "architecture based solely on attention. Short. We show that it "
        "generalizes well to other tasks such as English constituency parsing. "
        + "Our model achieves a very long result " + "x" * 300 + "."
    )

    sentences = pick_key_sentences(text)

    assert sentences == [
        "In this work we propose the Transformer, a model architecture based solely on attention.",
        "We show that it generalizes well to other tasks such as English constituency parsing.",
    ]


def test_license_and_venue_sentences_are_not_highlighted():
    text = (
        "Provided proper attribution is provided, Google hereby grants permission to "
        "reproduce the tables and figures in this paper. 31st Conference on Neural "
        "Information Processing Systems, where we present results. In this paper we "
        "present a simple model that outperforms prior work. X ! xT −! · · · −! x0 "
        "p(xt−1|xt) we show q(xt|xt−1) ∗∗∗. Figure 2: We show the directed graphical "
        "model used in this work."
    )

    assert pick_key_sentences(text) == [
        "In this paper we present a simple model that outperforms prior work."
    ]


def test_rects_are_converted_to_page_ratios_and_clamped():
    rects = normalize_rects([(60, 80, 300, 92), (500, 700, 700, 712), (10, 10, 10, 20)], 600, 800)

    assert rects == [
        {"x": 0.1, "y": 0.1, "width": 0.4, "height": 0.015},
        {"x": 0.83333, "y": 0.875, "width": 0.16667, "height": 0.015},
    ]


def test_highlights_are_located_in_the_pdf(tmp_path):
    path = tmp_path / "paper.pdf"
    path.write_bytes(
        make_pdf(
            [
                "Abstract. Sequence models are slow. We propose a new simple network "
                "architecture based solely on attention mechanisms.",
                "",
            ]
        )
    )

    highlights = find_highlights(path)

    assert len(highlights) == 1
    assert highlights[0].page == 1
    assert highlights[0].text.startswith("We propose a new simple network")
    rect = highlights[0].rects[0]
    assert 0 < rect["x"] < 1 and 0 < rect["y"] < 1 and rect["width"] > 0


def test_times_stay_within_the_window_and_are_sorted():
    now = datetime(2026, 11, 7, 12, 0, tzinfo=UTC)

    moments = spread_times(50, now, random.Random(1))

    assert moments == sorted(moments)
    assert all(now - timedelta(days=14) < moment <= now for moment in moments)
    assert len({moment.date() for moment in moments}) > 7


def test_times_are_distinct_and_in_the_past_even_late_in_the_day():
    # 早上 8 点：今天大部分候选钟点还没到，不能都截成当前时间
    now = datetime(2026, 11, 7, 8, 0, tzinfo=UTC)

    moments = spread_times(60, now, random.Random(5))

    assert all(moment < now for moment in moments)
    assert len(set(moments)) == len(moments)


def test_review_states_cover_due_upcoming_and_mastered_cards():
    now = datetime(2026, 11, 7, 12, 0, tzinfo=UTC)
    rng = random.Random(3)

    states = [review_state(rng, now) for _ in range(200)]

    due = [box for box, due_at in states if due_at <= now]
    mastered = [box for box, _ in states if box >= 3]
    assert due and all(box == 0 for box in due)
    assert mastered and all(due_at > now + timedelta(days=6) for box, due_at in states if box >= 3)
    assert all(due_at <= now + timedelta(days=30) for _, due_at in states)


def test_demo_papers_are_unique_and_reading_status_is_valid():
    ids = [paper.arxiv_id for paper in PAPERS]

    assert len(ids) == len(set(ids))
    assert all(paper.status in (None, "reading", "done") for paper in PAPERS)
    assert all(not paper.status for paper in PAPERS if paper.external)
