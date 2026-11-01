from app.services.retrieval import Passage, contains_cjk, rank_passages, tokenize

PASSAGES = [
    Passage(1, "We introduce the problem of machine translation."),
    Passage(2, "Scaled dot-product attention computes queries, keys and values."),
    Passage(3, "The optimizer uses a warmup learning rate schedule."),
    Passage(4, "Results show a BLEU score improvement on the benchmark."),
    Passage(5, "Future work includes larger datasets."),
]


def test_tokenize_splits_words_and_chinese_characters() -> None:
    assert tokenize("BERT 模型-2") == ["bert", "模", "型", "2"]


def test_contains_cjk() -> None:
    assert contains_cjk("这篇论文")
    assert not contains_cjk("attention")


def test_ranks_relevant_passage_first() -> None:
    assert rank_passages(PASSAGES, "attention queries keys")[0].page == 2


def test_matching_is_case_insensitive() -> None:
    assert rank_passages(PASSAGES, "bleu SCORE")[0].page == 4


def test_limit_is_respected() -> None:
    passages = [Passage(index, "shared term here") for index in range(10)]

    assert len(rank_passages(passages, "shared", limit=3)) == 3


def test_unmatched_query_falls_back_to_opening() -> None:
    assert [p.page for p in rank_passages(PASSAGES, "zzz", limit=2)] == [1, 2]


def test_empty_passages() -> None:
    assert rank_passages([], "anything") == []


def test_short_document_still_ranks_by_overlap() -> None:
    # 只有两个切块时 BM25 的 IDF 为 0，不能因此失去排序
    passages = [Passage(1, "alpha beta"), Passage(2, "gamma delta")]

    assert rank_passages(passages, "delta")[0].page == 2


def test_chinese_query_matches_chinese_paper() -> None:
    passages = [Passage(1, "本文讨论优化器的选择"), Passage(2, "注意力机制是模型的核心")]

    assert rank_passages(passages, "什么是注意力")[0].page == 2
