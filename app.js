(() => {
  /**
   * 핵심: 광고 URL은 절대 허용 안 함.
   * 각 커뮤니티 "첨부/본문 CDN" 화이트리스트만 통과.
   */
  const SOURCES = [
    {
      name: "일베",
      site: "ilbe.com",
      allowHost: /^(?:[\w-]+\.)?ncache\.ilbe\.com$/i,
      // 목록에 붙는 files/attach 가 본문 사진
      urls: function () {
        return [
          "https://www.ilbe.com/search?keyword=%EC%95%BC%EC%A7%A4",
          "https://www.ilbe.com/search?keyword=%EC%9D%80%EA%BC%B4%EC%82%AC",
          "https://www.ilbe.com/search?keyword=%EC%9D%80%EA%BC%B4",
          "https://www.ilbe.com/search?keyword=%EC%95%BC%EC%A7%A4+gif",
          "https://www.ilbe.com/list/celeb",
          "https://www.ilbe.com/list/celeb?sort=hit",
        ];
      },
    },
    {
      name: "아카 야짤",
      site: "arca.live",
      allowHost: /^(?:ac\.)?namu\.la$/i,
      urls: function (range) {
        return [
          "https://arca.live/b/yazzal?mode=best&sort=rating&range=" + range,
          "https://arca.live/b/shade?mode=best&sort=rating&range=" + range,
          "https://arca.live/b/yazzal?mode=best",
          "https://arca.live/b/shade?mode=best",
        ];
      },
      // 목록에 CDN이 잘 안 보여서 글로 들어감
      digPosts: true,
      postPath: /arca\.live\/b\/(?:yazzal|shade)\/(\d+)/i,
    },
    {
      name: "해연갤",
      site: "hygall.com",
      // 해연갤 본문 첨부는 보통 files/ 아래
      allowHost: /^(?:[\w-]+\.)?hygall\.com$/i,
      allowPath: /\/files\/|\/attach|\/xe\/|document_srl/i,
      urls: function () {
        return [
          "https://hygall.com/?sort=hit",
          "https://hygall.com/ex_all?sort=hit",
          "https://hygall.com/search?keyword=%EC%9D%80%EA%BC%B4",
          "https://hygall.com/search?keyword=%EC%95%BC%EC%A7%A4",
        ];
      },
      digPosts: true,
      postPath: /document_srl=(\d+)|hygall\.com\/(?:ex_all|ex_\w+)\/(\d+)/i,
    },
  ];

  const PERIODS = [
    { id: "day", ko: "일간", arca: "24h", takePosts: 12 },
    { id: "week", ko: "주간", arca: "7d", takePosts: 16 },
    { id: "month", ko: "월간", arca: "30d", takePosts: 20 },
  ];

  // UI/광고/아이콘 경로
  const PATH_BAN =
    /\/box\/|\/common\/|\/layout\/|\/modules\/|\/addons\/|sns\.jpg|icon|logo|button|badge|emoticon|favicon|captcha|banner|sponsor|ads?\.|\/ad\/|pelican|ad4989|naverads|mediacategory|wcs\.naver/i;

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

  function pathOf(u) {
    try {
      return new URL(u).pathname + new URL(u).search;
    } catch (e) {
      return u;
    }
  }

  /** 화이트리스트 CDN만 통과 — 광고 원천 차단 */
  function isAllowedImage(url, source) {
    if (!url) return false;
    if (!/\.(jpe?g|png|webp|gif)(\?|$)/i.test(url.split("?")[0])) return false;
    if (PATH_BAN.test(url)) return false;
    var host = hostOf(url);
    if (!source.allowHost.test(host)) return false;
    if (source.allowPath && !source.allowPath.test(pathOf(url))) {
      // hygall: files/attach 만. 루트 sns.jpg 같은 건 거름
      return false;
    }
    // 일베는 attach 경로만
    if (source.site === "ilbe.com" && !/\/files\d*\/attach\//i.test(url)) {
      return false;
    }
    return true;
  }

  function extractAllowedImages(html, base, source) {
    var out = [];
    var seen = {};
    function push(raw) {
      var u = normalizeUrl(raw, base);
      if (!u || seen[u]) return;
      if (!isAllowedImage(u, source)) return;
      seen[u] = 1;
      out.push(u);
    }

    var x;
    var reAttr =
      /(?:data-original|data-url|data-src|data-lazy|data-orig-src|src)\s*=\s*["']([^"']+)["']/gi;
    while ((x = reAttr.exec(html))) push(x[1]);
    var reMd = /!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi;
    while ((x = reMd.exec(html))) push(x[1]);
    var rePlain =
      /https?:\/\/[^\s"'<>)\\]+?\.(?:jpe?g|png|webp|gif)(?:\?[^\s"'<>)\\]*)?/gi;
    while ((x = rePlain.exec(html))) push(x[0].replace(/[.,;)]+$/, ""));

    // gif 우선
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
      // 공지성 낮은 번호/고정글 대략 스킵 (아카 공지)
      if (/\/b\/yazzal\/(6457546|34868656|97065903|9434376)\b/i.test(href)) continue;
      seen[href] = 1;
      links.push(href);
    }
    // markdown links
    var re2 = /\]\((https?:\/\/[^)]+)\)/gi;
    while ((m = re2.exec(html))) {
      var href2 = normalizeUrl(m[1], listUrl);
      if (!href2 || seen[href2]) continue;
      if (!source.postPath.test(href2)) continue;
      seen[href2] = 1;
      links.push(href2);
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
    setStatus("검색 시작... (첨부사진만)", "");
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
        setStatus(src.name + " · 첨부CDN만 수집 중...");
        var urls = src.urls(p.arca);
        var postLinks = [];
        var seenPost = {};

        for (var u = 0; u < urls.length; u++) {
          throwIfAborted();
          try {
            var html = await fetchText(urls[u]);
            // 1) 목록에 이미 붙어있는 첨부 이미지 (일베 ncache 등)
            addImgs(extractAllowedImages(html, urls[u], src));
            // 2) 글로 들어갈 링크 모으기
            var links = extractPostLinks(html, src, urls[u]);
            for (var L = 0; L < links.length; L++) {
              if (seenPost[links[L]]) continue;
              seenPost[links[L]] = 1;
              postLinks.push(links[L]);
            }
            setStatus(
              src.name + " · 사진 " + images.length + "장 · 글링크 " + postLinks.length
            );
          } catch (e) {
            if (e.name === "AbortError" || e.message === "STOPPED") throw e;
            failCount++;
          }
        }

        // 본문 첨부 더 뽑기 (화이트리스트만)
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
            ? "사이트 접속 실패. 잠시 후 다시 눌러봐."
            : "첨부 사진을 못 찾았어. 다시 검색 눌러봐.",
          "error"
        );
        return;
      }
      setStatus(p.ko + " · 첨부사진 " + images.length + "장 (광고 제외)", "ok");
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

  setStatus("검색 누르면 첨부사진만 불러옴 (광고 차단).", "");
})();
