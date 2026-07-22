(() => {
  var PERIODS = [
    { id: "day", ko: "일간", pages: 2, take: 16 },
    { id: "week", ko: "주간", pages: 5, take: 30 },
    { id: "month", ko: "월간", pages: 10, take: 50 },
  ];

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

  function throwIfAborted() {
    if (abortCtrl && abortCtrl.signal && abortCtrl.signal.aborted) {
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
        "X-Timeout": "18",
      },
    };
    try {
      var r = await withTimeout(fetch("https://r.jina.ai/" + url, opts), 20000);
      throwIfAborted();
      if (r.ok) {
        var t = await r.text();
        if (t && t.length > 200) return t;
      }
    } catch (e) {
      if (e.name === "AbortError" || e.message === "STOPPED") throw e;
    }
    try {
      var r2 = await withTimeout(
        fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(url), {
          signal: abortCtrl.signal,
        }),
        20000
      );
      throwIfAborted();
      if (r2.ok) return await r2.text();
    } catch (e) {
      if (e.name === "AbortError" || e.message === "STOPPED") throw e;
    }
    throw new Error("불러오기 실패");
  }

  function normalizeUrl(u) {
    if (!u) return null;
    var s = String(u).trim().replace(/&amp;/g, "&");
    if (s.indexOf("//") === 0) s = "https:" + s;
    if (!/^https?:\/\//i.test(s)) return null;
    s = s.replace(
      /https?:\/\/file\d*\.bobaedream\.co\.kr\/https?:\/\//i,
      "https://"
    );
    s = s.replace(/https?:\/\/cdn\.gamemeca\.com\/https?:\/\//i, "https://");
    return s.split("#")[0];
  }

  function isImageUrl(u) {
    return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u.split("?")[0]);
  }

  function extractByAllow(html, allowRe, absoluteRe) {
    var out = [];
    var seen = {};
    function push(raw) {
      var u = normalizeUrl(raw);
      if (!u || seen[u]) return;
      if (!allowRe.test(u)) return;
      if (!isImageUrl(u)) return;
      seen[u] = 1;
      out.push(u);
    }
    var x;
    var re1 =
      /(?:src|data-src|data-original|data-lazy)\s*=\s*["']([^"']+)["']/gi;
    while ((x = re1.exec(html))) push(x[1]);
    if (absoluteRe) {
      while ((x = absoluteRe.exec(html))) push(x[0].replace(/[.,;)]+$/, ""));
    }
    return out;
  }

  // —— 보배드림 NSFW ——
  var BOB_ALLOW = /^https?:\/\/file\d*\.bobaedream\.co\.kr\/nsfw\//i;
  var BOB_ABS =
    /https?:\/\/file\d*\.bobaedream\.co\.kr\/nsfw\/[^\s"'<>)\\]+/gi;

  function bobPostNos(html) {
    var nos = [];
    var seen = {};
    var re = /(?:code=nsfw&No=|bbs_view\/nsfw\/|No=)(\d{3,})/gi;
    var m;
    while ((m = re.exec(html))) {
      var no = m[1];
      if (seen[no] || parseInt(no, 10) < 1000) continue;
      seen[no] = 1;
      nos.push(no);
    }
    return nos;
  }

  async function scrapeBobae(p, addImgs) {
    var LIST = "https://www.bobaedream.co.kr/list?code=nsfw";
    var LIST_M = "https://m.bobaedream.co.kr/board/new_writing/nsfw";
    var VIEW_M = "https://m.bobaedream.co.kr/board/bbs_view/nsfw/";
    var VIEW_D = "https://www.bobaedream.co.kr/view?code=nsfw&No=";
    var nos = [];
    var seen = {};

    try {
      bobPostNos(await fetchText(LIST_M)).forEach(function (no) {
        if (seen[no]) return;
        seen[no] = 1;
        nos.push(no);
      });
    } catch (e) {
      if (e.name === "AbortError") throw e;
    }

    for (var page = 1; page <= p.pages; page++) {
      throwIfAborted();
      setStatus("보배드림 목록 " + page + "/" + p.pages);
      try {
        var html = await fetchText(LIST + (page > 1 ? "&page=" + page : ""));
        bobPostNos(html).forEach(function (no) {
          if (seen[no]) return;
          seen[no] = 1;
          nos.push(no);
        });
      } catch (e) {
        if (e.name === "AbortError") throw e;
      }
    }

    var take = Math.min(nos.length, p.take);
    for (var n = 0; n < take; n++) {
      throwIfAborted();
      var no = nos[n];
      setStatus("보배드림 본문 " + (n + 1) + "/" + take);
      var ok = false;
      try {
        var imgs = extractByAllow(await fetchText(VIEW_M + no), BOB_ALLOW, BOB_ABS);
        if (imgs.length) {
          addImgs(imgs);
          ok = true;
        }
      } catch (e) {
        if (e.name === "AbortError") throw e;
      }
      if (!ok) {
        try {
          addImgs(
            extractByAllow(await fetchText(VIEW_D + no), BOB_ALLOW, BOB_ABS)
          );
        } catch (e) {
          if (e.name === "AbortError") throw e;
        }
      }
    }
  }

  // —— 게임메카 fam_gallery ——
  var GM_ALLOW = /^https?:\/\/cdn\.gamemeca\.com\/gmboard\/fam_gallery\//i;
  var GM_ABS =
    /https?:\/\/cdn\.gamemeca\.com\/gmboard\/fam_gallery\/[^\s"'<>)\\]+/gi;

  function gmGids(html) {
    var ids = [];
    var seen = {};
    var re = /(?:[?&]gid=|gid=)(\d{4,})/gi;
    var m;
    while ((m = re.exec(html))) {
      var id = m[1];
      if (seen[id]) continue;
      seen[id] = 1;
      ids.push(id);
    }
    return ids;
  }

  async function scrapeGamemeca(p, addImgs) {
    var LIST = "https://www.gamemeca.com/fam.php?rts=board&gcode=fam_gallery";
    var LIST_M = "https://m.gamemeca.com/fam.php?rts=board&gcode=fam_gallery";
    var VIEW = "https://www.gamemeca.com/fam.php?rts=board&gcode=fam_gallery&gid=";
    var gids = [];
    var seen = {};

    try {
      var mob = await fetchText(LIST_M);
      addImgs(extractByAllow(mob, GM_ALLOW, GM_ABS));
      gmGids(mob).forEach(function (id) {
        if (seen[id]) return;
        seen[id] = 1;
        gids.push(id);
      });
    } catch (e) {
      if (e.name === "AbortError") throw e;
    }

    for (var page = 1; page <= p.pages; page++) {
      throwIfAborted();
      setStatus("게임메카 목록 " + page + "/" + p.pages);
      try {
        var html = await fetchText(LIST + (page > 1 ? "&p=" + page : ""));
        // 목록 썸네일도 바로 반영
        addImgs(extractByAllow(html, GM_ALLOW, GM_ABS));
        gmGids(html).forEach(function (id) {
          if (seen[id]) return;
          seen[id] = 1;
          gids.push(id);
        });
      } catch (e) {
        if (e.name === "AbortError") throw e;
      }
    }

    var take = Math.min(gids.length, p.take);
    for (var n = 0; n < take; n++) {
      throwIfAborted();
      var gid = gids[n];
      setStatus("게임메카 본문 " + (n + 1) + "/" + take);
      try {
        addImgs(extractByAllow(await fetchText(VIEW + gid), GM_ALLOW, GM_ABS));
      } catch (e) {
        if (e.name === "AbortError") throw e;
      }
    }
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
    var p = period();
    setStatus("검색 시작...", "");
    setRunning(true);
    galleryEl.innerHTML = "";
    abortCtrl = new AbortController();

    var images = [];
    var seenImg = {};

    function addImgs(arr) {
      for (var i = 0; i < arr.length; i++) {
        if (seenImg[arr[i]]) continue;
        seenImg[arr[i]] = 1;
        images.push(arr[i]);
      }
      if (arr.length) renderGallery(images);
    }

    try {
      await scrapeBobae(p, addImgs);
      await scrapeGamemeca(p, addImgs);

      setRunning(false);
      if (!images.length) {
        setStatus("이미지를 못 모았어. 다시 검색 눌러봐.", "error");
        return;
      }
      setStatus(
        "보배드림 + 게임메카 · 사진 " + images.length + "장",
        "ok"
      );
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

  setStatus("5.2 · 보배드림 NSFW + 게임메카 갤러리. 검색 눌러봐.", "");
})();
