(() => {
  const PERIODS = [
    { id: "day", ko: "일간", arca: "24h", bingAge: "lt1440", label: "일간" },
    { id: "week", ko: "주간", arca: "7d", bingAge: "lt10080", label: "주간" },
    { id: "month", ko: "월간", arca: "30d", bingAge: "lt43200", label: "월간" },
  ];

  // 종류(야사/야짤/은꼴사)도 카테고리에 포함
  const CATEGORIES = [
    { ko: "야사", kr: "야사", boardKey: "yasa" },
    { ko: "야짤", kr: "야짤", boardKey: "yazal" },
    { ko: "은꼴사", kr: "은꼴사", boardKey: "eungol" },
    { ko: "밀프 / 아줌마", kr: "아줌마", boardKey: "yazal" },
    { ko: "아마추어", kr: "아마추어", boardKey: "yazal" },
    { ko: "오피스 / 비서", kr: "비서", boardKey: "yazal" },
    { ko: "선생님", kr: "여선생님", boardKey: "yazal" },
    { ko: "간호사", kr: "간호사", boardKey: "yazal" },
    { ko: "사우나 / 마사지", kr: "마사지", boardKey: "yazal" },
    { ko: "코스프레", kr: "코스프레", boardKey: "yazal" },
    { ko: "교복 / 코스튬", kr: "코스튬", boardKey: "eungol" },
    { ko: "야외 / 노출", kr: "야외노출", boardKey: "eungol" },
    { ko: "헬스 / 피트니스", kr: "헬스녀", boardKey: "eungol" },
    { ko: "비키니 / 수영장", kr: "비키니", boardKey: "eungol" },
    { ko: "스타킹 / 레깅스", kr: "스타킹", boardKey: "eungol" },
    { ko: "큰 가슴", kr: "큰가슴", boardKey: "yazal" },
    { ko: "엉덩이", kr: "엉덩이", boardKey: "yazal" },
    { ko: "아시아", kr: "아시아", boardKey: "yazal" },
    { ko: "일본", kr: "일본", boardKey: "yazal" },
    { ko: "한국", kr: "한국", boardKey: "yazal" },
    { ko: "금발 / 서양", kr: "금발", boardKey: "yazal" },
    { ko: "커플 / 셀카", kr: "커플셀카", boardKey: "eungol" },
    { ko: "움짤", kr: "움짤", boardKey: "yazal" },
    { ko: "은꼴 / 아슬아슬", kr: "은꼴", boardKey: "eungol" },
    { ko: "하드 / 노골", kr: "야짤", boardKey: "yazal" },
  ];

  /**
   * 커뮤니티별 야사/야짤/은꼴사 보드 + 기간별 인기(조회/추천) URL
   * period: day|week|month
   */
  const COMMUNITIES = [
    {
      id: "arca",
      name: "아카라이브",
      site: "arca.live",
      hostRe: /arca\.live|ac\.namu\.la|namu\.la/i,
      top: true,
      boards: {
        yazal: (p) => [
          `https://arca.live/b/yazzal?mode=best&sort=rating&range=${p.arca}`,
          `https://arca.live/b/shade?mode=best&sort=rating&range=${p.arca}`,
        ],
        eungol: (p) => [
          `https://arca.live/b/yazzal?mode=best&sort=rating&range=${p.arca}&category=%EC%9D%80%EA%BC%B4`,
          `https://arca.live/b/aiartreal?mode=best&sort=rating&range=${p.arca}`,
        ],
        yasa: (p) => [
          `https://arca.live/b/yazzal?mode=best&sort=rating&range=${p.arca}&keyword=%EC%95%BC%EC%82%AC`,
        ],
      },
    },
    {
      id: "dc",
      name: "디시인사이드",
      site: "dcinside.com",
      hostRe: /dcinside\.com|dcimg\d*\.|nstatic/i,
      top: true,
      boards: {
        yazal: () => [
          "https://gall.dcinside.com/board/lists/?id=parkbug&exception_mode=recommend",
          "https://search.dcinside.com/img/q/%EC%95%BC%EC%A7%A4",
        ],
        eungol: () => [
          "https://search.dcinside.com/img/q/%EC%9D%80%EA%BC%B4%EC%82%AC",
          "https://search.dcinside.com/img/q/%EC%9D%80%EA%BC%B4",
        ],
        yasa: () => [
          "https://search.dcinside.com/post/q/%EC%95%BC%EC%82%AC",
          "https://search.dcinside.com/img/q/%EC%95%BC%EC%82%AC",
        ],
      },
    },
    {
      id: "ilbe",
      name: "일베",
      site: "ilbe.com",
      hostRe: /ilbe\.com|ncache\.ilbe\.com/i,
      top: true,
      boards: {
        yazal: () => [
          "https://www.ilbe.com/list/celeb?sort=hit",
          "https://www.ilbe.com/search?keyword=%EC%95%BC%EC%A7%A4",
        ],
        eungol: () => [
          "https://www.ilbe.com/search?keyword=%EC%9D%80%EA%BC%B4%EC%82%AC",
          "https://www.ilbe.com/search?keyword=%EC%9D%80%EA%BC%B4",
        ],
        yasa: () => ["https://www.ilbe.com/search?keyword=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "hygall",
      name: "해연갤",
      site: "hygall.com",
      hostRe: /hygall\.com/i,
      top: true,
      boards: {
        yazal: () => ["https://hygall.com/?sort=hit"],
        eungol: () => ["https://hygall.com/search?keyword=%EC%9D%80%EA%BC%B4"],
        yasa: () => ["https://hygall.com/search?keyword=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "fmk",
      name: "에펨코리아",
      site: "fmkorea.com",
      hostRe: /fmkorea\.com/i,
      top: true,
      boards: {
        yazal: () => [
          "https://www.fmkorea.com/index.php?mid=best&listStyle=webzine",
          "https://www.fmkorea.com/search.php?search_keyword=%EC%95%BC%EC%A7%A4&search_target=title_content",
        ],
        eungol: () => [
          "https://www.fmkorea.com/search.php?search_keyword=%EC%9D%80%EA%BC%B4%EC%82%AC&search_target=title_content",
        ],
        yasa: () => [
          "https://www.fmkorea.com/search.php?search_keyword=%EC%95%BC%EC%82%AC&search_target=title_content",
        ],
      },
    },
    {
      id: "theqoo",
      name: "더쿠",
      site: "theqoo.net",
      hostRe: /theqoo\.net/i,
      top: true,
      boards: {
        yazal: () => ["https://theqoo.net/search/post?keyword=%EC%95%BC%EC%A7%A4"],
        eungol: () => ["https://theqoo.net/search/post?keyword=%EC%9D%80%EA%BC%B4%EC%82%AC"],
        yasa: () => ["https://theqoo.net/search/post?keyword=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "ruli",
      name: "루리웹",
      site: "ruliweb.com",
      hostRe: /ruliweb\.com/i,
      top: true,
      boards: {
        yazal: () => [
          "https://bbs.ruliweb.com/best/all",
          "https://bbs.ruliweb.com/search?search_type=subject_content&search=%EC%95%BC%EC%A7%A4",
        ],
        eungol: () => [
          "https://bbs.ruliweb.com/search?search_type=subject_content&search=%EC%9D%80%EA%BC%B4",
        ],
        yasa: () => [
          "https://bbs.ruliweb.com/search?search_type=subject_content&search=%EC%95%BC%EC%82%AC",
        ],
      },
    },
    {
      id: "inven",
      name: "인벤",
      site: "inven.co.kr",
      hostRe: /inven\.co\.kr/i,
      top: true,
      boards: {
        yazal: () => ["https://www.inven.co.kr/board/webzine/2097?my=chu"],
        eungol: () => ["https://www.inven.co.kr/search/webzine/article/%EC%9D%80%EA%BC%B4"],
        yasa: () => ["https://www.inven.co.kr/search/webzine/article/%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "mlbpark",
      name: "엠팍",
      site: "mlbpark.donga.com",
      hostRe: /mlbpark\.donga\.com|donga\.com/i,
      top: true,
      boards: {
        yazal: () => ["https://mlbpark.donga.com/mp/best.php?b=bullpen"],
        eungol: () => [
          "https://mlbpark.donga.com/mp/b.php?search_select=sct&search=%EC%9D%80%EA%BC%B4&b=bullpen",
        ],
        yasa: () => [
          "https://mlbpark.donga.com/mp/b.php?search_select=sct&search=%EC%95%BC%EC%82%AC&b=bullpen",
        ],
      },
    },
    {
      id: "ppom",
      name: "뽐뿌",
      site: "ppomppu.co.kr",
      hostRe: /ppomppu\.co\.kr/i,
      top: true,
      boards: {
        yazal: () => ["https://www.ppomppu.co.kr/hot.php?category=2"],
        eungol: () => [
          "https://www.ppomppu.co.kr/search_bbs.php?search_type=sub_memo&keyword=%EC%9D%80%EA%BC%B4",
        ],
        yasa: () => [
          "https://www.ppomppu.co.kr/search_bbs.php?search_type=sub_memo&keyword=%EC%95%BC%EC%82%AC",
        ],
      },
    },
    {
      id: "clien",
      name: "클리앙",
      site: "clien.net",
      hostRe: /clien\.net/i,
      top: false,
      boards: {
        yazal: () => ["https://www.clien.net/service/board/park?od=T31"],
        eungol: () => ["https://www.clien.net/service/search?q=%EC%9D%80%EA%BC%B4"],
        yasa: () => ["https://www.clien.net/service/search?q=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "pann",
      name: "네이트판",
      site: "pann.nate.com",
      hostRe: /pann\.nate\.com|nate\.net|nate\.com/i,
      top: false,
      boards: {
        yazal: () => ["https://pann.nate.com/talk/today"],
        eungol: () => ["https://pann.nate.com/search/talk?q=%EC%9D%80%EA%BC%B4%EC%82%AC"],
        yasa: () => ["https://pann.nate.com/search/talk?q=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "instiz",
      name: "인스티즈",
      site: "instiz.net",
      hostRe: /instiz\.net/i,
      top: false,
      boards: {
        yazal: () => ["https://www.instiz.net/name"],
        eungol: () => ["https://www.instiz.net/iframe_search.htm?k=%EC%9D%80%EA%BC%B4"],
        yasa: () => ["https://www.instiz.net/iframe_search.htm?k=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "bobae",
      name: "보배드림",
      site: "bobaedream.co.kr",
      hostRe: /bobaedream\.co\.kr/i,
      top: false,
      boards: {
        yazal: () => ["https://www.bobaedream.co.kr/list?code=best"],
        eungol: () => ["https://www.bobaedream.co.kr/search?keyword=%EC%9D%80%EA%BC%B4"],
        yasa: () => ["https://www.bobaedream.co.kr/search?keyword=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "eto",
      name: "이토랜드",
      site: "etoland.co.kr",
      hostRe: /etoland\.co\.kr/i,
      top: false,
      boards: {
        yazal: () => ["https://www.etoland.co.kr/bbs/board.php?bo_table=etohumor"],
        eungol: () => ["https://www.etoland.co.kr/bbs/search.php?keyword=%EC%9D%80%EA%BC%B4"],
        yasa: () => ["https://www.etoland.co.kr/bbs/search.php?keyword=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "humoruniv",
      name: "웃긴대학",
      site: "humoruniv.com",
      hostRe: /humoruniv\.com/i,
      top: false,
      boards: {
        yazal: () => ["https://web.humoruniv.com/main.html"],
        eungol: () => ["https://web.humoruniv.com/main.html?search=%EC%9D%80%EA%BC%B4"],
        yasa: () => ["https://web.humoruniv.com/main.html?search=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "slr",
      name: "SLR클럽",
      site: "slrclub.com",
      hostRe: /slrclub\.com/i,
      top: false,
      boards: {
        yazal: () => ["https://www.slrclub.com/v2/index.php"],
        eungol: () => ["https://www.slrclub.com/search.php?keyword=%EC%9D%80%EA%BC%B4"],
        yasa: () => ["https://www.slrclub.com/search.php?keyword=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "cook82",
      name: "82쿡",
      site: "82cook.com",
      hostRe: /82cook\.com/i,
      top: false,
      boards: {
        yazal: () => ["https://www.82cook.com/entiz/enti.htm"],
        eungol: () => ["https://www.82cook.com/search.php?q=%EC%9D%80%EA%BC%B4"],
        yasa: () => ["https://www.82cook.com/search.php?q=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "damoang",
      name: "다모앙",
      site: "damoang.net",
      hostRe: /damoang\.net/i,
      top: false,
      boards: {
        yazal: () => ["https://damoang.net/"],
        eungol: () => ["https://damoang.net/search?q=%EC%9D%80%EA%BC%B4"],
        yasa: () => ["https://damoang.net/search?q=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "gasengi",
      name: "가생이닷컴",
      site: "gasengi.com",
      hostRe: /gasengi\.com/i,
      top: false,
      boards: {
        yazal: () => ["https://www.gasengi.com/"],
        eungol: () => ["https://www.gasengi.com/search.php?keyword=%EC%9D%80%EA%BC%B4"],
        yasa: () => ["https://www.gasengi.com/search.php?keyword=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "ou",
      name: "오늘의유머",
      site: "todayhumor.co.kr",
      hostRe: /todayhumor\.co\.kr/i,
      top: false,
      boards: {
        yazal: () => ["https://www.todayhumor.co.kr/board/list.php?table=bestofbest"],
        eungol: () => [
          "https://www.todayhumor.co.kr/board/list.php?table=humorbest&kind=search&keyfield=subject&keyword=%EC%9D%80%EA%BC%B4",
        ],
        yasa: () => [
          "https://www.todayhumor.co.kr/board/list.php?table=humorbest&kind=search&keyfield=subject&keyword=%EC%95%BC%EC%82%AC",
        ],
      },
    },
    {
      id: "orbi",
      name: "오르비",
      site: "orbi.kr",
      hostRe: /orbi\.kr/i,
      top: false,
      boards: {
        yazal: () => ["https://orbi.kr/"],
        eungol: () => ["https://orbi.kr/search?q=%EC%9D%80%EA%BC%B4"],
        yasa: () => ["https://orbi.kr/search?q=%EC%95%BC%EC%82%AC"],
      },
    },
  ];

  let selectedPeriod = "day";
  const selectedCats = new Set([0, 1, 2]); // 야사, 야짤, 은꼴사 기본
  const selectedSrc = new Set(COMMUNITIES.filter((c) => c.top).map((c) => c.id));

  const periodsEl = document.getElementById("periods");
  const catsEl = document.getElementById("cats");
  const sourcesEl = document.getElementById("sources");
  const statusEl = document.getElementById("status");
  const galleryEl = document.getElementById("gallery");
  const searchBtn = document.getElementById("searchBtn");
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

  function boardKeys() {
    const keys = new Set();
    for (const i of selectedCats) keys.add(CATEGORIES[i].boardKey || "yazal");
    return [...keys];
  }

  function catKeywords() {
    return [...selectedCats].map((i) => CATEGORIES[i].kr);
  }

  function isImageUrl(url) {
    if (!url) return false;
    const path = url.split("?")[0].toLowerCase();
    return /\.(jpe?g|png|webp|gif)$/i.test(path);
  }

  function isJunk(url) {
    return /sprite|icon|logo|emoji|avatar|profile|ads?|banner|button|loading|blank|1x1|pixel|favicon|emoticon|stamp/i.test(
      url
    );
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
    if (/bing\.com|microsoft\.com|doubleclick|googlesyndication|google-analytics|gstatic\.com\/.*icon/i.test(s)) {
      return null;
    }
    return s;
  }

  function extractImages(text, base) {
    const found = new Set();

    const push = (raw) => {
      const u = normalizeUrl(raw, base);
      if (!u || !isImageUrl(u) || isJunk(u)) return;
      found.add(u.split("#")[0]);
    };

    for (const m of text.matchAll(/mediaurl=(https?%3a%2f%2f[^&\s"'<>]+)/gi)) {
      try {
        push(decodeURIComponent(m[1]));
      } catch (_) {}
    }
    for (const m of text.matchAll(
      /(?:src|data-src|data-original|data-url|data-lazy|data-image)\s*=\s*["']([^"']+)["']/gi
    )) {
      push(m[1]);
    }
    for (const m of text.matchAll(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi)) push(m[1]);
    for (const m of text.matchAll(
      /https?:\/\/[^\s"'<>)\\]+?\.(?:jpe?g|png|webp|gif)(?:\?[^\s"'<>)\\]*)?/gi
    )) {
      push(m[0].replace(/[.,;)]+$/, ""));
    }
    return [...found];
  }

  function extractPostLinks(text, community) {
    const links = [];
    const seen = new Set();
    const site = community.site.replace(/\./g, "\\.");
    const patterns = [
      new RegExp(`https?:\\/\\/(?:[\\w.-]*\\.)?${site}[^\\s"'<>)]+`, "gi"),
      /href=["']([^"']+)["']/gi,
    ];

    for (const re of patterns) {
      for (const m of text.matchAll(re)) {
        let href = m[1] || m[0];
        href = normalizeUrl(href, `https://${community.site}/`);
        if (!href || seen.has(href)) continue;
        if (!community.hostRe.test(href) && !href.includes(community.site)) continue;
        if (/search|login|join|css|javascript|\.js\b|\.css\b|\/members?\b|\/help\b/i.test(href)) {
          continue;
        }
        // 게시글처럼 보이는 것만
        if (!/\/(b|board|list|article|view|talk|bbs|post|a\/|\/\d{5,})/i.test(href) && !/\/\d{6,}/.test(href)) {
          // arca /b/xxx/123456
          if (!/arca\.live\/b\/[^/]+\/\d+/i.test(href)) continue;
        }
        seen.add(href);
        links.push(href);
      }
    }
    return links.slice(0, 15);
  }

  async function fetchText(url, asHtml = true) {
    const jina = "https://r.jina.ai/" + url;
    const r = await fetch(jina, {
      headers: {
        Accept: asHtml ? "text/html" : "text/plain",
        "X-Return-Format": asHtml ? "html" : "markdown",
        "X-Timeout": "25",
      },
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.text();
  }

  async function collectFromBoard(community, boardUrl, images, seen) {
    let html = "";
    try {
      html = await fetchText(boardUrl, true);
    } catch {
      return;
    }

    // 1) 목록에 있는 썸네일/이미지 먼저
    for (const src of extractImages(html, boardUrl)) {
      if (seen.has(src)) continue;
      seen.add(src);
      images.push(src);
    }

    // 2) 인기글 들어가서 본문 사진 뽑기
    const posts = extractPostLinks(html, community);
    for (const postUrl of posts.slice(0, 8)) {
      try {
        const postHtml = await fetchText(postUrl, true);
        for (const src of extractImages(postHtml, postUrl)) {
          if (seen.has(src)) continue;
          // 커뮤니티 CDN 우선하되, 본문 이미지는 폭넓게 허용
          if (isJunk(src)) continue;
          seen.add(src);
          images.push(src);
        }
        renderGallery(images);
      } catch (_) {}
    }
  }

  async function collectBingBackup(community, period, keywords, images, seen) {
    const q = `site:${community.site} ${keywords.join(" ")}`;
    const bing =
      "http://www.bing.com/images/search?q=" +
      encodeURIComponent(q) +
      `&adlt=off&qft=+filterui:age-${period.bingAge}`;
    try {
      const text = await fetchText(bing, false);
      for (const src of extractImages(text, bing)) {
        if (seen.has(src)) continue;
        seen.add(src);
        images.push(src);
      }
    } catch (_) {}
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
    const keys = boardKeys();
    const keywords = catKeywords();

    searchBtn.disabled = true;
    galleryEl.innerHTML = "";
    const images = [];
    const seen = new Set();

    for (const c of communities) {
      setStatus(`${c.name} ${period.ko} 인기 사진 수집 중... (${images.length}장)`, "");

      const boardUrls = [];
      for (const key of keys) {
        const maker = c.boards?.[key];
        if (maker) boardUrls.push(...maker(period));
      }

      for (const url of [...new Set(boardUrls)].slice(0, 3)) {
        await collectFromBoard(c, url, images, seen);
        renderGallery(images);
      }

      // 보드에서 거의 못 뽑으면 백업
      if (images.length < 6) {
        await collectBingBackup(c, period, keywords, images, seen);
        renderGallery(images);
      }
    }

    searchBtn.disabled = false;
    if (!images.length) {
      setStatus("사진을 못 모았어. 기간/카테고리/커뮤니티를 바꿔봐.", "error");
      return;
    }
    setStatus(`${period.ko} 인기 사진 ${images.length}장`, "ok");
  }

  searchBtn.addEventListener("click", () => {
    runSearch().catch((e) => {
      searchBtn.disabled = false;
      setStatus("오류: " + (e.message || e), "error");
    });
  });
})();
