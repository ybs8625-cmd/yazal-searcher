(() => {
  /**
   * 실사 위주 3곳 (애니 채널인 아카 야짤 제외)
   * - 일베: 실사/은꼴 첨부
   * - 유튜브: 실사 썸네일 (유유베)
   * - 해연갤: 해외연예 실사
   */
  const SOURCES = [
    {
      name: "일베",
      site: "ilbe.com",
      allowHost: /^(?:[\w-]+\.)?ncache\.ilbe\.com$/i,
      mustPath: /\/files\d*\/attach\//i,
      urls: function () {
        var keys = [
          "실사 은꼴",
          "은꼴사",
          "실사 야짤",
          "교복 코스프레 은꼴",
          "글래머 은꼴",
          "비키니 실사",
          "아마추어 실사",
          "셀카 은꼴",
        ];
        var list = keys.map(function (k) {
          return "https://www.ilbe.com/search?keyword=" + encodeURIComponent(k);
        });
        list.push("https://www.ilbe.com/list/celeb");
        list.push("https://www.ilbe.com/list/celeb?sort=hit");
        return list;
      },
    },
    {
      name: "유튜브",
      site: "youtube.com",
      allowHost: /^i\.ytimg\.com$/i,
      urls: function () {
        var keys = [
          "은꼴 실사",
          "성인 교복 코스프레",
          "글래머 실사",
          "비키니 실사",
          "오피스룩 실사",
          "걸크러시 실사",
        ];
        return keys.map(function (k) {
          return (
            "https://www.youtube.com/results?search_query=" +
            encodeURIComponent(k)
          );
        });
      },
      // 검색 결과에서 video id 뽑아 고화질 썸네일 생성
      buildThumbs: true,
    },
    {
      name: "해연갤",
      site: "hygall.com",
      allowHost: /^(?:[\w-]+\.)?hygall\.com$/i,
      mustPath: /\/files\//i,
      urls: function () {
        return [
          "https://hygall.com/?sort=hit",
          "https://hygall.com/ex_all?sort=hit",
          "https://hygall.com/search?keyword=" + encodeURIComponent("은꼴"),
          "https://hygall.com/search?keyword=" + encodeURIComponent("비키니"),
          "https://hygall.com/search?keyword=" + encodeURIComponent("교복"),
        ];
      },
      digPosts: true,
      postPath: /document_srl=(\d+)/i,
    },
  ];

  const PERIODS = [
    { id: "day", ko: "일간", takePosts: 10 },
    { id: "week", ko: "주간", takePosts: 14 },
    { id: "month", ko: "월간", takePosts: 18 },
  ];

  // 애니/그림/광고 차단
  const PATH_BAN =
    /\/box\/|\/common\/|\/layout\/|\/modules\/|\/addons\/|sns\.jpg|icon|logo|button|badge|emoticon|favicon|captcha|banner|sponsor|ads?\.|\/ad\/|pelican|ad4989|naverads|mediacategory|anime|manga|pixiv|hentai|waifu|namu\.la/i;

  var selectedPeriod = "day";
  var abortCtrl = null;
  var running = false;

  var periodsEl = document.getElementById("periods");
  var statusEl = document.getElementById("status");
  var galleryEl = document.getElementById("gallery");
  var searchBtn = document.getElementById("searchBtn");
  var stopBtn = document.getElementById("stopBtn");
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");

  if (!searchBtn || !statusEl || !galleryEl || !periodsEl) {
    alert("페이지 로딩 오류. 새로고침 해줘.");
    return;
  }

  PERIODS.forEach(function (p) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (p.id === selectedPeriod ? " on" : "");
    btn.textContent = p.ko;
    btn.addEventListener("click", function () {
      selectedPeriod = p.id;
      periodsEl.querySelectorAll(".chip").forEach(function (b) {
        b.classList.remove("on");
      });
      btn.classList.add("on");
    });
    periodsEl.appendChild(btn);
  });

  function period() {
    for (var i = 0; i < PERIODS.length; i++) {
      if (PERIODS[i].id === selectedPeriod) return PERIODS[i];
    }
    return PERIODS[0];
  }

  function setStatus(msg, kind) {
    statusEl.textContent = msg || "";
    statusEl.className = "status" + (kind ? " " + kind : "");
  }

  function setRunning(on) {
    running = on;
    searchBtn.disabled = on;
    stopBtn.disabled = !on;
    searchBtn.textContent = on ? "검색 중..." : "검색";
  }

  function isAborted() {
    return !!(abortCtrl && abortCtrl.signal && abortCtrl.signal.aborted);
  }

  function throwIfAborted() {
    if (isAborted()) {
      var e = new Error("STOPPED");
      e.name = "AbortError";
      throw e;
    }
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var t = setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error("시간초과"));
      }, ms);
      promise.then(
        function (v) {
          if (done) return;
          done = true;
          clearTimeout(t);
          resolve(v);
        },
        function (err) {
          if (done) return;
          done = true;
          clearTimeout(t);
          reject(err);
        }
      );
    });
  }

  async function fetchText(url) {
    throwIfAborted();
    var opts = {
      signal: abortCtrl.signal,
      headers: {
        Accept: "text/html",
        "X-Return-Format": "html",
        "X-Timeout": "15",
      },
    };
    try {
      var r = await withTimeout(fetch("https://r.jina.ai/" + url, opts), 18000);
      throwIfAborted();
      if (r.ok) {
        var text = await r.text();
        if (text && text.length > 100) return text;
      }
    } catch (e) {
      if (e.name === "AbortError" || e.message === "STOPPED") throw e;
    }
    try {
      var r2 = await withTimeout(
        fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(url), {
          signal: abortCtrl.signal,
        }),
        18000
      );
      throwIfAborted();
      if (r2.ok) return await r2.text();
    } catch (e) {
      if (e.name === "AbortError" || e.message === "STOPPED") throw e;
    }
    throw new Error("불러오기 실패");
  }

  function normalizeUrl(u, base) {
    if (!u) return null;
    var s = String(u).trim().replace(/&amp;/g, "&");
    if (!s || s.indexOf("data:") === 0) return null;
    if (s.indexOf("//") === 0) s = "https:" + s;
    if (s.charAt(0) === "/" && base) {
      try {
        s = new URL(s, base).href;
      } catch (e) {
        return null;
      }
    }
    if (!/^https?:\/\//i.test(s)) return null;
    return s.split("#")[0];
  }

  function hostOf(u) {
    try {
      return new URL(u).hostname;
    } catch (e) {
      return "";
    }
  }

  function isAllowedImage(url, source) {
    if (!url) return false;
    if (PATH_BAN.test(url)) return false;
    // 유튜브는 jpg 썸네일
    if (source.site === "youtube.com") {
      return /^i\.ytimg\.com$/i.test(hostOf(url)) && /\/vi\/[\w-]+\//i.test(url);
    }
    if (!/\.(jpe?g|png|webp|gif)(\?|$)/i.test(url.split("?")[0])) return false;
    if (!source.allowHost.test(hostOf(url))) return false;
    if (source.mustPath && !source.mustPath.test(url)) return false;
    return true;
  }

  function extractAllowedImages(html, base, source) {
    var out = [];
    var seen = {};
    function push(raw) {
      var u = normalizeUrl(raw, base);
      if (!u || seen[u]) return;
      if (!isAllowedImage(u, source)) return;
      // 유튜브는 maxres/hq 만
      if (source.site === "youtube.com") {
        if (!/(maxresdefault|hqdefault|sddefault)\.jpg/i.test(u)) return;
      }
      seen[u] = 1;
      out.push(u);
    }

    var x;
    var reAttr =
      /(?:data-original|data-url|data-src|data-lazy|data-thumb|src)\s*=\s*["']([^"']+)["']/gi;
    while ((x = reAttr.exec(html))) push(x[1]);
    var reMd = /!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi;
    while ((x = reMd.exec(html))) push(x[1]);
    var rePlain =
      /https?:\/\/[^\s"'<>)\\]+?\.(?:jpe?g|png|webp|gif)(?:\?[^\s"'<>)\\]*)?/gi;
    while ((x = rePlain.exec(html))) push(x[0].replace(/[.,;)]+$/, ""));

    // 유튜브: video id → 썸네일 생성
    if (source.buildThumbs) {
      var ids = {};
      var reId =
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|\/vi\/)([\w-]{6,})/gi;
      while ((x = reId.exec(html))) {
        if (ids[x[1]]) continue;
        ids[x[1]] = 1;
        push("https://i.ytimg.com/vi/" + x[1] + "/maxresdefault.jpg");
        push("https://i.ytimg.com/vi/" + x[1] + "/hqdefault.jpg");
      }
    }

    out.sort(function (a, b) {
      return Number(/\.gif/i.test(b)) - Number(/\.gif/i.test(a));
    });
    return out;
  }

  function extractPostLinks(html, source, listUrl) {
    if (!source.digPosts || !source.postPath) return [];
    var links = [];
    var seen = {};
    var re = /href=["']([^"']+)["']/gi;
    var m;
    while ((m = re.exec(html))) {
      var href = normalizeUrl(m[1], listUrl);
      if (!href || seen[href]) continue;
      if (!source.postPath.test(href)) continue;
      seen[href] = 1;
      links.push(href);
    }
    return links;
  }

  function renderGallery(images) {
    galleryEl.innerHTML = "";
    for (var i = 0; i < images.length; i++) {
      (function (src) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "shot";
        var img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.loading = "lazy";
        img.referrerPolicy = "no-referrer";
        img.onerror = function () {
          if (btn.parentNode) btn.parentNode.removeChild(btn);
        };
        btn.appendChild(img);
        btn.onclick = function () {
          lightboxImg.src = src;
          lightbox.hidden = false;
        };
        galleryEl.appendChild(btn);
      })(images[i]);
    }
  }

  lightbox.onclick = function () {
    lightbox.hidden = true;
    lightboxImg.removeAttribute("src");
  };

  stopBtn.onclick = function () {
    if (!running || !abortCtrl) return;
    abortCtrl.abort();
    setStatus("중지됨", "ok");
    setRunning(false);
  };

  async function runSearch() {
    setStatus("실사 위주로 수집 중...", "");
    setRunning(true);
    galleryEl.innerHTML = "";

    var p = period();
    abortCtrl = new AbortController();
    var images = [];
    var seenImg = {};
    var failCount = 0;

    function addImgs(arr) {
      for (var i = 0; i < arr.length; i++) {
        if (seenImg[arr[i]]) continue;
        seenImg[arr[i]] = 1;
        images.push(arr[i]);
      }
      if (arr.length) renderGallery(images);
    }

    try {
      for (var s = 0; s < SOURCES.length; s++) {
        throwIfAborted();
        var src = SOURCES[s];
        setStatus(src.name + " · 실사 수집 중...");
        var urls = src.urls();
        var postLinks = [];
        var seenPost = {};

        for (var u = 0; u < urls.length; u++) {
          throwIfAborted();
          try {
            var html = await fetchText(urls[u]);
            addImgs(extractAllowedImages(html, urls[u], src));
            var links = extractPostLinks(html, src, urls[u]);
            for (var L = 0; L < links.length; L++) {
              if (seenPost[links[L]]) continue;
              seenPost[links[L]] = 1;
              postLinks.push(links[L]);
            }
            setStatus(src.name + " · 실사 " + images.length + "장");
          } catch (e) {
            if (e.name === "AbortError" || e.message === "STOPPED") throw e;
            failCount++;
          }
        }

        var digMax = Math.min(postLinks.length, p.takePosts);
        for (var n = 0; n < digMax; n++) {
          throwIfAborted();
          setStatus(src.name + " 본문 " + (n + 1) + "/" + digMax);
          try {
            var postHtml = await fetchText(postLinks[n]);
            addImgs(extractAllowedImages(postHtml, postLinks[n], src));
          } catch (e) {
            if (e.name === "AbortError" || e.message === "STOPPED") throw e;
          }
        }
      }

      setRunning(false);
      if (!images.length) {
        setStatus(
          failCount
            ? "사이트 접속 실패. 잠시 후 다시."
            : "실사 사진을 못 모았어. 다시 검색 눌러봐.",
          "error"
        );
        return;
      }
      setStatus(p.ko + " · 실사 " + images.length + "장 (애니채널 제외)", "ok");
    } catch (e) {
      setRunning(false);
      if (e.name === "AbortError" || e.message === "STOPPED") {
        renderGallery(images);
        setStatus("중지 · " + images.length + "장", "ok");
        return;
      }
      setStatus("오류: " + (e.message || e), "error");
    }
  }

  searchBtn.addEventListener("click", function () {
    if (running) return;
    runSearch().catch(function (e) {
      setRunning(false);
      setStatus("오류: " + (e && e.message ? e.message : e), "error");
    });
  });

  setStatus("v5 · 실사 위주 (일베·유튜브·해연갤). 검색 눌러봐.", "");
})();
