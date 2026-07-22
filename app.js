(() => {
  const PERIODS = [
    { id: "day", ko: "일간", arca: "24h", bingAge: "lt1440" },
    { id: "week", ko: "주간", arca: "7d", bingAge: "lt10080" },
    { id: "month", ko: "월간", arca: "30d", bingAge: "lt43200" },
  ];

  // 기본 선택: 야짤 / 은꼴사 / GIF (애니 아님)
  const CATEGORIES = [
    { ko: "야짤", kr: "야짤 실사", boardKey: "yazal", def: true },
    { ko: "은꼴사", kr: "은꼴사 실사", boardKey: "eungol", def: true },
    { ko: "GIF / 움짤", kr: "야짤 gif", boardKey: "gif", def: true },
    { ko: "야사", kr: "야사", boardKey: "yasa", def: false },
    { ko: "밀프 / 아줌마", kr: "아줌마 실사", boardKey: "yazal" },
    { ko: "아마추어", kr: "아마추어 실사", boardKey: "yazal" },
    { ko: "오피스 / 비서", kr: "비서 실사", boardKey: "yazal" },
    { ko: "사우나 / 마사지", kr: "마사지 실사", boardKey: "yazal" },
    { ko: "야외 / 노출", kr: "야외노출 실사", boardKey: "eungol" },
    { ko: "헬스 / 피트니스", kr: "헬스녀 실사", boardKey: "eungol" },
    { ko: "비키니 / 수영장", kr: "비키니 실사", boardKey: "eungol" },
    { ko: "스타킹 / 레깅스", kr: "스타킹 실사", boardKey: "eungol" },
    { ko: "큰 가슴", kr: "큰가슴 실사", boardKey: "yazal" },
    { ko: "엉덩이", kr: "엉덩이 실사", boardKey: "yazal" },
    { ko: "한국", kr: "한국 실사 야짤", boardKey: "yazal" },
    { ko: "일본 AV", kr: "일본 실사", boardKey: "yazal" },
    { ko: "금발 / 서양", kr: "금발 실사", boardKey: "yazal" },
    { ko: "커플 / 셀카", kr: "커플 셀카 실사", boardKey: "eungol" },
    { ko: "은꼴 / 아슬아슬", kr: "은꼴 실사", boardKey: "eungol" },
    { ko: "하드 / 노골", kr: "야짤 실사", boardKey: "yazal" },
  ];

  // 애니/AI그림 호스트·경로 차단
  const ANIME_RE =
    /pixiv|pximg|danbooru|donmai|gelbooru|sankaku|rule34|booru|zerochan|safebooru|anime-pictures|myanimelist|nhentime|nhentai|hitomi\.la|e-hentai|exhentai|wixmp|deviantart|waifu|hentai|anime|manga|kawaii|fanart|aiart|novelai|stable.?diff|civitai|gimmemore|chan\.sankaku/i;

  // 실사 짤이 잘 나오는 CDN/커뮤니티 저장소
  const PHOTO_CDN_RE =
    /ncache\.ilbe\.com|ilbe\.com\/files|dcimg\d*\.|nstatic|image\.dcinside|hygall\.com|img\.fmkorea|fmkorea\.com\/files|pstatic\.net|nate\.com|bobaedream|etoland|todayhumor|ppomppu|gasengi|82cook|slrclub|humoruniv|arca\.live|ac\.namu\.la|namu\.la|imgur\.com|i\.imgur|media\.tenor|media\.giphy|gifbin|redgifs|gfycat|ddn\.img|postimg|imgbb|ibb\.co/i;

  const COMMUNITIES = [
    {
      id: "ilbe",
      name: "일베",
      site: "ilbe.com",
      hostRe: /ilbe\.com|ncache\.ilbe\.com/i,
      photoStrong: true,
      top: true,
      boards: {
        yazal: () => [
          "https://www.ilbe.com/search?keyword=%EC%95%BC%EC%A7%A4",
          "https://www.ilbe.com/search?keyword=%EC%8B%A4%EC%82%AC+%EC%95%BC%EC%A7%A4",
        ],
        eungol: () => [
          "https://www.ilbe.com/search?keyword=%EC%9D%80%EA%BC%B4%EC%82%AC",
          "https://www.ilbe.com/search?keyword=%EC%9D%80%EA%BC%B4+%EC%8B%A4%EC%82%AC",
        ],
        gif: () => [
          "https://www.ilbe.com/search?keyword=%EC%95%BC%EC%A7%A4+gif",
          "https://www.ilbe.com/search?keyword=%EC%9B%80%EC%A7%A4",
        ],
        yasa: () => ["https://www.ilbe.com/search?keyword=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "hygall",
      name: "해연갤",
      site: "hygall.com",
      hostRe: /hygall\.com/i,
      photoStrong: true,
      top: true,
      boards: {
        yazal: () => [
          "https://hygall.com/?sort=hit",
          "https://hygall.com/search?keyword=%EC%95%BC%EC%A7%A4",
        ],
        eungol: () => [
          "https://hygall.com/search?keyword=%EC%9D%80%EA%BC%B4%EC%82%AC",
          "https://hygall.com/search?keyword=%EC%9D%80%EA%BC%B4",
        ],
        gif: () => ["https://hygall.com/search?keyword=gif"],
        yasa: () => ["https://hygall.com/search?keyword=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "dc",
      name: "디시인사이드",
      site: "dcinside.com",
      hostRe: /dcinside\.com|dcimg\d*\.|nstatic/i,
      photoStrong: true,
      top: true,
      boards: {
        yazal: () => [
          "https://search.dcinside.com/img/q/%EC%95%BC%EC%A7%A4%20%EC%8B%A4%EC%82%AC",
          "https://search.dcinside.com/img/q/%EC%95%BC%EC%A7%A4",
        ],
        eungol: () => [
          "https://search.dcinside.com/img/q/%EC%9D%80%EA%BC%B4%EC%82%AC",
          "https://search.dcinside.com/img/q/%EC%9D%80%EA%BC%B4%20%EC%8B%A4%EC%82%AC",
        ],
        gif: () => [
          "https://search.dcinside.com/img/q/%EC%95%BC%EC%A7%A4%20gif",
          "https://search.dcinside.com/img/q/%EC%9B%80%EC%A7%A4",
        ],
        yasa: () => ["https://search.dcinside.com/img/q/%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "arca",
      name: "아카라이브",
      site: "arca.live",
      hostRe: /arca\.live|ac\.namu\.la|namu\.la/i,
      // 야짤챈은 애니 비중 큼 → 실사 은꼴/gif 검색 위주
      photoStrong: false,
      top: true,
      boards: {
        yazal: (p) => [
          `https://arca.live/b/shade?mode=best&sort=rating&range=${p.arca}`,
          `https://arca.live/search?target=article&keyword=${encodeURIComponent("실사 야짤")}`,
        ],
        eungol: (p) => [
          `https://arca.live/b/yazzal?mode=best&sort=rating&range=${p.arca}&keyword=${encodeURIComponent("실사 은꼴")}`,
          `https://arca.live/search?target=article&keyword=${encodeURIComponent("은꼴사 실사")}`,
        ],
        gif: (p) => [
          `https://arca.live/b/yazzal?mode=best&sort=rating&range=${p.arca}&keyword=gif`,
          `https://arca.live/b/shade?mode=best&sort=rating&range=${p.arca}&keyword=gif`,
        ],
        yasa: () => [
          `https://arca.live/search?target=article&keyword=${encodeURIComponent("야사")}`,
        ],
      },
    },
    {
      id: "eto",
      name: "이토랜드",
      site: "etoland.co.kr",
      hostRe: /etoland\.co\.kr/i,
      photoStrong: true,
      top: true,
      boards: {
        yazal: () => [
          "https://www.etoland.co.kr/bbs/search.php?keyword=%EC%95%BC%EC%A7%A4",
        ],
        eungol: () => [
          "https://www.etoland.co.kr/bbs/search.php?keyword=%EC%9D%80%EA%BC%B4%EC%82%AC",
        ],
        gif: () => [
          "https://www.etoland.co.kr/bbs/search.php?keyword=%EC%95%BC%EC%A7%A4+gif",
        ],
        yasa: () => [
          "https://www.etoland.co.kr/bbs/search.php?keyword=%EC%95%BC%EC%82%AC",
        ],
      },
    },
    {
      id: "ou",
      name: "오늘의유머",
      site: "todayhumor.co.kr",
      hostRe: /todayhumor\.co\.kr/i,
      photoStrong: true,
      top: true,
      boards: {
        yazal: () => [
          "https://www.todayhumor.co.kr/board/list.php?table=humorbest&kind=search&keyfield=subject&keyword=%EC%95%BC%EC%A7%A4",
        ],
        eungol: () => [
          "https://www.todayhumor.co.kr/board/list.php?table=humorbest&kind=search&keyfield=subject&keyword=%EC%9D%80%EA%BC%B4%EC%82%AC",
        ],
        gif: () => [
          "https://www.todayhumor.co.kr/board/list.php?table=humorbest&kind=search&keyfield=subject&keyword=gif",
        ],
        yasa: () => [
          "https://www.todayhumor.co.kr/board/list.php?table=humorbest&kind=search&keyfield=subject&keyword=%EC%95%BC%EC%82%AC",
        ],
      },
    },
    {
      id: "fmk",
      name: "에펨코리아",
      site: "fmkorea.com",
      hostRe: /fmkorea\.com/i,
      photoStrong: true,
      top: true,
      boards: {
        yazal: () => [
          "https://www.fmkorea.com/search.php?search_keyword=%EC%95%BC%EC%A7%A4&search_target=title_content",
        ],
        eungol: () => [
          "https://www.fmkorea.com/search.php?search_keyword=%EC%9D%80%EA%BC%B4%EC%82%AC&search_target=title_content",
        ],
        gif: () => [
          "https://www.fmkorea.com/search.php?search_keyword=%EC%95%BC%EC%A7%A4+gif&search_target=title_content",
        ],
        yasa: () => [
          "https://www.fmkorea.com/search.php?search_keyword=%EC%95%BC%EC%82%AC&search_target=title_content",
        ],
      },
    },
    {
      id: "pann",
      name: "네이트판",
      site: "pann.nate.com",
      hostRe: /pann\.nate\.com|pstatic\.net|nate\.com/i,
      photoStrong: true,
      top: true,
      boards: {
        yazal: () => ["https://pann.nate.com/search/talk?q=%EC%95%BC%EC%A7%A4"],
        eungol: () => ["https://pann.nate.com/search/talk?q=%EC%9D%80%EA%BC%B4%EC%82%AC"],
        gif: () => ["https://pann.nate.com/search/talk?q=%EC%95%BC%EC%A7%A4+gif"],
        yasa: () => ["https://pann.nate.com/search/talk?q=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "theqoo",
      name: "더쿠",
      site: "theqoo.net",
      hostRe: /theqoo\.net/i,
      photoStrong: true,
      top: false,
      boards: {
        yazal: () => ["https://theqoo.net/search/post?keyword=%EC%95%BC%EC%A7%A4+%EC%8B%A4%EC%82%AC"],
        eungol: () => ["https://theqoo.net/search/post?keyword=%EC%9D%80%EA%BC%B4%EC%82%AC"],
        gif: () => ["https://theqoo.net/search/post?keyword=%EC%95%BC%EC%A7%A4+gif"],
        yasa: () => ["https://theqoo.net/search/post?keyword=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "ruli",
      name: "루리웹",
      site: "ruliweb.com",
      hostRe: /ruliweb\.com/i,
      photoStrong: false, // 애니 많음
      top: false,
      boards: {
        yazal: () => [
          "https://bbs.ruliweb.com/search?search_type=subject_content&search=%EC%8B%A4%EC%82%AC+%EC%95%BC%EC%A7%A4",
        ],
        eungol: () => [
          "https://bbs.ruliweb.com/search?search_type=subject_content&search=%EC%9D%80%EA%BC%B4%EC%82%AC+%EC%8B%A4%EC%82%AC",
        ],
        gif: () => [
          "https://bbs.ruliweb.com/search?search_type=subject_content&search=%EC%95%BC%EC%A7%A4+gif",
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
      photoStrong: false,
      top: false,
      boards: {
        yazal: () => ["https://www.inven.co.kr/search/webzine/article/%EC%8B%A4%EC%82%AC%20%EC%95%BC%EC%A7%A4"],
        eungol: () => ["https://www.inven.co.kr/search/webzine/article/%EC%9D%80%EA%BC%B4%EC%82%AC"],
        gif: () => ["https://www.inven.co.kr/search/webzine/article/%EC%95%BC%EC%A7%A4%20gif"],
        yasa: () => ["https://www.inven.co.kr/search/webzine/article/%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "mlbpark",
      name: "엠팍",
      site: "mlbpark.donga.com",
      hostRe: /mlbpark\.donga\.com|donga\.com/i,
      photoStrong: true,
      top: false,
      boards: {
        yazal: () => [
          "https://mlbpark.donga.com/mp/b.php?search_select=sct&search=%EC%95%BC%EC%A7%A4&b=bullpen",
        ],
        eungol: () => [
          "https://mlbpark.donga.com/mp/b.php?search_select=sct&search=%EC%9D%80%EA%BC%B4%EC%82%AC&b=bullpen",
        ],
        gif: () => [
          "https://mlbpark.donga.com/mp/b.php?search_select=sct&search=%EC%95%BC%EC%A7%A4+gif&b=bullpen",
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
      photoStrong: true,
      top: false,
      boards: {
        yazal: () => [
          "https://www.ppomppu.co.kr/search_bbs.php?search_type=sub_memo&keyword=%EC%95%BC%EC%A7%A4",
        ],
        eungol: () => [
          "https://www.ppomppu.co.kr/search_bbs.php?search_type=sub_memo&keyword=%EC%9D%80%EA%BC%B4%EC%82%AC",
        ],
        gif: () => [
          "https://www.ppomppu.co.kr/search_bbs.php?search_type=sub_memo&keyword=%EC%95%BC%EC%A7%A4+gif",
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
      photoStrong: false,
      top: false,
      boards: {
        yazal: () => ["https://www.clien.net/service/search?q=%EC%95%BC%EC%A7%A4+%EC%8B%A4%EC%82%AC"],
        eungol: () => ["https://www.clien.net/service/search?q=%EC%9D%80%EA%BC%B4%EC%82%AC"],
        gif: () => ["https://www.clien.net/service/search?q=%EC%95%BC%EC%A7%A4+gif"],
        yasa: () => ["https://www.clien.net/service/search?q=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "instiz",
      name: "인스티즈",
      site: "instiz.net",
      hostRe: /instiz\.net/i,
      photoStrong: true,
      top: false,
      boards: {
        yazal: () => ["https://www.instiz.net/iframe_search.htm?k=%EC%95%BC%EC%A7%A4"],
        eungol: () => ["https://www.instiz.net/iframe_search.htm?k=%EC%9D%80%EA%BC%B4%EC%82%AC"],
        gif: () => ["https://www.instiz.net/iframe_search.htm?k=%EC%95%BC%EC%A7%A4+gif"],
        yasa: () => ["https://www.instiz.net/iframe_search.htm?k=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "bobae",
      name: "보배드림",
      site: "bobaedream.co.kr",
      hostRe: /bobaedream\.co\.kr/i,
      photoStrong: true,
      top: false,
      boards: {
        yazal: () => ["https://www.bobaedream.co.kr/search?keyword=%EC%95%BC%EC%A7%A4"],
        eungol: () => ["https://www.bobaedream.co.kr/search?keyword=%EC%9D%80%EA%BC%B4%EC%82%AC"],
        gif: () => ["https://www.bobaedream.co.kr/search?keyword=%EC%95%BC%EC%A7%A4+gif"],
        yasa: () => ["https://www.bobaedream.co.kr/search?keyword=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "humoruniv",
      name: "웃긴대학",
      site: "humoruniv.com",
      hostRe: /humoruniv\.com/i,
      photoStrong: true,
      top: false,
      boards: {
        yazal: () => ["https://web.humoruniv.com/main.html?search=%EC%95%BC%EC%A7%A4"],
        eungol: () => ["https://web.humoruniv.com/main.html?search=%EC%9D%80%EA%BC%B4%EC%82%AC"],
        gif: () => ["https://web.humoruniv.com/main.html?search=%EC%95%BC%EC%A7%A4+gif"],
        yasa: () => ["https://web.humoruniv.com/main.html?search=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "slr",
      name: "SLR클럽",
      site: "slrclub.com",
      hostRe: /slrclub\.com/i,
      photoStrong: true,
      top: false,
      boards: {
        yazal: () => ["https://www.slrclub.com/search.php?keyword=%EC%95%BC%EC%A7%A4"],
        eungol: () => ["https://www.slrclub.com/search.php?keyword=%EC%9D%80%EA%BC%B4%EC%82%AC"],
        gif: () => ["https://www.slrclub.com/search.php?keyword=gif"],
        yasa: () => ["https://www.slrclub.com/search.php?keyword=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "cook82",
      name: "82쿡",
      site: "82cook.com",
      hostRe: /82cook\.com/i,
      photoStrong: true,
      top: false,
      boards: {
        yazal: () => ["https://www.82cook.com/search.php?q=%EC%95%BC%EC%A7%A4"],
        eungol: () => ["https://www.82cook.com/search.php?q=%EC%9D%80%EA%BC%B4%EC%82%AC"],
        gif: () => ["https://www.82cook.com/search.php?q=%EC%95%BC%EC%A7%A4+gif"],
        yasa: () => ["https://www.82cook.com/search.php?q=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "damoang",
      name: "다모앙",
      site: "damoang.net",
      hostRe: /damoang\.net/i,
      photoStrong: false,
      top: false,
      boards: {
        yazal: () => ["https://damoang.net/search?q=%EC%95%BC%EC%A7%A4+%EC%8B%A4%EC%82%AC"],
        eungol: () => ["https://damoang.net/search?q=%EC%9D%80%EA%BC%B4%EC%82%AC"],
        gif: () => ["https://damoang.net/search?q=%EC%95%BC%EC%A7%A4+gif"],
        yasa: () => ["https://damoang.net/search?q=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "gasengi",
      name: "가생이닷컴",
      site: "gasengi.com",
      hostRe: /gasengi\.com/i,
      photoStrong: true,
      top: false,
      boards: {
        yazal: () => ["https://www.gasengi.com/search.php?keyword=%EC%95%BC%EC%A7%A4"],
        eungol: () => ["https://www.gasengi.com/search.php?keyword=%EC%9D%80%EA%BC%B4%EC%82%AC"],
        gif: () => ["https://www.gasengi.com/search.php?keyword=%EC%95%BC%EC%A7%A4+gif"],
        yasa: () => ["https://www.gasengi.com/search.php?keyword=%EC%95%BC%EC%82%AC"],
      },
    },
    {
      id: "orbi",
      name: "오르비",
      site: "orbi.kr",
      hostRe: /orbi\.kr/i,
      photoStrong: false,
      top: false,
      boards: {
        yazal: () => ["https://orbi.kr/search?q=%EC%95%BC%EC%A7%A4+%EC%8B%A4%EC%82%AC"],
        eungol: () => ["https://orbi.kr/search?q=%EC%9D%80%EA%BC%B4%EC%82%AC"],
        gif: () => ["https://orbi.kr/search?q=%EC%95%BC%EC%A7%A4+gif"],
        yasa: () => ["https://orbi.kr/search?q=%EC%95%BC%EC%82%AC"],
      },
    },
  ];

  let selectedPeriod = "day";
  const selectedCats = new Set(
    CATEGORIES.map((c, i) => (c.def ? i : -1)).filter((i) => i >= 0)
  );
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

  function wantGifOnly() {
    const keys = boardKeys();
    return keys.length === 1 && keys[0] === "gif";
  }

  function isImageUrl(url) {
    if (!url) return false;
    return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url.split("#")[0]);
  }

  function isGif(url) {
    return /\.gif(\?|$)/i.test(url.split("?")[0]);
  }

  function isJunk(url) {
    return /sprite|icon|logo|emoji|avatar|profile|ads?|banner|button|loading|blank|1x1|pixel|favicon|emoticon|stamp|thumb_user|nickname/i.test(
      url
    );
  }

  function isAnime(url) {
    return ANIME_RE.test(url);
  }

  function isPhotoCdn(url) {
    return PHOTO_CDN_RE.test(url);
  }

  /** 실사 야짤/은꼴/gif만 통과 */
  function acceptImage(url, community) {
    if (!url || !isImageUrl(url) || isJunk(url) || isAnime(url)) return false;
    if (wantGifOnly() && !isGif(url)) return false;

    // 애니 많은 커뮤니티는 CDN/GIF만
    if (community && community.photoStrong === false) {
      return isGif(url) || isPhotoCdn(url);
    }
    // 그 외: 애니 도메인만 아니면 OK, CDN/GIF 우대는 정렬에서
    return true;
  }

  function scoreImage(url) {
    let s = 0;
    if (isGif(url)) s += 50;
    if (/\.jpe?g(\?|$)/i.test(url)) s += 20;
    if (isPhotoCdn(url)) s += 30;
    if (/실사|eungol|야짤|celeb|girl|nude|sex/i.test(url)) s += 10;
    if (/\.png(\?|$)/i.test(url)) s -= 5; // 애니/캡처 png 많음
    return s;
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
    if (/bing\.com|microsoft\.com|doubleclick|googlesyndication|google-analytics/i.test(s)) {
      return null;
    }
    return s;
  }

  function extractImages(text, base, community) {
    const found = new Set();
    const push = (raw) => {
      const u = normalizeUrl(raw, base);
      if (!u || !acceptImage(u, community)) return;
      found.add(u.split("#")[0]);
    };

    for (const m of text.matchAll(/mediaurl=(https?%3a%2f%2f[^&\s"'<>]+)/gi)) {
      try {
        push(decodeURIComponent(m[1]));
      } catch (_) {}
    }
    for (const m of text.matchAll(
      /(?:src|data-src|data-original|data-url|data-lazy|data-image|data-original-src)\s*=\s*["']([^"']+)["']/gi
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
        if (!href.includes(community.site)) continue;
        if (/search\?|login|join|\.js\b|\.css\b|\/help\b|\/members?\b/i.test(href)) continue;
        if (
          !/\/(b|board|list|article|view|talk|bbs|post)\/|\d{6,}|arca\.live\/b\/[^/]+\/\d+/i.test(
            href
          )
        ) {
          continue;
        }
        // 애니 채널 글 스킵
        if (/\/b\/(aiart|anime|manga|virtuber|miku)/i.test(href)) continue;
        seen.add(href);
        links.push(href);
      }
    }
    return links.slice(0, 12);
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

  function addImages(list, seen, urls, community) {
    for (const src of urls) {
      if (seen.has(src) || !acceptImage(src, community)) continue;
      seen.add(src);
      list.push(src);
    }
    // gif / 실사 CDN 우선
    list.sort((a, b) => scoreImage(b) - scoreImage(a));
  }

  async function collectFromBoard(community, boardUrl, images, seen) {
    let html = "";
    try {
      html = await fetchText(boardUrl, true);
    } catch {
      return;
    }

    addImages(images, seen, extractImages(html, boardUrl, community), community);

    const posts = extractPostLinks(html, community);
    for (const postUrl of posts.slice(0, 10)) {
      try {
        const postHtml = await fetchText(postUrl, true);
        addImages(images, seen, extractImages(postHtml, postUrl, community), community);
        renderGallery(images);
      } catch (_) {}
    }
  }

  async function collectBingBackup(community, period, keywords, images, seen) {
    // 애니 제외 + 실사/야짤/은꼴/gif 강제
    const q = [
      `site:${community.site}`,
      "(",
      keywords.join(" OR "),
      "OR 은꼴사 OR 야짤 OR gif)",
      "실사",
      "-애니 -만화 -anime -hentai -pixiv -wallpaper -일러스트",
    ].join(" ");

    const bing =
      "http://www.bing.com/images/search?q=" +
      encodeURIComponent(q) +
      `&adlt=off&qft=+filterui:age-${period.bingAge}`;

    try {
      const text = await fetchText(bing, false);
      addImages(images, seen, extractImages(text, bing, community), community);
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

    // 실사 잘 나오는 커뮤니티 먼저
    communities.sort((a, b) => Number(b.photoStrong) - Number(a.photoStrong));

    searchBtn.disabled = true;
    galleryEl.innerHTML = "";
    const images = [];
    const seen = new Set();

    for (const c of communities) {
      setStatus(`${c.name}에서 실사/GIF 수집 중... (${images.length}장)`, "");

      const boardUrls = [];
      for (const key of keys) {
        const maker = c.boards?.[key];
        if (maker) boardUrls.push(...maker(period));
      }

      for (const url of [...new Set(boardUrls)].slice(0, 3)) {
        await collectFromBoard(c, url, images, seen);
        renderGallery(images);
      }

      // 사진 강한 커뮤니티만 빙 백업 (애니 오염 방지)
      if (c.photoStrong && images.length < 12) {
        await collectBingBackup(c, period, keywords, images, seen);
        renderGallery(images);
      }
    }

    searchBtn.disabled = false;
    if (!images.length) {
      setStatus("실사/GIF를 못 모았어. 일베·해연갤·디시 위주로 다시 눌러봐.", "error");
      return;
    }
    const gifCount = images.filter(isGif).length;
    setStatus(`${period.ko} · 사진 ${images.length}장 (GIF ${gifCount})`, "ok");
  }

  searchBtn.addEventListener("click", () => {
    runSearch().catch((e) => {
      searchBtn.disabled = false;
      setStatus("오류: " + (e.message || e), "error");
    });
  });
})();
