(() => {
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

  // 한국 커뮤니티만
  const COMMUNITIES = [
    {
      id: "dc",
      name: "디시인사이드",
      site: "dcinside.com",
      hostRe: /dcinside\.com|dcimg\d*\.dcinside\.com|nstatic/i,
      pages: [
        (q) => `https://search.dcinside.com/img/q/${encodeURIComponent(q)}`,
        (q) => `https://search.dcinside.com/post/q/${encodeURIComponent(q)}`,
      ],
      defaultOn: true,
    },
    {
      id: "ou",
      name: "오늘의유머",
      site: "todayhumor.co.kr",
      hostRe: /todayhumor\.co\.kr/i,
      pages: [
        (q) =>
          `https://www.todayhumor.co.kr/board/list.php?table=humorbest&kind=search&keyfield=subject&keyword=${encodeURIComponent(q)}`,
      ],
      defaultOn: true,
    },
    {
      id: "ilbe",
      name: "일베",
      site: "ilbe.com",
      hostRe: /ilbe\.com|ncache\.ilbe\.com/i,
      pages: [
        (q) => `https://www.ilbe.com/search?keyword=${encodeURIComponent(q)}`,
        (q) =>
          `https://www.ilbe.com/?act=search&docType=doc&searchType=title_content&keyword=${encodeURIComponent(q)}`,
      ],
      defaultOn: true,
    },
    {
      id: "fmk",
      name: "에펨코리아",
      site: "fmkorea.com",
      hostRe: /fmkorea\.com/i,
      pages: [
        (q) =>
          `https://www.fmkorea.com/search.php?mid=humor&search_keyword=${encodeURIComponent(q)}&search_target=title_content`,
      ],
      defaultOn: true,
    },
    {
      id: "theqoo",
      name: "더쿠",
      site: "theqoo.net",
      hostRe: /theqoo\.net/i,
      pages: [
        (q) => `https://theqoo.net/search/post?keyword=${encodeURIComponent(q)}`,
      ],
      defaultOn: false,
    },
    {
      id: "ruli",
      name: "루리웹",
      site: "ruliweb.com",
      hostRe: /ruliweb\.com/i,
      pages: [
        (q) =>
          `https://bbs.ruliweb.com/search?search_type=subject&search=${encodeURIComponent(q)}`,
      ],
      defaultOn: false,
    },
  ];

  const selectedCats = new Set();
  const selectedSrc = new Set(
    COMMUNITIES.filter((c) => c.defaultOn).map((c) => c.id)
  );

  const catsEl = document.getElementById("cats");
  const sourcesEl = document.getElementById("sources");
  const titleEl = document.getElementById("title");
  const statusEl = document.getElementById("status");
  const galleryEl = document.getElementById("gallery");
  const searchBtn = document.getElementById("searchBtn");

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
    sourcesEl.appendChild(btn);
  });

  function keywords() {
    const parts = [...selectedCats].map((i) => CATEGORIES[i].kr);
    const extra = titleEl.value.trim();
    if (extra) parts.push(extra);
    if (!parts.length) parts.push("야짤");
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
    if (/bing\.com|microsoft\.com|googleusercontent|gstatic|doubleclick/i.test(s)) {
      return null;
    }
    return s;
  }

  function extractJpgs(text) {
    const found = new Set();

    // Bing mediaurl=
    for (const m of text.matchAll(/mediaurl=(https?%3a%2f%2f[^&\s"'<>]+)/gi)) {
      try {
        const u = normalizeUrl(decodeURIComponent(m[1]));
        if (u && isJpg(u)) found.add(u);
      } catch (_) {}
    }

    // murl / ou style
    for (const m of text.matchAll(
      /(?:murl|mediaurl|ou|imgurl|originalUrl)\s*[:=]\s*["']?(https?:\/\/[^"'&\s<>]+)/gi
    )) {
      const u = normalizeUrl(m[1]);
      if (u && isJpg(u)) found.add(u);
    }

    // plain jpg links
    for (const m of text.matchAll(
      /https?:\/\/[^\s"'<>)\\]+?\.(?:jpg|jpeg)(?:\?[^\s"'<>)\\]*)?/gi
    )) {
      const u = normalizeUrl(m[0].replace(/[.,;)]+$/, ""));
      if (u && isJpg(u)) found.add(u);
    }

    // markdown images ![alt](url)
    for (const m of text.matchAll(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi)) {
      const u = normalizeUrl(m[1]);
      if (u && isJpg(u)) found.add(u);
    }

    return [...found];
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

  async function fromCommunityPages(community, q) {
    const out = [];
    for (const make of community.pages || []) {
      try {
        const html = await fetchText(make(q), true);
        for (const src of extractJpgs(html)) {
          if (community.hostRe && !community.hostRe.test(src)) continue;
          out.push(src);
        }
      } catch (_) {}
    }
    return out;
  }

  async function fromBingSite(community, q) {
    const query = `site:${community.site} ${q} 야짤`;
    const out = [];
    for (const first of [1, 35]) {
      const bing =
        "http://www.bing.com/images/search?q=" +
        encodeURIComponent(query) +
        `&adlt=off&first=${first}`;
      try {
        const text = await fetchText(bing, false);
        const urls = extractJpgs(text);
        for (const src of urls) {
          // 커뮤니티 CDN이면 우선, 아니면 site 검색 결과도 일단 포함
          out.push(src);
        }
      } catch (_) {}
    }
    // CDN 매칭 있으면 그것만, 없으면 전체
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
      cap.textContent = it.name;

      a.appendChild(img);
      a.appendChild(cap);
      galleryEl.appendChild(a);
    });
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

    const q = keywords();
    searchBtn.disabled = true;
    galleryEl.innerHTML = "";

    const seen = new Set();
    const all = [];

    for (const c of communities) {
      setStatus(`${c.name} JPG 수집 중... (현재 ${all.length}장)`, "");

      let urls = [];
      try {
        const direct = await fromCommunityPages(c, q);
        urls.push(...direct);
      } catch (_) {}

      try {
        const bing = await fromBingSite(c, q);
        urls.push(...bing);
      } catch (_) {}

      for (const src of urls) {
        const key = src.split("?")[0];
        if (seen.has(key)) continue;
        if (!isJpg(src)) continue;
        seen.add(key);
        all.push({ src, name: c.name });
      }
      renderGallery(all);
    }

    searchBtn.disabled = false;
    if (!all.length) {
      setStatus(
        "JPG를 못 모았어. 카테고리를 바꾸거나 커뮤니티를 더 골라봐.",
        "error"
      );
      return;
    }
    setStatus(`JPG ${all.length}장 로드됨`, "ok");
  }

  searchBtn.addEventListener("click", () => {
    runSearch().catch((e) => {
      searchBtn.disabled = false;
      setStatus("오류: " + (e.message || e), "error");
    });
  });
})();
