(() => {
  const PERIODS = [
    { id: "day", ko: "일간", take: 12 },
    { id: "week", ko: "주간", take: 16 },
    { id: "month", ko: "월간", take: 20 },
  ];

  // titleTokens: 게시글 제목에 이게 들어가야 함
  const CATEGORIES = [
    { ko: "야짤", titleTokens: ["야짤"], search: "야짤", def: true },
    { ko: "은꼴사", titleTokens: ["은꼴사", "은꼴"], search: "은꼴사", def: true },
    { ko: "GIF / 움짤", titleTokens: ["gif", "GIF", "움짤", "Gif"], search: "야짤 gif", def: true },
    { ko: "야사", titleTokens: ["야사"], search: "야사", def: false },
    { ko: "밀프 / 아줌마", titleTokens: ["아줌마", "밀프", "야짤", "은꼴"], search: "아줌마 야짤" },
    { ko: "아마추어", titleTokens: ["아마추어", "야짤", "은꼴"], search: "아마추어 야짤" },
    { ko: "오피스 / 비서", titleTokens: ["비서", "오피스", "야짤", "은꼴"], search: "비서 야짤" },
    { ko: "사우나 / 마사지", titleTokens: ["마사지", "사우나", "야짤", "은꼴"], search: "마사지 야짤" },
    { ko: "야외 / 노출", titleTokens: ["노출", "야외", "은꼴", "야짤"], search: "노출 은꼴" },
    { ko: "헬스 / 피트니스", titleTokens: ["헬스", "은꼴", "야짤"], search: "헬스 은꼴" },
    { ko: "비키니 / 수영장", titleTokens: ["비키니", "은꼴", "야짤"], search: "비키니 은꼴" },
    { ko: "스타킹 / 레깅스", titleTokens: ["스타킹", "레깅스", "은꼴", "야짤"], search: "스타킹 은꼴" },
    { ko: "큰 가슴", titleTokens: ["큰가슴", "거유", "야짤", "은꼴"], search: "거유 야짤" },
    { ko: "엉덩이", titleTokens: ["엉덩이", "힙", "야짤", "은꼴"], search: "엉덩이 야짤" },
    { ko: "한국", titleTokens: ["한국", "야짤", "은꼴"], search: "한국 야짤" },
    { ko: "일본", titleTokens: ["일본", "야짤", "은꼴"], search: "일본 야짤" },
    { ko: "금발 / 서양", titleTokens: ["금발", "서양", "야짤", "은꼴"], search: "금발 야짤" },
    { ko: "커플 / 셀카", titleTokens: ["커플", "셀카", "야짤", "은꼴"], search: "커플 야짤" },
    { ko: "은꼴 / 아슬아슬", titleTokens: ["은꼴", "은꼴사"], search: "은꼴" },
    { ko: "하드 / 노골", titleTokens: ["야짤", "노골"], search: "야짤" },
  ];

  // 제목에 이거 있으면 스킵 (애니/그림)
  const TITLE_BAN =
    /애니|만화|일러스트|픽시브|pixiv|hentai|팬아트|동인|니케|블루아카|원피스|나루토|AI\s*그림|에이아이|2D|3D\s*렌더|스카이림|코이카츠|젤보루|단보루|와후|waifu|만화짤|애니짤|그림체|낙서|팬아트/i;

  const ANIME_URL =
    /pixiv|pximg|danbooru|donmai|gelbooru|sankaku|rule34|booru|zerochan|safebooru|wixmp|deviantart|waifu|hentai|anime|manga|nhentai|hitomi|e-hentai|civitai|novelai|aiart/i;

  const q = (s) => encodeURIComponent(s);

  // 검색 URL만 (목록 → 제목 필터 → 본문 이미지)
  const COMMUNITIES = [
    {
      id: "ilbe",
      name: "일베",
      site: "ilbe.com",
      top: true,
      listUrls: (kw) => [`https://www.ilbe.com/search?keyword=${q(kw)}`],
    },
    {
      id: "hygall",
      name: "해연갤",
      site: "hygall.com",
      top: true,
      listUrls: (kw) => [`https://hygall.com/search?keyword=${q(kw)}`],
    },
    {
      id: "dc",
      name: "디시인사이드",
      site: "dcinside.com",
      top: true,
      listUrls: (kw) => [
        `https://search.dcinside.com/post/q/${q(kw)}`,
        `https://search.dcinside.com/img/q/${q(kw)}`,
      ],
    },
    {
      id: "arca",
      name: "아카라이브",
      site: "arca.live",
      top: true,
      listUrls: (kw) => [
        `https://arca.live/search?target=article&keyword=${q(kw)}`,
        `https://arca.live/b/shade?mode=best&keyword=${q(kw)}`,
      ],
    },
    {
      id: "eto",
      name: "이토랜드",
      site: "etoland.co.kr",
      top: true,
      listUrls: (kw) => [`https://www.etoland.co.kr/bbs/search.php?keyword=${q(kw)}`],
    },
    {
      id: "fmk",
      name: "에펨코리아",
      site: "fmkorea.com",
      top: true,
      listUrls: (kw) => [
        `https://www.fmkorea.com/search.php?search_keyword=${q(kw)}&search_target=title`,
      ],
    },
    {
      id: "ou",
      name: "오늘의유머",
      site: "todayhumor.co.kr",
      top: true,
      listUrls: (kw) => [
        `https://www.todayhumor.co.kr/board/list.php?table=humorbest&kind=search&keyfield=subject&keyword=${q(kw)}`,
      ],
    },
    {
      id: "pann",
      name: "네이트판",
      site: "pann.nate.com",
      top: true,
      listUrls: (kw) => [`https://pann.nate.com/search/talk?q=${q(kw)}`],
    },
    {
      id: "theqoo",
      name: "더쿠",
      site: "theqoo.net",
      top: false,
      listUrls: (kw) => [`https://theqoo.net/search/post?keyword=${q(kw)}`],
    },
    {
      id: "ruli",
      name: "루리웹",
      site: "ruliweb.com",
      top: false,
      listUrls: (kw) => [
        `https://bbs.ruliweb.com/search?search_type=subject&search=${q(kw)}`,
      ],
    },
    {
      id: "inven",
      name: "인벤",
      site: "inven.co.kr",
      top: false,
      listUrls: (kw) => [`https://www.inven.co.kr/search/webzine/article/${q(kw)}`],
    },
    {
      id: "mlbpark",
      name: "엠팍",
      site: "mlbpark.donga.com",
      top: false,
      listUrls: (kw) => [
        `https://mlbpark.donga.com/mp/b.php?search_select=sct&search=${q(kw)}&b=bullpen`,
      ],
    },
    {
      id: "ppom",
      name: "뽐뿌",
      site: "ppomppu.co.kr",
      top: false,
      listUrls: (kw) => [
        `https://www.ppomppu.co.kr/search_bbs.php?search_type=subject&keyword=${q(kw)}`,
      ],
    },
    {
      id: "clien",
      name: "클리앙",
      site: "clien.net",
      top: false,
      listUrls: (kw) => [`https://www.clien.net/service/search?q=${q(kw)}`],
    },
    {
      id: "instiz",
      name: "인스티즈",
      site: "instiz.net",
      top: false,
      listUrls: (kw) => [`https://www.instiz.net/iframe_search.htm?k=${q(kw)}`],
    },
    {
      id: "bobae",
      name: "보배드림",
      site: "bobaedream.co.kr",
      top: false,
      listUrls: (kw) => [`https://www.bobaedream.co.kr/search?keyword=${q(kw)}`],
    },
    {
      id: "humoruniv",
      name: "웃긴대학",
      site: "humoruniv.com",
      top: false,
      listUrls: (kw) => [`https://web.humoruniv.com/main.html?search=${q(kw)}`],
    },
    {
      id: "slr",
      name: "SLR클럽",
      site: "slrclub.com",
      top: false,
      listUrls: (kw) => [`https://www.slrclub.com/search.php?keyword=${q(kw)}`],
    },
    {
      id: "cook82",
      name: "82쿡",
      site: "82cook.com",
      top: false,
      listUrls: (kw) => [`https://www.82cook.com/search.php?q=${q(kw)}`],
    },
    {
      id: "damoang",
      name: "다모앙",
      site: "damoang.net",
      top: false,
      listUrls: (kw) => [`https://damoang.net/search?q=${q(kw)}`],
    },
    {
      id: "gasengi",
      name: "가생이닷컴",
      site: "gasengi.com",
      top: false,
      listUrls: (kw) => [`https://www.gasengi.com/search.php?keyword=${q(kw)}`],
    },
    {
      id: "orbi",
      name: "오르비",
      site: "orbi.kr",
      top: false,
      listUrls: (kw) => [`https://orbi.kr/search?q=${q(kw)}`],
    },
  ];

  let selectedPeriod = "day";
  const selectedCats = new Set(
    CATEGORIES.map((c, i) => (c.def ? i : -1)).filter((i) => i >= 0)
  );
  const selectedSrc = new Set(COMMUNITIES.filter((c) => c.top).map((c) => c.id));

  let abortCtrl = null;
  let running = false;

  const periodsEl = document.getElementById("periods");
  const catsEl = document.getElementById("cats");
  const sourcesEl = document.getElementById("sources");
  const statusEl = document.getElementById("status");
  const galleryEl = document.getElementById("gallery");
  const searchBtn = document.getElementById("searchBtn");
  const stopBtn = document.getElementById("stopBtn");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const srcButtons = new Map();

  PERIODS.forEach((p) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (p.id === selectedPeriod ? " on" : "");
    btn.textContent = p.ko;
    btn.addEventListener("click", () => {
      selectedPeriod = p.id;
      periodsEl.querySelectorAll(".chip").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
    });
    periodsEl.appendChild(btn);
  });

  CATEGORIES.forEach((c, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (selectedCats.has(i) ? " on" : "");
    btn.textContent = c.ko;
    btn.addEventListener("click", () => {
      if (selectedCats.has(i)) {
        if (selectedCats.size === 1) return;
        selectedCats.delete(i);
        btn.classList.remove("on");
      } else {
        selectedCats.add(i);
        btn.classList.add("on");
      }
    });
    catsEl.appendChild(btn);
  });

  function syncSrc() {
    srcButtons.forEach((btn, id) => btn.classList.toggle("on", selectedSrc.has(id)));
  }

  COMMUNITIES.forEach((c) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (selectedSrc.has(c.id) ? " on" : "");
    btn.textContent = c.name;
    btn.addEventListener("click", () => {
      if (selectedSrc.has(c.id)) selectedSrc.delete(c.id);
      else selectedSrc.add(c.id);
      btn.classList.toggle("on", selectedSrc.has(c.id));
    });
    srcButtons.set(c.id, btn);
    sourcesEl.appendChild(btn);
  });

  document.getElementById("srcAll").onclick = () => {
    COMMUNITIES.forEach((c) => selectedSrc.add(c.id));
    syncSrc();
  };
  document.getElementById("srcTop").onclick = () => {
    selectedSrc.clear();
    COMMUNITIES.filter((c) => c.top).forEach((c) => selectedSrc.add(c.id));
    syncSrc();
  };
  document.getElementById("srcNone").onclick = () => {
    selectedSrc.clear();
    syncSrc();
  };

  function periodObj() {
    return PERIODS.find((p) => p.id === selectedPeriod) || PERIODS[0];
  }

  function selectedCategories() {
    return [...selectedCats].map((i) => CATEGORIES[i]);
  }

  function titleNeedTokens() {
    const set = new Set();
    for (const c of selectedCategories()) {
      c.titleTokens.forEach((t) => set.add(t.toLowerCase()));
    }
    return [...set];
  }

  function titleMatches(title) {
    if (!title) return false;
    if (TITLE_BAN.test(title)) return false;
    const low = title.toLowerCase();
    return titleNeedTokens().some((t) => low.includes(t.toLowerCase()));
  }

  function thrownIfAborted() {
    if (abortCtrl?.signal?.aborted) {
      const e = new Error("STOPPED");
      e.name = "AbortError";
      throw e;
    }
  }

  async function fetchText(url) {
    thrownIfAborted();
    const jina = "https://r.jina.ai/" + url;
    const r = await fetch(jina, {
      signal: abortCtrl.signal,
      headers: {
        Accept: "text/html",
        "X-Return-Format": "html",
        "X-Timeout": "20",
      },
    });
    thrownIfAborted();
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.text();
  }

  function normalizeUrl(u, base) {
    if (!u) return null;
    let s = String(u).trim().replace(/&amp;/g, "&").replace(/^['"]|['"]$/g, "");
    if (!s || s.startsWith("data:")) return null;
    if (s.startsWith("//")) s = "https:" + s;
    if (s.startsWith("/") && base) {
      try {
        s = new URL(s, base).href;
      } catch {
        return null;
      }
    }
    if (!/^https?:\/\//i.test(s)) return null;
    return s;
  }

  function parseViews(chunk) {
    // 조회/뷰/hit 숫자
    const patterns = [
      /조회\s*수?\s*[:：]?\s*([\d,]+)/i,
      /views?\s*[:：]?\s*([\d,]+)/i,
      /hit\s*[:：]?\s*([\d,]+)/i,
      /(?:^|[^\d])([\d,]{2,7})\s*(?:views?|hit|회|명)?/i,
    ];
    for (const re of patterns) {
      const m = chunk.match(re);
      if (m) return parseInt(m[1].replace(/,/g, ""), 10) || 0;
    }
    // 순수 큰 숫자 (목록 테이블용)
    const nums = [...chunk.matchAll(/\b(\d{3,7})\b/g)].map((m) => parseInt(m[1], 10));
    if (nums.length) return Math.max(...nums);
    return 0;
  }

  function extractPostsFromList(html, community, listUrl) {
    const posts = [];
    const seen = new Set();
    const site = community.site;

    // markdown/html 링크
    const linkRe =
      /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>|\[([^\]]{2,160})\]\((https?:\/\/[^)]+)\)/gi;

    let m;
    while ((m = linkRe.exec(html))) {
      let href = m[1] || m[4];
      let title = (m[2] || m[3] || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      href = normalizeUrl(href, listUrl);
      if (!href || !title || title.length < 2) continue;
      if (!href.includes(site)) continue;
      if (/search|login|join|\.css|\.js\b|\/help|공지|notice/i.test(href + title)) continue;
      if (!/\/\d{5,}|\b(view|article|post|bbs|board|talk|b\/[^/]+\/\d+)/i.test(href)) continue;
      if (seen.has(href)) continue;
      if (!titleMatches(title)) continue;

      // 링크 주변 텍스트에서 조회수
      const idx = m.index;
      const around = html.slice(Math.max(0, idx - 80), Math.min(html.length, idx + 280));
      const views = parseViews(around);

      seen.add(href);
      posts.push({ title, href, views, community: community.name });
    }

    return posts;
  }

  function isJunkImg(url) {
    return /sprite|icon|logo|emoji|avatar|profile|ads?|banner|button|loading|blank|1x1|pixel|favicon|emoticon|stamp/i.test(
      url
    );
  }

  function extractImagesFromPost(html, base) {
    const found = new Set();
    const push = (raw) => {
      const u = normalizeUrl(raw, base);
      if (!u) return;
      if (!/\.(jpe?g|png|webp|gif)(\?|$)/i.test(u.split("#")[0])) return;
      if (isJunkImg(u) || ANIME_URL.test(u)) return;
      found.add(u.split("#")[0]);
    };

    for (const x of html.matchAll(
      /(?:src|data-src|data-original|data-lazy|data-url)\s*=\s*["']([^"']+)["']/gi
    )) {
      push(x[1]);
    }
    for (const x of html.matchAll(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi)) push(x[1]);
    for (const x of html.matchAll(
      /https?:\/\/[^\s"'<>)\\]+?\.(?:jpe?g|png|webp|gif)(?:\?[^\s"'<>)\\]*)?/gi
    )) {
      push(x[0].replace(/[.,;)]+$/, ""));
    }
    return [...found];
  }

  function renderGallery(images) {
    galleryEl.innerHTML = "";
    images.forEach((src) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "shot";
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      img.onerror = () => btn.remove();
      btn.appendChild(img);
      btn.addEventListener("click", () => {
        lightboxImg.src = src;
        lightbox.hidden = false;
      });
      galleryEl.appendChild(btn);
    });
  }

  lightbox.addEventListener("click", () => {
    lightbox.hidden = true;
    lightboxImg.removeAttribute("src");
  });

  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = "status" + (kind ? ` ${kind}` : "");
  }

  function setRunning(on) {
    running = on;
    searchBtn.disabled = on;
    stopBtn.disabled = !on;
  }

  stopBtn.addEventListener("click", () => {
    if (!running || !abortCtrl) return;
    abortCtrl.abort();
    setStatus("검색 중지됨. 지금까지 모은 사진만 보여줌.", "ok");
    setRunning(false);
  });

  async function runSearch() {
    const communities = COMMUNITIES.filter((c) => selectedSrc.has(c.id));
    if (!communities.length) {
      setStatus("커뮤니티를 하나 이상 골라줘.", "error");
      return;
    }
    if (!selectedCats.size) {
      setStatus("카테고리를 하나 이상 골라줘.", "error");
      return;
    }

    const period = periodObj();
    const cats = selectedCategories();
    const searchKeywords = [...new Set(cats.map((c) => c.search))];

    abortCtrl = new AbortController();
    setRunning(true);
    galleryEl.innerHTML = "";

    const images = [];
    const seenImg = new Set();
    const allPosts = [];
    const seenPost = new Set();

    try {
      for (const c of communities) {
        thrownIfAborted();
        setStatus(`${c.name}에서 제목 매칭 글 찾는 중...`, "");

        for (const kw of searchKeywords) {
          thrownIfAborted();
          for (const listUrl of c.listUrls(kw).slice(0, 2)) {
            thrownIfAborted();
            try {
              const html = await fetchText(listUrl);
              const posts = extractPostsFromList(html, c, listUrl);
              for (const p of posts) {
                if (seenPost.has(p.href)) continue;
                seenPost.add(p.href);
                allPosts.push(p);
              }
              setStatus(
                `${c.name} · 「${kw}」 제목매칭 ${posts.length}개 (누적 글 ${allPosts.length})`,
                ""
              );
            } catch (e) {
              if (e.name === "AbortError" || e.message === "STOPPED") throw e;
            }
          }
        }
      }

      // 조회수 높은 순 → 기간별 상위 N개만
      allPosts.sort((a, b) => b.views - a.views || a.title.localeCompare(b.title));
      const topPosts = allPosts.slice(0, period.take * Math.max(1, communities.length));

      if (!topPosts.length) {
        setStatus("제목에 야짤/은꼴 들어간 글을 못 찾았어. 커뮤니티를 바꿔봐.", "error");
        setRunning(false);
        return;
      }

      setStatus(`조회수 상위 ${topPosts.length}개 글에서 사진 뽑는 중...`, "");

      for (let i = 0; i < topPosts.length; i++) {
        thrownIfAborted();
        const p = topPosts[i];
        setStatus(
          `[${i + 1}/${topPosts.length}] ${p.community} · 조회 ${p.views || "?"} · ${p.title.slice(0, 28)}`,
          ""
        );
        try {
          const html = await fetchText(p.href);
          const imgs = extractImagesFromPost(html, p.href);
          for (const src of imgs) {
            if (seenImg.has(src)) continue;
            seenImg.add(src);
            images.push(src);
          }
          // gif 우선 정렬
          images.sort((a, b) => Number(/\.gif/i.test(b)) - Number(/\.gif/i.test(a)));
          renderGallery(images);
        } catch (e) {
          if (e.name === "AbortError" || e.message === "STOPPED") throw e;
        }
      }

      setRunning(false);
      if (!images.length) {
        setStatus("글은 찾았는데 이미지가 없었어.", "error");
        return;
      }
      setStatus(
        `제목매칭 ${allPosts.length}글 → 상위 ${topPosts.length}글 · 사진 ${images.length}장`,
        "ok"
      );
    } catch (e) {
      if (e.name === "AbortError" || e.message === "STOPPED") {
        setRunning(false);
        renderGallery(images);
        setStatus(`중지됨 · 사진 ${images.length}장까지 표시`, "ok");
        return;
      }
      setRunning(false);
      setStatus("오류: " + (e.message || e), "error");
    }
  }

  searchBtn.addEventListener("click", () => {
    if (running) return;
    runSearch();
  });
})();
