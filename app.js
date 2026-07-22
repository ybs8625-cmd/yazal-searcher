(() => {
  // 은꼴사·야짤 유명 3곳 고정
  const SOURCES = [
    {
      name: "아카 야짤",
      site: "arca.live",
      // 보드 자체가 야짤이라 제목에 '야짤' 없어도 OK
      boardMode: true,
      urls: (range) => [
        `https://arca.live/b/yazzal?mode=best&sort=rating&range=${range}`,
        `https://arca.live/b/shade?mode=best&sort=rating&range=${range}`,
      ],
    },
    {
      name: "일베",
      site: "ilbe.com",
      boardMode: false,
      urls: () => [
        "https://www.ilbe.com/search?keyword=%EC%95%BC%EC%A7%A4",
        "https://www.ilbe.com/search?keyword=%EC%9D%80%EA%BC%B4%EC%82%AC",
      ],
    },
    {
      name: "해연갤",
      site: "hygall.com",
      boardMode: false,
      urls: () => [
        "https://hygall.com/?sort=hit",
        "https://hygall.com/search?keyword=%EC%9D%80%EA%BC%B4",
      ],
    },
  ];

  const PERIODS = [
    { id: "day", ko: "일간", arca: "24h", take: 15 },
    { id: "week", ko: "주간", arca: "7d", take: 20 },
    { id: "month", ko: "월간", arca: "30d", take: 25 },
  ];

  const TITLE_OK = /야짤|은꼴사|은꼴|움짤|gif/i;
  const TITLE_BAN =
    /애니|만화|일러스트|픽시브|pixiv|hentai|팬아트|동인|니케|블루아카|AI\s*그림|와후|waifu|단보루|젤보루/i;
  const URL_BAN =
    /pixiv|pximg|danbooru|donmai|gelbooru|sankaku|rule34|booru|zerochan|wixmp|waifu|hentai|anime|manga|nhentai|civitai|novelai|aiart/i;

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

    // 1) jina
    try {
      var r = await withTimeout(fetch("https://r.jina.ai/" + url, opts), 18000);
      throwIfAborted();
      if (r.ok) {
        var text = await r.text();
        if (text && text.length > 200) return text;
      }
    } catch (e) {
      if (e.name === "AbortError" || e.message === "STOPPED") throw e;
    }

    // 2) allorigins 백업
    try {
      var r2 = await withTimeout(
        fetch(
          "https://api.allorigins.win/raw?url=" + encodeURIComponent(url),
          { signal: abortCtrl.signal }
        ),
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
    return s;
  }

  function parseViews(chunk) {
    var m =
      chunk.match(/조회\s*수?\s*[:：]?\s*([\d,]+)/i) ||
      chunk.match(/views?\s*[:：]?\s*([\d,]+)/i) ||
      chunk.match(/\b([\d,]{3,7})\b/);
    return m ? parseInt(m[1].replace(/,/g, ""), 10) || 0 : 0;
  }

  function titleOk(title, boardMode) {
    if (!title || title.length < 2) return false;
    if (TITLE_BAN.test(title)) return false;
    if (boardMode) return true; // 야짤 보드면 제목 자유
    return TITLE_OK.test(title);
  }

  function extractPosts(html, site, listUrl, boardMode) {
    var posts = [];
    var seen = {};
    var re =
      /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>|\[([^\]]{2,160})\]\((https?:\/\/[^)]+)\)/gi;
    var m;
    while ((m = re.exec(html))) {
      var href = m[1] || m[4];
      var title = (m[2] || m[3] || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      href = normalizeUrl(href, listUrl);
      if (!href || !title) continue;
      if (href.indexOf(site) === -1) continue;
      if (/search|login|join|notice|공지|\.css|\.js\b|javascript:/i.test(href + title))
        continue;
      if (!/\/\d{5,}|(view|article|post|bbs|board|b\/[^\/]+\/\d+)/i.test(href)) continue;
      if (!titleOk(title, boardMode)) continue;
      if (seen[href]) continue;
      var around = html.slice(
        Math.max(0, m.index - 60),
        Math.min(html.length, m.index + 260)
      );
      seen[href] = 1;
      posts.push({ title: title, href: href, views: parseViews(around) });
    }
    return posts;
  }

  function extractImages(html, base) {
    var out = [];
    var seen = {};
    function push(raw) {
      var u = normalizeUrl(raw, base);
      if (!u) return;
      if (!/\.(jpe?g|png|webp|gif)(\?|$)/i.test(u.split("#")[0])) return;
      if (/sprite|icon|logo|emoji|avatar|banner|ads?|pixel|favicon|emoticon/i.test(u))
        return;
      if (URL_BAN.test(u)) return;
      u = u.split("#")[0];
      if (seen[u]) return;
      seen[u] = 1;
      out.push(u);
    }

    var x;
    var re1 = /(?:src|data-src|data-original|data-lazy)\s*=\s*["']([^"']+)["']/gi;
    while ((x = re1.exec(html))) push(x[1]);
    var re2 = /!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi;
    while ((x = re2.exec(html))) push(x[1]);
    var re3 =
      /https?:\/\/[^\s"'<>)\\]+?\.(?:jpe?g|png|webp|gif)(?:\?[^\s"'<>)\\]*)?/gi;
    while ((x = re3.exec(html))) push(x[0].replace(/[.,;)]+$/, ""));
    return out;
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
    setStatus("검색 시작...", "");
    setRunning(true);
    galleryEl.innerHTML = "";

    var p = period();
    abortCtrl = new AbortController();

    var posts = [];
    var seenPost = {};
    var images = [];
    var seenImg = {};
    var failCount = 0;

    try {
      for (var s = 0; s < SOURCES.length; s++) {
        throwIfAborted();
        var src = SOURCES[s];
        setStatus(src.name + " 읽는 중...");
        var urls = src.urls(p.arca);
        for (var u = 0; u < urls.length; u++) {
          throwIfAborted();
          try {
            var html = await fetchText(urls[u]);
            var found = extractPosts(html, src.site, urls[u], src.boardMode);
            for (var i = 0; i < found.length; i++) {
              if (seenPost[found[i].href]) continue;
              seenPost[found[i].href] = 1;
              posts.push(found[i]);
            }
            // 목록에 썸네일이 있으면 바로 추가 (반응 빨리)
            var thumbs = extractImages(html, urls[u]);
            for (var t = 0; t < thumbs.length; t++) {
              if (seenImg[thumbs[t]]) continue;
              seenImg[thumbs[t]] = 1;
              images.push(thumbs[t]);
            }
            if (thumbs.length) renderGallery(images);
            setStatus(
              src.name + " · 글 " + found.length + "개 · 사진 " + images.length + "장"
            );
          } catch (e) {
            if (e.name === "AbortError" || e.message === "STOPPED") throw e;
            failCount++;
            setStatus(src.name + " 실패, 다음으로...");
          }
        }
      }

      posts.sort(function (a, b) {
        return b.views - a.views;
      });
      var top = posts.slice(0, p.take);

      for (var n = 0; n < top.length; n++) {
        throwIfAborted();
        var post = top[n];
        setStatus(
          "본문 " +
            (n + 1) +
            "/" +
            top.length +
            " · " +
            post.title.slice(0, 22)
        );
        try {
          var postHtml = await fetchText(post.href);
          var imgs = extractImages(postHtml, post.href);
          for (var k = 0; k < imgs.length; k++) {
            if (seenImg[imgs[k]]) continue;
            seenImg[imgs[k]] = 1;
            images.push(imgs[k]);
          }
          images.sort(function (a, b) {
            return Number(/\.gif/i.test(b)) - Number(/\.gif/i.test(a));
          });
          renderGallery(images);
        } catch (e) {
          if (e.name === "AbortError" || e.message === "STOPPED") throw e;
        }
      }

      setRunning(false);
      if (!images.length) {
        setStatus(
          failCount
            ? "사이트 접속이 막혔어. 와이파이/데이터 바꿔서 다시 눌러봐."
            : "사진을 못 모았어. 다시 검색 눌러봐.",
          "error"
        );
        return;
      }
      setStatus(p.ko + " · 사진 " + images.length + "장", "ok");
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
    setStatus("버튼 눌림 · 준비 중...", "");
    runSearch().catch(function (e) {
      setRunning(false);
      setStatus("오류: " + (e && e.message ? e.message : e), "error");
    });
  });

  setStatus("기간 고르고 검색 눌러봐.", "");
})();
