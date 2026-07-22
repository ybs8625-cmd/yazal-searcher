(() => {
  const KINDS = [
    { id: "yasa", ko: "야사", q: "야사", wantPosts: true, wantImages: false },
    { id: "yazal", ko: "야짤", q: "야짤", wantPosts: false, wantImages: true },
    { id: "eungol", ko: "은꼴사", q: "은꼴사", wantPosts: true, wantImages: true },
  ];

  const CATEGORIES = [
    { ko: "밀프 / 아줌마", kr: "아줌마" },
    { ko: "아마추어", kr: "아마추어" },
    { ko: "오피스 / 비서", kr: "비서" },
    { ko: "선생님", kr: "여선생님" },
    { ko: "간호사", kr: "간호사" },
    { ko: "사우나 / 마사지", kr: "마사지" },
    { ko: "코스프레", kr: "코스프레" },
    { ko: "교복 / 코스튬", kr: "코스튬" },
    { ko: "야외 / 노출", kr: "야외노출" },
    { ko: "헬스 / 피트니스", kr: "헬스녀" },
    { ko: "비키니 / 수영장", kr: "비키니" },
    { ko: "스타킹 / 레깅스", kr: "스타킹" },
    { ko: "큰 가슴", kr: "큰가슴" },
    { ko: "엉덩이", kr: "엉덩이" },
    { ko: "아시아", kr: "아시아" },
    { ko: "일본", kr: "일본" },
    { ko: "한국", kr: "한국" },
    { ko: "금발 / 서양", kr: "금발" },
    { ko: "커플 / 셀카", kr: "커플셀카" },
    { ko: "GIF / 움짤", kr: "움짤" },
    { ko: "은꼴 / 아슬아슬", kr: "은꼴" },
    { ko: "하드 / 노골", kr: "야짤" },
  ];

  const qEnc = (q) => encodeURIComponent(q);

  const COMMUNITIES = [
    {
      id: "dc",
      name: "디시인사이드",
      site: "dcinside.com",
      hostRe: /dcinside\.com|dcimg\d*\.dcinside\.com|nstatic/i,
      pages: [
        (q) => `https://search.dcinside.com/post/q/${qEnc(q)}`,
        (q) => `https://search.dcinside.com/img/q/${qEnc(q)}`,
      ],
      top: true,
    },
    {
      id: "fmk",
      name: "에펨코리아",
      site: "fmkorea.com",
      hostRe: /fmkorea\.com/i,
      pages: [
        (q) =>
          `https://www.fmkorea.com/search.php?mid=humor&search_keyword=${qEnc(q)}&search_target=title_content`,
      ],
      top: true,
    },
    {
      id: "theqoo",
      name: "더쿠",
      site: "theqoo.net",
      hostRe: /theqoo\.net/i,
      pages: [(q) => `https://theqoo.net/search/post?keyword=${qEnc(q)}`],
      top: true,
    },
    {
      id: "ruli",
      name: "루리웹",
      site: "ruliweb.com",
      hostRe: /ruliweb\.com/i,
      pages: [
        (q) =>
          `https://bbs.ruliweb.com/search?search_type=subject_content&search=${qEnc(q)}`,
      ],
      top: true,
    },
    {
      id: "arca",
      name: "아카라이브",
      site: "arca.live",
      hostRe: /arca\.live|ac\.namu\.la/i,
      pages: [(q) => `https://arca.live/search?target=all&keyword=${qEnc(q)}`],
      top: true,
    },
    {
      id: "inven",
      name: "인벤",
      site: "inven.co.kr",
      hostRe: /inven\.co\.kr/i,
      pages: [(q) => `https://www.inven.co.kr/search/webzine/article/${qEnc(q)}`],
      top: true,
    },
    {
      id: "mlbpark",
      name: "엠팍",
      site: "mlbpark.donga.com",
      hostRe: /mlbpark\.donga\.com|donga\.com/i,
      pages: [
        (q) =>
          `https://mlbpark.donga.com/mp/b.php?search_select=sct&search=${qEnc(q)}&b=bullpen`,
      ],
      top: true,
    },
    {
      id: "ppom",
      name: "뽐뿌",
      site: "ppomppu.co.kr",
      hostRe: /ppomppu\.co\.kr/i,
      pages: [
        (q) =>
          `https://www.ppomppu.co.kr/search_bbs.php?search_type=sub_memo&keyword=${qEnc(q)}`,
      ],
      top: true,
    },
    {
      id: "clien",
      name: "클리앙",
      site: "clien.net",
      hostRe: /clien\.net/i,
      pages: [
        (q) =>
          `https://www.clien.net/service/search?q=${qEnc(q)}&sort=recency&boardCd=&isBoard=false`,
      ],
      top: true,
    },
    {
      id: "pann",
      name: "네이트판",
      site: "pann.nate.com",
      hostRe: /pann\.nate\.com|nate\.com/i,
      pages: [(q) => `https://pann.nate.com/search/talk?q=${qEnc(q)}`],
      top: true,
    },
    {
      id: "ilbe",
      name: "일베",
      site: "ilbe.com",
      hostRe: /ilbe\.com|ncache\.ilbe\.com/i,
      pages: [(q) => `https://www.ilbe.com/search?keyword=${qEnc(q)}`],
      top: false,
    },
    {
      id: "instiz",
      name: "인스티즈",
      site: "instiz.net",
      hostRe: /instiz\.net/i,
      pages: [(q) => `https://www.instiz.net/iframe_search.htm?k=${qEnc(q)}`],
      top: false,
    },
    {
      id: "bobae",
      name: "보배드림",
      site: "bobaedream.co.kr",
      hostRe: /bobaedream\.co\.kr/i,
      pages: [
        (q) =>
          `https://www.bobaedream.co.kr/search?s=${qEnc(q)}&keyword=${qEnc(q)}`,
      ],
      top: false,
    },
    {
      id: "eto",
      name: "이토랜드",
      site: "etoland.co.kr",
      hostRe: /etoland\.co\.kr/i,
      pages: [(q) => `https://www.etoland.co.kr/bbs/search.php?keyword=${qEnc(q)}`],
      top: false,
    },
    {
      id: "humoruniv",
      name: "웃긴대학",
      site: "humoruniv.com",
      hostRe: /humoruniv\.com/i,
      pages: [
        (q) =>
          `https://web.humoruniv.com/main.html?search=${qEnc(q)}`,
      ],
      top: false,
    },
    {
      id: "slr",
      name: "SLR클럽",
      site: "slrclub.com",
      hostRe: /slrclub\.com/i,
      pages: [(q) => `https://www.slrclub.com/search.php?keyword=${qEnc(q)}`],
      top: false,
    },
    {
      id: "cook82",
      name: "82쿡",
      site: "82cook.com",
      hostRe: /82cook\.com/i,
      pages: [(q) => `https://www.82cook.com/search.php?q=${qEnc(q)}`],
      top: false,
    },
    {
      id: "damoang",
      name: "다모앙",
      site: "damoang.net",
      hostRe: /damoang\.net/i,
      pages: [(q) => `https://damoang.net/search?q=${qEnc(q)}`],
      top: false,
    },
    {
      id: "gasengi",
      name: "가생이닷컴",
      site: "gasengi.com",
      hostRe: /gasengi\.com/i,
      pages: [(q) => `https://www.gasengi.com/search.php?keyword=${qEnc(q)}`],
      top: false,
    },
    {
      id: "ou",
      name: "오늘의유머",
      site: "todayhumor.co.kr",
      hostRe: /todayhumor\.co\.kr/i,
      pages: [
        (q) =>
          `https://www.todayhumor.co.kr/board/list.php?table=humorbest&kind=search&keyfield=subject&keyword=${qEnc(q)}`,
      ],
      top: false,
    },
    {
      id: "orbi",
      name: "오르비",
      site: "orbi.kr",
      hostRe: /orbi\.kr/i,
      pages: [(q) => `https://orbi.kr/search?q=${qEnc(q)}`],
      top: false,
    },
    {
      id: "hygall",
      name: "해연갤",
      site: "hygall.com",
      hostRe: /hygall\.com/i,
      pages: [(q) => `https://hygall.com/search?keyword=${qEnc(q)}`],
      top: false,
    },
  ];

  const selectedKinds = new Set(KINDS.map((k) => k.id));
  const selectedCats = new Set();
  const selectedSrc = new Set(COMMUNITIES.filter((c) => c.top).map((c) => c.id));

  const kindsEl = document.getElementById("kinds");
  const catsEl = document.getElementById("cats");
  const sourcesEl = document.getElementById("sources");
  const titleEl = document.getElementById("title");
  const statusEl = document.getElementById("status");
  const galleryEl = document.getElementById("gallery");
  const postsEl = document.getElementById("posts");
  const searchBtn = document.getElementById("searchBtn");

  const srcButtons = new Map();

  KINDS.forEach((k) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip on";
    btn.textContent = k.ko;
    btn.addEventListener("click", () => {
      if (selectedKinds.has(k.id)) {
        if (selectedKinds.size === 1) return;
        selectedKinds.delete(k.id);
        btn.classList.remove("on");
      } else {
        selectedKinds.add(k.id);
        btn.classList.add("on");
      }
    });
    kindsEl.appendChild(btn);
  });

  CATEGORIES.forEach((c, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = c.ko;
    btn.addEventListener("click", () => {
      if (selectedCats.has(i)) {
        selectedCats.delete(i);
        btn.classList.remove("on");
      } else {
        selectedCats.add(i);
        btn.classList.add("on");
      }
    });
    catsEl.appendChild(btn);
  });

  function syncSrcButtons() {
    srcButtons.forEach((btn, id) => {
      btn.classList.toggle("on", selectedSrc.has(id));
    });
  }

  COMMUNITIES.forEach((c) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (selectedSrc.has(c.id) ? " on" : "");
    btn.textContent = c.name;
    btn.addEventListener("click", () => {
      if (selectedSrc.has(c.id)) {
        selectedSrc.delete(c.id);
        btn.classList.remove("on");
      } else {
        selectedSrc.add(c.id);
        btn.classList.add("on");
      }
    });
    srcButtons.set(c.id, btn);
    sourcesEl.appendChild(btn);
  });

  document.getElementById("srcAll").addEventListener("click", () => {
    COMMUNITIES.forEach((c) => selectedSrc.add(c.id));
    syncSrcButtons();
  });
  document.getElementById("srcTop").addEventListener("click", () => {
    selectedSrc.clear();
    COMMUNITIES.filter((c) => c.top).forEach((c) => selectedSrc.add(c.id));
    syncSrcButtons();
  });
  document.getElementById("srcNone").addEventListener("click", () => {
    selectedSrc.clear();
    syncSrcButtons();
  });

  function activeKinds() {
    return KINDS.filter((k) => selectedKinds.has(k.id));
  }

  function keywords() {
    const kinds = activeKinds().map((k) => k.q);
    const cats = [...selectedCats].map((i) => CATEGORIES[i].kr);
    const extra = titleEl.value.trim();
    const parts = [...kinds, ...cats];
    if (extra) parts.push(extra);
    return [...new Set(parts)].join(" ");
  }

  function isJpg(url) {
    if (!url) return false;
    try {
      const path = decodeURIComponent(url.split("?")[0]).toLowerCase();
      return path.endsWith(".jpg") || path.endsWith(".jpeg");
    } catch {
      const path = url.split("?")[0].toLowerCase();
      return path.endsWith(".jpg") || path.endsWith(".jpeg");
    }
  }

  function normalizeUrl(u) {
    if (!u) return null;
    let s = u.trim().replace(/&amp;/g, "&");
    if (s.startsWith("//")) s = "https:" + s;
    if (!/^https?:\/\//i.test(s)) return null;
    if (/bing\.com|microsoft\.com|googleusercontent|gstatic|doubleclick|googlesyndication/i.test(s)) {
      return null;
    }
    return s;
  }

  function extractJpgs(text) {
    const found = new Set();
    for (const m of text.matchAll(/mediaurl=(https?%3a%2f%2f[^&\s"'<>]+)/gi)) {
      try {
        const u = normalizeUrl(decodeURIComponent(m[1]));
        if (u && isJpg(u)) found.add(u);
      } catch (_) {}
    }
    for (const m of text.matchAll(
      /(?:murl|mediaurl|ou|imgurl|originalUrl)\s*[:=]\s*["']?(https?:\/\/[^"'&\s<>]+)/gi
    )) {
      const u = normalizeUrl(m[1]);
      if (u && isJpg(u)) found.add(u);
    }
    for (const m of text.matchAll(
      /https?:\/\/[^\s"'<>)\\]+?\.(?:jpg|jpeg)(?:\?[^\s"'<>)\\]*)?/gi
    )) {
      const u = normalizeUrl(m[0].replace(/[.,;)]+$/, ""));
      if (u && isJpg(u)) found.add(u);
    }
    for (const m of text.matchAll(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi)) {
      const u = normalizeUrl(m[1]);
      if (u && isJpg(u)) found.add(u);
    }
    return [...found];
  }

  function extractPosts(text, community) {
    const posts = [];
    const seen = new Set();
    const site = community.site.replace(".", "\\.");
    const re = new RegExp(
      `\\[([^\\]]{2,120})\\]\\((https?:\\/\\/(?:[\\w.-]*\\.)?${site}[^)\\s]*)\\)`,
      "gi"
    );
    for (const m of text.matchAll(re)) {
      const title = m[1].trim();
      const href = normalizeUrl(m[2]);
      if (!href || seen.has(href)) continue;
      if (/search|login|join|css|js\b/i.test(href)) continue;
      seen.add(href);
      posts.push({ title, href, name: community.name });
    }
    // html anchors
    const re2 = new RegExp(
      `<a[^>]+href=["'](https?:\\/\\/(?:[\\w.-]*\\.)?${site}[^"']+)["'][^>]*>([^<]{2,120})<\\/a>`,
      "gi"
    );
    for (const m of text.matchAll(re2)) {
      const href = normalizeUrl(m[1]);
      const title = m[2].replace(/\s+/g, " ").trim();
      if (!href || !title || seen.has(href)) continue;
      if (/search|login|join/i.test(href)) continue;
      seen.add(href);
      posts.push({ title, href, name: community.name });
    }
    return posts.slice(0, 40);
  }

  async function fetchText(url, asHtml) {
    const jina = `https://r.jina.ai/${url}`;
    const headers = {
      Accept: asHtml ? "text/html" : "text/plain",
      "X-Return-Format": asHtml ? "html" : "markdown",
    };
    const r = await fetch(jina, { headers });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.text();
  }

  async function fromCommunityPages(community, q, wantImages, wantPosts) {
    const images = [];
    const posts = [];
    for (const make of community.pages || []) {
      try {
        const html = await fetchText(make(q), true);
        if (wantImages) {
          for (const src of extractJpgs(html)) {
            if (community.hostRe && !community.hostRe.test(src)) continue;
            images.push(src);
          }
        }
        if (wantPosts) {
          posts.push(...extractPosts(html, community));
        }
        // markdown pass for posts
        if (wantPosts) {
          try {
            const md = await fetchText(make(q), false);
            posts.push(...extractPosts(md, community));
          } catch (_) {}
        }
      } catch (_) {}
    }
    return { images, posts };
  }

  async function fromBingSite(community, q) {
    const query = `site:${community.site} ${q}`;
    const out = [];
    for (const first of [1, 35]) {
      const bing =
        "http://www.bing.com/images/search?q=" +
        encodeURIComponent(query) +
        `&adlt=off&first=${first}`;
      try {
        const text = await fetchText(bing, false);
        out.push(...extractJpgs(text));
      } catch (_) {}
    }
    const cdn = out.filter((u) => community.hostRe.test(u));
    return cdn.length ? cdn : out;
  }

  function renderGallery(items) {
    galleryEl.innerHTML = "";
    items.forEach((it) => {
      const a = document.createElement("a");
      a.className = "item";
      a.href = it.src;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      const img = document.createElement("img");
      img.src = it.src;
      img.alt = it.name;
      img.loading = "lazy";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      img.onerror = () => a.remove();

      const cap = document.createElement("div");
      cap.className = "cap";
      cap.textContent = `${it.name} · ${it.kind || "야짤"}`;

      a.appendChild(img);
      a.appendChild(cap);
      galleryEl.appendChild(a);
    });
  }

  function renderPosts(items) {
    postsEl.innerHTML = "";
    items.forEach((it) => {
      const a = document.createElement("a");
      a.className = "post";
      a.href = it.href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = `<strong>${escapeHtml(it.title)}</strong><span class="meta">${escapeHtml(it.name)} · ${escapeHtml(it.kind || "야사")}</span>`;
      postsEl.appendChild(a);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = "status" + (kind ? ` ${kind}` : "");
  }

  async function runSearch() {
    const communities = COMMUNITIES.filter((c) => selectedSrc.has(c.id));
    if (!communities.length) {
      setStatus("커뮤니티를 하나 이상 골라줘.", "error");
      return;
    }
    const kinds = activeKinds();
    if (!kinds.length) {
      setStatus("종류(야사/야짤/은꼴사)를 하나 이상 골라줘.", "error");
      return;
    }

    const wantImages = kinds.some((k) => k.wantImages);
    const wantPosts = kinds.some((k) => k.wantPosts);
    const q = keywords();
    const kindLabel = kinds.map((k) => k.ko).join("/");

    searchBtn.disabled = true;
    galleryEl.innerHTML = "";
    postsEl.innerHTML = "";

    const seenImg = new Set();
    const seenPost = new Set();
    const images = [];
    const posts = [];

    for (const c of communities) {
      setStatus(
        `${c.name}에서 ${kindLabel} 수집 중... (글 ${posts.length} / 사진 ${images.length})`,
        ""
      );

      try {
        const got = await fromCommunityPages(c, q, wantImages, wantPosts);
        if (wantImages) {
          for (const src of got.images) {
            const key = src.split("?")[0];
            if (seenImg.has(key) || !isJpg(src)) continue;
            seenImg.add(key);
            images.push({ src, name: c.name, kind: kindLabel });
          }
        }
        if (wantPosts) {
          for (const p of got.posts) {
            if (seenPost.has(p.href)) continue;
            seenPost.add(p.href);
            posts.push({ ...p, kind: kindLabel });
          }
        }
      } catch (_) {}

      if (wantImages) {
        try {
          const bing = await fromBingSite(c, q);
          for (const src of bing) {
            const key = src.split("?")[0];
            if (seenImg.has(key) || !isJpg(src)) continue;
            seenImg.add(key);
            images.push({ src, name: c.name, kind: kindLabel });
          }
        } catch (_) {}
      }

      renderPosts(posts);
      renderGallery(images);
    }

    searchBtn.disabled = false;
    if (!images.length && !posts.length) {
      setStatus("결과가 없어. 종류/카테고리/커뮤니티를 바꿔봐.", "error");
      return;
    }
    setStatus(
      `${kindLabel} · 글 ${posts.length}개 · JPG ${images.length}장`,
      "ok"
    );
  }

  searchBtn.addEventListener("click", () => {
    runSearch().catch((e) => {
      searchBtn.disabled = false;
      setStatus("오류: " + (e.message || e), "error");
    });
  });
})();
