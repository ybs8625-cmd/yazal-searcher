(() => {
  // 보배드림 NSFW 게시판만
  var BOARD = "nsfw";
  var LIST_BASE = "https://www.bobaedream.co.kr/list?code=" + BOARD;
  var VIEW_DESK = "https://www.bobaedream.co.kr/view?code=" + BOARD + "&No=";
  var VIEW_MOBILE = "https://m.bobaedream.co.kr/board/bbs_view/" + BOARD + "/";
  // 사용자가 준 모바일 목록 (참고용으로도 시도)
  var LIST_MOBILE = "https://m.bobaedream.co.kr/board/new_writing/" + BOARD;

  // 본문 첨부만 허용 (광고/UI 제외)
  var ALLOW_IMG = /^https?:\/\/file\d*\.bobaedream\.co\.kr\/nsfw\//i;

  var PERIODS = [
    { id: "day", ko: "일간", pages: 2, take: 20 },
    { id: "week", ko: "주간", pages: 5, take: 40 },
    { id: "month", ko: "월간", pages: 10, take: 60 },
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
    // jina가 가끔 중복 붙이는 경우 정리
    s = s.replace(
      /https?:\/\/file\d*\.bobaedream\.co\.kr\/https?:\/\//i,
      "https://"
    );
    return s.split("#")[0];
  }

  /** 목록에서 글 번호 뽑기 */
  function extractPostNos(html) {
    var nos = [];
    var seen = {};
    var re = /(?:code=nsfw&No=|bbs_view\/nsfw\/|No=)(\d{3,})/gi;
    var m;
    while ((m = re.exec(html))) {
      var no = m[1];
      if (seen[no]) continue;
      // 운영/공지성 낮은 번호는 대략 스킵
      if (parseInt(no, 10) < 1000) continue;
      seen[no] = 1;
      nos.push(no);
    }
    return nos;
  }

  /** 본문 NSFW 첨부 이미지만 */
  function extractNsfwImages(html) {
    var out = [];
    var seen = {};
    function push(raw) {
      var u = normalizeUrl(raw);
      if (!u || seen[u]) return;
      if (!ALLOW_IMG.test(u)) return;
      if (!/\.(jpe?g|png|webp|gif)(\?|$)/i.test(u.split("?")[0])) return;
      seen[u] = 1;
      out.push(u);
    }

    var x;
    var re1 =
      /(?:src|data-src|data-original|data-lazy)\s*=\s*["']([^"']+)["']/gi;
    while ((x = re1.exec(html))) push(x[1]);
    var re2 =
      /https?:\/\/file\d*\.bobaedream\.co\.kr\/nsfw\/[^\s"'<>)\\]+/gi;
    while ((x = re2.exec(html))) push(x[0].replace(/[.,;)]+$/, ""));

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
    var p = period();
    setStatus("보배드림 NSFW 목록 읽는 중...", "");
    setRunning(true);
    galleryEl.innerHTML = "";
    abortCtrl = new AbortController();

    var nos = [];
    var seenNo = {};
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
      // 모바일 목록도 한번 시도
      try {
        var mob = await fetchText(LIST_MOBILE);
        extractPostNos(mob).forEach(function (no) {
          if (seenNo[no]) return;
          seenNo[no] = 1;
          nos.push(no);
        });
      } catch (e) {
        if (e.name === "AbortError") throw e;
      }

      // PC 목록 페이지들
      for (var page = 1; page <= p.pages; page++) {
        throwIfAborted();
        setStatus("목록 " + page + "/" + p.pages + " 읽는 중...");
        var listUrl = LIST_BASE + (page > 1 ? "&page=" + page : "");
        try {
          var html = await fetchText(listUrl);
          var found = extractPostNos(html);
          for (var i = 0; i < found.length; i++) {
            if (seenNo[found[i]]) continue;
            seenNo[found[i]] = 1;
            nos.push(found[i]);
          }
          setStatus("글 " + nos.length + "개 확보");
        } catch (e) {
          if (e.name === "AbortError") throw e;
        }
      }

      if (!nos.length) {
        setStatus("글을 못 찾았어. 잠시 후 다시 눌러봐.", "error");
        setRunning(false);
        return;
      }

      var take = Math.min(nos.length, p.take);
      for (var n = 0; n < take; n++) {
        throwIfAborted();
        var no = nos[n];
        setStatus("본문 " + (n + 1) + "/" + take + " · No." + no);

        // 모바일 본문 우선, 실패 시 PC
        var ok = false;
        try {
          var mHtml = await fetchText(VIEW_MOBILE + no);
          var imgs = extractNsfwImages(mHtml);
          if (imgs.length) {
            addImgs(imgs);
            ok = true;
          }
        } catch (e) {
          if (e.name === "AbortError") throw e;
        }
        if (!ok) {
          try {
            var dHtml = await fetchText(VIEW_DESK + no);
            addImgs(extractNsfwImages(dHtml));
          } catch (e) {
            if (e.name === "AbortError") throw e;
          }
        }
      }

      setRunning(false);
      if (!images.length) {
        setStatus("본문 이미지를 못 모았어. 다시 검색 눌러봐.", "error");
        return;
      }
      setStatus("보배드림 NSFW · 사진 " + images.length + "장", "ok");
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

  setStatus("5.1 · 보배드림 NSFW 이미지 수집. 검색 눌러봐.", "");
})();
