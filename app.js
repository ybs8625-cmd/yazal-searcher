(() => {
  const CATEGORIES = [
    { ko: "밀프 / 아줌마", en: "milf", kr: "아줌마" },
    { ko: "아마추어", en: "amateur homemade", kr: "아마추어" },
    { ko: "오피스 / 비서", en: "secretary office", kr: "비서" },
    { ko: "선생님", en: "teacher", kr: "여선생님" },
    { ko: "간호사", en: "nurse", kr: "간호사" },
    { ko: "사우나 / 마사지", en: "massage sauna", kr: "마사지" },
    { ko: "코스프레", en: "cosplay", kr: "코스프레" },
    { ko: "교복 / 코스튬", en: "uniform cosplay", kr: "교복" },
    { ko: "야외 / 노출", en: "outdoor public nude", kr: "야외노출" },
    { ko: "헬스 / 피트니스", en: "gym fitness", kr: "헬스녀" },
    { ko: "비키니 / 수영장", en: "bikini pool", kr: "비키니" },
    { ko: "스타킹 / 레깅스", en: "stockings legs", kr: "스타킹" },
    { ko: "큰 가슴", en: "big tits", kr: "큰가슴" },
    { ko: "엉덩이", en: "big ass", kr: "엉덩이" },
    { ko: "아시아", en: "asian", kr: "아시아" },
    { ko: "일본", en: "japanese", kr: "일본" },
    { ko: "한국", en: "korean", kr: "한국" },
    { ko: "금발 / 서양", en: "blonde western", kr: "금발" },
    { ko: "커플 / 셀카", en: "couple selfie", kr: "커플셀카" },
    { ko: "GIF / 움짤", en: "gif nsfw", kr: "움짤" },
    { ko: "은꼴 / 아슬아슬", en: "softcore teasing", kr: "은꼴" },
    { ko: "하드 / 노골", en: "explicit nsfw", kr: "야짤" },
  ];

  // 커뮤니티별 검색 URL 생성 (실제 이미지 다운로드/저장 안 함 — 검색 페이지로 연결)
  const SOURCES = [
    {
      id: "google",
      name: "구글 이미지",
      lang: "en",
      defaultOn: true,
      build: (en) =>
        `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(en + " nsfw")}`,
    },
    {
      id: "bing",
      name: "빙 이미지",
      lang: "en",
      defaultOn: true,
      build: (en) =>
        `https://www.bing.com/images/search?q=${encodeURIComponent(en + " nsfw")}`,
    },
    {
      id: "reddit",
      name: "레딧",
      lang: "en",
      defaultOn: true,
      build: (en) =>
        `https://www.reddit.com/search/?q=${encodeURIComponent(en)}&type=link`,
    },
    {
      id: "x",
      name: "X (트위터)",
      lang: "en",
      defaultOn: true,
      build: (en, kr) =>
        `https://x.com/search?q=${encodeURIComponent(en || kr)}&src=typed_query&f=image`,
    },
    {
      id: "duck",
      name: "덕덕고 이미지",
      lang: "en",
      defaultOn: false,
      build: (en) =>
        `https://duckduckgo.com/?q=${encodeURIComponent(en + " nsfw")}&iax=images&ia=images`,
    },
    {
      id: "naver",
      name: "네이버 이미지",
      lang: "kr",
      defaultOn: true,
      build: (_en, kr) =>
        `https://search.naver.com/search.naver?where=image&query=${encodeURIComponent(kr)}`,
    },
    {
      id: "daum",
      name: "다음 이미지",
      lang: "kr",
      defaultOn: false,
      build: (_en, kr) =>
        `https://search.daum.net/search?w=img&q=${encodeURIComponent(kr)}`,
    },
    {
      id: "dc",
      name: "디시 검색",
      lang: "kr",
      defaultOn: false,
      build: (_en, kr) =>
        `https://search.dcinside.com/post/q/${encodeURIComponent(kr)}`,
    },
    {
      id: "youtube",
      name: "유튜브 (참고)",
      lang: "en",
      defaultOn: false,
      build: (en) =>
        `https://www.youtube.com/results?search_query=${encodeURIComponent(en)}`,
    },
  ];

  const DICT = [
    ["옆집 아줌마", "neighbor milf", "옆집아줌마"],
    ["옆집아줌마", "neighbor milf", "옆집아줌마"],
    ["아줌마", "milf", "아줌마"],
    ["엄마친구", "mom friend milf", "엄마친구"],
    ["새엄마", "stepmother", "새엄마"],
    ["여동생", "stepsister", "여동생"],
    ["누나", "older sister", "누나"],
    ["여사친", "female friend", "여사친"],
    ["여친구", "girlfriend", "여친구"],
    ["와이프", "wife", "와이프"],
    ["비서", "secretary", "비서"],
    ["여비서", "secretary", "여비서"],
    ["선생님", "teacher", "선생님"],
    ["여선생님", "female teacher", "여선생님"],
    ["간호사", "nurse", "간호사"],
    ["사우나", "sauna", "사우나"],
    ["마사지", "massage", "마사지"],
    ["자취방", "apartment selfie", "자취방"],
    ["원룸", "one room", "원룸"],
    ["모텔", "motel", "모텔"],
    ["호텔", "hotel", "호텔"],
    ["야외", "outdoor", "야외"],
    ["노출", "exhibitionist nude", "노출"],
    ["피팅룸", "fitting room", "피팅룸"],
    ["헬스장", "gym", "헬스장"],
    ["수영장", "pool", "수영장"],
    ["비키니", "bikini", "비키니"],
    ["코스프레", "cosplay", "코스프레"],
    ["메이드", "maid", "메이드"],
    ["교복", "school uniform", "교복"],
    ["스타킹", "stockings", "스타킹"],
    ["레깅스", "leggings", "레깅스"],
    ["움짤", "gif", "움짤"],
    ["야짤", "nsfw pic", "야짤"],
    ["은꼴", "softcore", "은꼴"],
    ["셀카", "selfie", "셀카"],
    ["일본", "japanese", "일본"],
    ["한국", "korean", "한국"],
    ["금발", "blonde", "금발"],
    ["큰가슴", "big tits", "큰가슴"],
    ["엉덩이", "big ass", "엉덩이"],
    ["아마추어", "amateur", "아마추어"],
    ["개인촬영", "amateur homemade", "개인촬영"],
    ["커플", "couple", "커플"],
  ];

  const selectedCats = new Set();
  const selectedSrc = new Set(SOURCES.filter((s) => s.defaultOn).map((s) => s.id));

  const catsEl = document.getElementById("cats");
  const sourcesEl = document.getElementById("sources");
  const titleEl = document.getElementById("title");
  const previewKo = document.getElementById("previewKo");
  const previewEn = document.getElementById("previewEn");
  const previewSrc = document.getElementById("previewSrc");
  const linksEl = document.getElementById("links");

  CATEGORIES.forEach((c, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = c.ko;
    btn.dataset.i = String(i);
    btn.addEventListener("click", () => {
      if (selectedCats.has(i)) {
        selectedCats.delete(i);
        btn.classList.remove("on");
      } else {
        selectedCats.add(i);
        btn.classList.add("on");
      }
      updatePreview();
    });
    catsEl.appendChild(btn);
  });

  SOURCES.forEach((s) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (selectedSrc.has(s.id) ? " on" : "");
    btn.textContent = s.name;
    btn.dataset.id = s.id;
    btn.addEventListener("click", () => {
      if (selectedSrc.has(s.id)) {
        selectedSrc.delete(s.id);
        btn.classList.remove("on");
      } else {
        selectedSrc.add(s.id);
        btn.classList.add("on");
      }
      updatePreview();
    });
    sourcesEl.appendChild(btn);
  });

  function translate(text) {
    let rest = (text || "").trim();
    if (!rest) return { en: "", kr: "" };

    const enFound = [];
    const krFound = [];
    const sorted = [...DICT].sort((a, b) => b[0].length - a[0].length);
    for (const [ko, en, kr] of sorted) {
      if (rest.includes(ko)) {
        enFound.push(en);
        krFound.push(kr || ko);
        rest = rest.split(ko).join(" ");
      }
    }
    rest = rest.replace(/\s+/g, " ").trim();

    if (!enFound.length && /[가-힣]/.test(text)) {
      return { en: guessEn(text), kr: text.trim() };
    }
    return {
      en: enFound.join(" "),
      kr: (krFound.join(" ") + (rest ? " " + rest : "")).trim() || text.trim(),
    };
  }

  function guessEn(text) {
    if (text.includes("아줌")) return "milf";
    if (text.includes("비서")) return "secretary";
    if (text.includes("선생")) return "teacher";
    if (text.includes("간호")) return "nurse";
    if (text.includes("마사") || text.includes("안마")) return "massage";
    if (text.includes("일본")) return "japanese";
    if (text.includes("한국")) return "korean";
    if (text.includes("움짤") || text.includes("gif")) return "gif nsfw";
    return "nsfw";
  }

  function buildQuery() {
    const catKo = [...selectedCats].map((i) => CATEGORIES[i].ko);
    const catEn = [...selectedCats].map((i) => CATEGORIES[i].en);
    const catKr = [...selectedCats].map((i) => CATEGORIES[i].kr);

    const titleKo = titleEl.value.trim();
    const t = translate(titleKo);

    const koParts = [...catKo];
    if (titleKo) koParts.push(titleKo);

    const enParts = [...catEn];
    if (t.en) enParts.push(t.en);

    const krParts = [...catKr];
    if (t.kr) krParts.push(t.kr);
    if (!krParts.length && titleKo) krParts.push(titleKo);

    const en = [...new Set(enParts.join(" ").split(/\s+/).filter(Boolean))].join(" ");
    const kr = [...new Set(krParts.join(" ").split(/\s+/).filter(Boolean))].join(" ");

    const srcNames = SOURCES.filter((s) => selectedSrc.has(s.id)).map((s) => s.name);

    return {
      ko: koParts.join(" · ") || "(선택 없음)",
      en: en || "nsfw",
      kr: kr || "야짤",
      srcNames,
    };
  }

  function buildLinks() {
    const q = buildQuery();
    return SOURCES.filter((s) => selectedSrc.has(s.id)).map((s) => ({
      name: s.name,
      url: s.build(q.en, q.kr),
      query: s.lang === "kr" ? q.kr : q.en,
    }));
  }

  function updatePreview() {
    const q = buildQuery();
    previewKo.textContent = q.ko;
    previewEn.textContent = q.en;
    previewSrc.textContent = q.srcNames.length ? q.srcNames.join(", ") : "(커뮤니티 선택 없음)";
  }

  function renderLinks(links) {
    linksEl.innerHTML = "";
    links.forEach((l) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = l.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = `<strong>${l.name}</strong><span class="meta">검색어: ${l.query}</span>`;
      li.appendChild(a);
      linksEl.appendChild(li);
    });
  }

  function runSearch(openTabs) {
    const links = buildLinks();
    if (!links.length) {
      alert("커뮤니티를 하나 이상 골라줘!");
      return;
    }
    renderLinks(links);
    if (openTabs) {
      // 브라우저 팝업 차단 대비: 첫 탭은 현재 창 이동 없이 순차 open
      links.forEach((l, i) => {
        setTimeout(() => window.open(l.url, "_blank", "noopener,noreferrer"), i * 250);
      });
    }
  }

  document.getElementById("searchBtn").addEventListener("click", () => runSearch(true));

  document.getElementById("luckyBtn").addEventListener("click", () => {
    selectedCats.clear();
    catsEl.querySelectorAll(".chip").forEach((c) => c.classList.remove("on"));
    const picks = new Set();
    while (picks.size < 2) picks.add(Math.floor(Math.random() * CATEGORIES.length));
    picks.forEach((i) => {
      selectedCats.add(i);
      catsEl.querySelector(`.chip[data-i="${i}"]`)?.classList.add("on");
    });
    const lucky = [
      "옆집 아줌마",
      "여비서",
      "사우나 마사지",
      "코스프레",
      "비키니",
      "헬스장",
      "움짤",
      "은꼴",
      "커플 셀카",
    ];
    titleEl.value = lucky[Math.floor(Math.random() * lucky.length)];
    updatePreview();
    runSearch(true);
  });

  titleEl.addEventListener("input", updatePreview);
  updatePreview();
})();
