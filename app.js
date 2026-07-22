(() => {
  // pages: 목록을 더 읽어 기간 안 글을 확보 / take: 본문 파고들 글 수
  var PERIODS = [
    { id: "day", ko: "일간", days: 1, pages: 4, take: 24 },
    { id: "week", ko: "주간", days: 7, pages: 8, take: 40 },
    { id: "month", ko: "월간", days: 30, pages: 14, take: 60 },
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

  function cutoffMs(p) {
    return Date.now() - p.days * 24 * 60 * 60 * 1000;
  }

  /** 목록 날짜: "13:57"(오늘) / "07/21" / "07-21" */
  function parseListDate(raw) {
    var s = String(raw || "").trim();
    var now = new Date();
    var hm = /^(\d{1,2}):(\d{2})$/.exec(s);
    if (hm) {
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        +hm[1],
        +hm[2]
      ).getTime();
    }
    var md = /^(\d{1,2})[\/\-](\d{1,2})$/.exec(s);
    if (md) {
      var d = new Date(now.getFullYear(), +md[1] - 1, +md[2], 12, 0, 0);
      if (d.getTime() > now.getTime() + 36 * 3600000) {
        d.setFullYear(d.getFullYear() - 1);
      }
      return d.getTime();
    }
    return now.getTime();
  }

  function stripTags(html) {
    return String(html || "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
  }

  function parseBobPosts(html) {
    var posts = [];
    var re =
      /class="bsubject"[^>]*href="\/view\?code=nsfw&No=(\d+)[^"]*"[\s\S]*?class="date"[^>]*>([^<]+)<[\s\S]*?class="count"[^>]*>([\s\S]*?)<\/td>/gi;
    var m;
    while ((m = re.exec(html))) {
      var views = parseInt(stripTags(m[3]).replace(/[^\d]/g, ""), 10) || 0;
      posts.push({
        id: m[1],
        views: views,
        time: parseListDate(m[2]),
      });
    }
    return posts;
  }

  function parseJjtvPosts(html) {
    var posts = [];
    var re =
      /td_subject[\s\S]*?<a href="https:\/\/jjtv\.kr\/15\/(\d+)"[\s\S]*?<\/td>\s*<td class="td_name[\s\S]*?<\/td>\s*<td class="td_num[^"]*">\s*([\d,]+)\s*<\/td>\s*<td class="td_num[^"]*">\s*[\d,]+\s*<\/td>\s*<td class="td_num[^"]*">\s*[\d,-]+\s*<\/td>\s*<td class="td_datetime[^"]*">\s*([^<]+)\s*<\/td>/gi;
    var m;
    while ((m = re.exec(html))) {
      posts.push({
        id: m[1],
        views: parseInt(String(m[2]).replace(/,/g, ""), 10) || 0,
        time: parseListDate(m[3]),
      });
    }
    return posts;
  }

  function parseGmAge(meta) {
    var text = stripTags(meta);
    var views = 0;
    var ageMs = 6 * 3600000;
    var vm = text.match(/조회\s*수?\s*(\d+)/);
    if (vm) views = parseInt(vm[1], 10);
    else {
      var n0 = text.match(/(\d+)/);
      if (n0) views = parseInt(n0[1], 10);
    }

    if (/방금/.test(text)) ageMs = 5 * 60000;
    else if (/(\d+)\s*분/.test(text)) {
      ageMs = parseInt(RegExp.$1, 10) * 60000;
    } else if (/(\d+)\s*시간/.test(text)) {
      ageMs = parseInt(RegExp.$1, 10) * 3600000;
    } else if (/(\d+)\s*일/.test(text)) {
      ageMs = parseInt(RegExp.$1, 10) * 86400000;
    } else if (/오늘/.test(text)) {
      ageMs = 12 * 3600000;
    } else {
      var nums = text.match(/\d+/g);
      if (nums && nums.length >= 2) {
        if (!views) views = parseInt(nums[0], 10);
        ageMs = parseInt(nums[1], 10) * 86400000;
      }
    }
    return { views: views, time: Date.now() - ageMs };
  }

  function parseGmPosts(html) {
    var posts = [];
    var re =
      /gid=(\d{6,})"[^>]*>[\s\S]*?class="day_news">([\s\S]*?)<\/div>/gi;
    var m;
    while ((m = re.exec(html))) {
      var meta = parseGmAge(m[2]);
      var thumb = null;
      var chunk = m[0];
      var tm = /https?:\/\/cdn\.gamemeca\.com\/gmboard\/fam_gallery\/[^"'\\\s<>)]+/i.exec(
        chunk
      );
      if (tm) thumb = normalizeUrl(tm[0].replace(/[.,;)]+$/, ""));
      posts.push({
        id: m[1],
        views: meta.views,
        time: meta.time,
        thumb: thumb,
      });
    }
    return posts;
  }

  function mergePosts(list) {
    var map = {};
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var prev = map[p.id];
      if (!prev || p.views > prev.views) map[p.id] = p;
    }
    var out = [];
    for (var k in map) if (Object.prototype.hasOwnProperty.call(map, k)) out.push(map[k]);
    return out;
  }

  function filterAndRank(posts, p) {
    var cut = cutoffMs(p);
    var filtered = posts.filter(function (x) {
      return x.time >= cut;
    });
    filtered.sort(function (a, b) {
      return b.views - a.views;
    });
    return filtered;
  }

  var BOB_ALLOW = /^https?:\/\/file\d*\.bobaedream\.co\.kr\/nsfw\//i;
  var BOB_ABS =
    /https?:\/\/file\d*\.bobaedream\.co\.kr\/nsfw\/[^\s"'<>)\\]+/gi;
  var GM_ALLOW = /^https?:\/\/cdn\.gamemeca\.com\/gmboard\/fam_gallery\//i;
  var GM_ABS =
    /https?:\/\/cdn\.gamemeca\.com\/gmboard\/fam_gallery\/[^\s"'<>)\\]+/gi;
  var JJ_ALLOW = /^https?:\/\/img\d*\.jjtv\.kr\//i;
  var JJ_ABS = /https?:\/\/img\d*\.jjtv\.kr\/[^\s"'<>)\\]+/gi;

  async function scrapeBobae(p, addImgs) {
    var LIST = "https://www.bobaedream.co.kr/list?code=nsfw";
    var VIEW_M = "https://m.bobaedream.co.kr/board/bbs_view/nsfw/";
    var VIEW_D = "https://www.bobaedream.co.kr/view?code=nsfw&No=";
    var collected = [];

    for (var page = 1; page <= p.pages; page++) {
      throwIfAborted();
      setStatus("목록 수집 중... " + page + "/" + p.pages);
      try {
        var html = await fetchText(LIST + (page > 1 ? "&page=" + page : ""));
        collected = collected.concat(parseBobPosts(html));
      } catch (e) {
        if (e.name === "AbortError") throw e;
      }
    }

    var ranked = filterAndRank(mergePosts(collected), p);
    var take = Math.min(ranked.length, p.take);
    setStatus("조회수순 정리 · " + take + "개");

    for (var n = 0; n < take; n++) {
      throwIfAborted();
      var post = ranked[n];
      setStatus(
        "사진 모으는 중... " + (n + 1) + "/" + take + " · 조회 " + post.views
      );
      var ok = false;
      try {
        var imgs = extractByAllow(
          await fetchText(VIEW_M + post.id),
          BOB_ALLOW,
          BOB_ABS
        );
        if (imgs.length) {
          addImgs(imgs, post.views);
          ok = true;
        }
      } catch (e) {
        if (e.name === "AbortError") throw e;
      }
      if (!ok) {
        try {
          addImgs(
            extractByAllow(await fetchText(VIEW_D + post.id), BOB_ALLOW, BOB_ABS),
            post.views
          );
        } catch (e) {
          if (e.name === "AbortError") throw e;
        }
      }
    }
  }

  async function scrapeGamemeca(p, addImgs) {
    var LIST = "https://www.gamemeca.com/fam.php?rts=board&gcode=fam_gallery";
    var VIEW =
      "https://www.gamemeca.com/fam.php?rts=board&gcode=fam_gallery&gid=";
    var collected = [];

    for (var page = 1; page <= p.pages; page++) {
      throwIfAborted();
      setStatus("목록 수집 중... " + page + "/" + p.pages);
      try {
        var html = await fetchText(LIST + (page > 1 ? "&p=" + page : ""));
        collected = collected.concat(parseGmPosts(html));
      } catch (e) {
        if (e.name === "AbortError") throw e;
      }
    }

    var ranked = filterAndRank(mergePosts(collected), p);
    var take = Math.min(ranked.length, p.take);
    setStatus("조회수순 정리 · " + take + "개");

    // 목록 썸네일부터 조회수순으로 먼저 표시
    for (var t = 0; t < ranked.length; t++) {
      if (ranked[t].thumb) addImgs([ranked[t].thumb], ranked[t].views);
    }

    for (var n = 0; n < take; n++) {
      throwIfAborted();
      var post = ranked[n];
      setStatus(
        "사진 모으는 중... " + (n + 1) + "/" + take + " · 조회 " + post.views
      );
      try {
        addImgs(
          extractByAllow(await fetchText(VIEW + post.id), GM_ALLOW, GM_ABS),
          post.views
        );
      } catch (e) {
        if (e.name === "AbortError") throw e;
      }
    }
  }

  async function scrapeJjtv(p, addImgs) {
    var LIST = "https://jjtv.kr/15";
    var VIEW = "https://jjtv.kr/15/";
    var collected = [];

    for (var page = 1; page <= p.pages; page++) {
      throwIfAborted();
      setStatus("목록 수집 중... " + page + "/" + p.pages);
      try {
        var html = await fetchText(LIST + (page > 1 ? "?page=" + page : ""));
        collected = collected.concat(parseJjtvPosts(html));
      } catch (e) {
        if (e.name === "AbortError") throw e;
      }
    }

    var ranked = filterAndRank(mergePosts(collected), p);
    var take = Math.min(ranked.length, p.take);
    setStatus("조회수순 정리 · " + take + "개");

    for (var n = 0; n < take; n++) {
      throwIfAborted();
      var post = ranked[n];
      setStatus(
        "사진 모으는 중... " + (n + 1) + "/" + take + " · 조회 " + post.views
      );
      try {
        var imgs = extractByAllow(
          await fetchText(VIEW + post.id),
          JJ_ALLOW,
          JJ_ABS
        ).filter(function (u) {
          // 목록용 0000 썸네일 제외
          return !/_0000\.(jpe?g|png|gif|webp)(\?|$)/i.test(u);
        });
        addImgs(imgs, post.views);
      } catch (e) {
        if (e.name === "AbortError") throw e;
      }
    }
  }

  function renderGallery(items) {
    galleryEl.innerHTML = "";
    for (var i = 0; i < items.length; i++) {
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
      })(items[i].url);
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
    setStatus(p.ko + " · 조회수순 검색 시작...", "");
    setRunning(true);
    galleryEl.innerHTML = "";
    abortCtrl = new AbortController();

    var items = [];
    var seenImg = {};

    function addImgs(arr, views) {
      var v = views || 0;
      var changed = false;
      for (var i = 0; i < arr.length; i++) {
        var u = arr[i];
        if (!u) continue;
        if (seenImg[u]) {
          // 같은 이미지면 더 높은 조회수로 갱신
          for (var j = 0; j < items.length; j++) {
            if (items[j].url === u && v > items[j].views) {
              items[j].views = v;
              changed = true;
            }
          }
          continue;
        }
        seenImg[u] = 1;
        items.push({ url: u, views: v });
        changed = true;
      }
      if (changed) {
        items.sort(function (a, b) {
          return b.views - a.views;
        });
        renderGallery(items);
      }
    }

    try {
      await scrapeBobae(p, addImgs);
      await scrapeGamemeca(p, addImgs);
      await scrapeJjtv(p, addImgs);

      setRunning(false);
      if (!items.length) {
        setStatus("해당 기간 이미지를 못 모았어. 다시 검색 눌러봐.", "error");
        return;
      }
      setStatus(
        p.ko + " · 조회수순 · 사진 " + items.length + "장",
        "ok"
      );
    } catch (e) {
      setRunning(false);
      if (e.name === "AbortError" || e.message === "STOPPED") {
        items.sort(function (a, b) {
          return b.views - a.views;
        });
        renderGallery(items);
        setStatus("중지 · " + items.length + "장", "ok");
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

  setStatus("5.6 · 일간/주간/월간 = 기간 안 조회수순. 검색 눌러봐.", "");
})();
