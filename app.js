(() => {
  var PAGE_SIZE = 50;
  var MORE_BATCH = 20;
  var MORE_PAGES = 5;
  var MAX_PAGES = 120;
  var PERIODS = [
    { id: "day", ko: "일간", days: 1, pages: 4, take: 24 },
    { id: "week", ko: "주간", days: 7, pages: 8, take: 40 },
    { id: "month", ko: "월간", days: 30, pages: 14, take: 60 },
    { id: "custom", ko: "기간선택", days: 0, pages: 0, take: 0 },
  ];

  var selectedPeriod = "week";
  var abortCtrl = null;
  var running = false;

  // 전체 수집분 (조회수순) / 화면에 뿌린 장수
  var allItems = [];
  var seenImg = {};
  var visibleCount = 0;
  var session = null; // 추가검색용 세션

  var periodsEl = document.getElementById("periods");
  var rangeBox = document.getElementById("rangeBox");
  var rangeHint = document.getElementById("rangeHint");
  var rangePresets = document.getElementById("rangePresets");
  var fromYearEl = document.getElementById("fromYear");
  var fromMonthEl = document.getElementById("fromMonth");
  var toYearEl = document.getElementById("toYear");
  var toMonthEl = document.getElementById("toMonth");
  var statusEl = document.getElementById("status");
  var galleryEl = document.getElementById("gallery");
  var moreBtn = document.getElementById("moreBtn");
  var moreSearchBtn = document.getElementById("moreSearchBtn");
  var searchBtn = document.getElementById("searchBtn");
  var stopBtn = document.getElementById("stopBtn");
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxClose = document.getElementById("lightboxClose");

  if (!searchBtn || !statusEl || !galleryEl || !periodsEl || !moreBtn || !moreSearchBtn) {
    alert("페이지 로딩 오류. 새로고침 해줘.");
    return;
  }

  var now = new Date();
  var THIS_Y = now.getFullYear();
  var THIS_M = now.getMonth() + 1;
  var MIN_Y = 2020;

  function fillSelect(el, from, to, selected, suffix) {
    el.innerHTML = "";
    for (var v = from; v <= to; v++) {
      var opt = document.createElement("option");
      opt.value = String(v);
      opt.textContent = suffix ? v + suffix : String(v);
      if (v === selected) opt.selected = true;
      el.appendChild(opt);
    }
  }

  fillSelect(fromYearEl, MIN_Y, THIS_Y, THIS_Y, "년");
  fillSelect(toYearEl, MIN_Y, THIS_Y, THIS_Y, "년");
  fillSelect(fromMonthEl, 1, 12, Math.max(1, THIS_M - 2), "월");
  fillSelect(toMonthEl, 1, 12, THIS_M, "월");

  function ymValue(yEl, mEl) {
    return parseInt(yEl.value, 10) * 100 + parseInt(mEl.value, 10);
  }

  function syncRangeHint() {
    var a = ymValue(fromYearEl, fromMonthEl);
    var b = ymValue(toYearEl, toMonthEl);
    if (a > b) {
      rangeHint.textContent = "시작이 끝보다 늦어. 자동으로 바꿔서 검색해.";
      return;
    }
    var months =
      (parseInt(toYearEl.value, 10) - parseInt(fromYearEl.value, 10)) * 12 +
      (parseInt(toMonthEl.value, 10) - parseInt(fromMonthEl.value, 10)) +
      1;
    rangeHint.textContent =
      fromYearEl.value +
      "." +
      String(fromMonthEl.value).padStart(2, "0") +
      " ~ " +
      toYearEl.value +
      "." +
      String(toMonthEl.value).padStart(2, "0") +
      " · " +
      months +
      "개월 · 조회수순 · 화면은 50장씩";
  }

  [fromYearEl, fromMonthEl, toYearEl, toMonthEl].forEach(function (el) {
    el.addEventListener("change", syncRangeHint);
  });

  function setRange(fy, fm, ty, tm) {
    fromYearEl.value = String(fy);
    fromMonthEl.value = String(fm);
    toYearEl.value = String(ty);
    toMonthEl.value = String(tm);
    syncRangeHint();
  }

  [
    {
      ko: "최근 3개월",
      apply: function () {
        var d = new Date(THIS_Y, THIS_M - 3, 1);
        setRange(d.getFullYear(), d.getMonth() + 1, THIS_Y, THIS_M);
      },
    },
    {
      ko: "최근 6개월",
      apply: function () {
        var d = new Date(THIS_Y, THIS_M - 6, 1);
        setRange(d.getFullYear(), d.getMonth() + 1, THIS_Y, THIS_M);
      },
    },
    {
      ko: "올해",
      apply: function () {
        setRange(THIS_Y, 1, THIS_Y, THIS_M);
      },
    },
    {
      ko: "작년",
      apply: function () {
        setRange(THIS_Y - 1, 1, THIS_Y - 1, 12);
      },
    },
  ].forEach(function (p) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = p.ko;
    btn.addEventListener("click", function () {
      selectedPeriod = "custom";
      updatePeriodUi();
      p.apply();
    });
    rangePresets.appendChild(btn);
  });

  syncRangeHint();

  PERIODS.forEach(function (p) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (p.id === selectedPeriod ? " on" : "");
    btn.dataset.id = p.id;
    btn.textContent = p.ko;
    btn.addEventListener("click", function () {
      selectedPeriod = p.id;
      updatePeriodUi();
    });
    periodsEl.appendChild(btn);
  });

  function updatePeriodUi() {
    periodsEl.querySelectorAll(".chip").forEach(function (b) {
      b.classList.toggle("on", b.dataset.id === selectedPeriod);
    });
    rangeBox.hidden = selectedPeriod !== "custom";
  }
  updatePeriodUi();

  function getSearchPlan() {
    if (selectedPeriod !== "custom") {
      for (var i = 0; i < PERIODS.length; i++) {
        if (PERIODS[i].id === selectedPeriod) {
          var p = PERIODS[i];
          return {
            label: p.ko,
            fromMs: Date.now() - p.days * 86400000,
            toMs: Date.now() + 86400000,
            pages: p.pages,
            take: p.take,
          };
        }
      }
    }

    var fy = parseInt(fromYearEl.value, 10);
    var fm = parseInt(fromMonthEl.value, 10);
    var ty = parseInt(toYearEl.value, 10);
    var tm = parseInt(toMonthEl.value, 10);
    if (fy * 100 + fm > ty * 100 + tm) {
      var swapY = fy;
      var swapM = fm;
      fy = ty;
      fm = tm;
      ty = swapY;
      tm = swapM;
      setRange(fy, fm, ty, tm);
    }
    var fromMs = new Date(fy, fm - 1, 1, 0, 0, 0).getTime();
    var toMs = new Date(ty, tm, 0, 23, 59, 59).getTime();
    var months = (ty - fy) * 12 + (tm - fm) + 1;
    return {
      label: fy + "." + String(fm).padStart(2, "0") + "~" + ty + "." + String(tm).padStart(2, "0"),
      fromMs: fromMs,
      toMs: toMs,
      pages: Math.min(90, Math.max(12, months * 5)),
      take: Math.min(220, Math.max(40, months * 12)),
      months: months,
    };
  }

  function setStatus(msg, kind) {
    statusEl.textContent = msg || "";
    statusEl.className = "status" + (kind ? " " + kind : "");
  }

  function setRunning(on) {
    running = on;
    searchBtn.disabled = on;
    stopBtn.disabled = !on;
    moreSearchBtn.disabled = on;
    searchBtn.textContent = on ? "검색 중..." : "검색";
    updateFooterBtns();
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

  function stripTags(html) {
    return String(html || "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
  }

  /** 목록 날짜 → 후보 타임스탬프들 (년 없는 MM/DD는 범위 내 가능한 해 모두) */
  function candidateTimes(raw, plan) {
    var s = String(raw || "").trim();
    var out = [];
    var hm = /^(\d{1,2}):(\d{2})$/.exec(s);
    if (hm) {
      var today = new Date();
      out.push(
        new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          +hm[1],
          +hm[2]
        ).getTime()
      );
      return out;
    }
    var ymd = /^(20\d{2})[.\-\/](\d{1,2})[.\-\/](\d{1,2})$/.exec(s);
    if (ymd) {
      out.push(new Date(+ymd[1], +ymd[2] - 1, +ymd[3], 12, 0, 0).getTime());
      return out;
    }
    var yymd = /^(\d{2})[.\-\/](\d{1,2})[.\-\/](\d{1,2})$/.exec(s);
    if (yymd) {
      out.push(
        new Date(2000 + +yymd[1], +yymd[2] - 1, +yymd[3], 12, 0, 0).getTime()
      );
      return out;
    }
    var md = /^(\d{1,2})[\/\-](\d{1,2})$/.exec(s);
    if (md) {
      var fromY = new Date(plan.fromMs).getFullYear();
      var toY = new Date(plan.toMs).getFullYear();
      for (var yy = fromY - 1; yy <= toY + 1; yy++) {
        out.push(new Date(yy, +md[1] - 1, +md[2], 12, 0, 0).getTime());
      }
      return out;
    }
    out.push(Date.now());
    return out;
  }

  function timeInPlan(raw, plan) {
    var cands = candidateTimes(raw, plan);
    for (var i = 0; i < cands.length; i++) {
      if (cands[i] >= plan.fromMs && cands[i] <= plan.toMs) return cands[i];
    }
    return null;
  }

  function parseBobPosts(html, plan) {
    var posts = [];
    var re =
      /class="bsubject"[^>]*href="\/view\?code=nsfw&No=(\d+)[^"]*"[\s\S]*?class="date"[^>]*>([^<]+)<[\s\S]*?class="count"[^>]*>([\s\S]*?)<\/td>/gi;
    var m;
    while ((m = re.exec(html))) {
      var t = timeInPlan(m[2], plan);
      if (t == null) continue;
      posts.push({
        id: m[1],
        views: parseInt(stripTags(m[3]).replace(/[^\d]/g, ""), 10) || 0,
        time: t,
      });
    }
    return posts;
  }

  function parseJjtvPosts(html, plan) {
    var posts = [];
    var re =
      /td_subject[\s\S]*?<a href="https:\/\/jjtv\.kr\/15\/(\d+)"[\s\S]*?<\/td>\s*<td class="td_name[\s\S]*?<\/td>\s*<td class="td_num[^"]*">\s*([\d,]+)\s*<\/td>\s*<td class="td_num[^"]*">\s*[\d,]+\s*<\/td>\s*<td class="td_num[^"]*">\s*[\d,-]+\s*<\/td>\s*<td class="td_datetime[^"]*">\s*([^<]+)\s*<\/td>/gi;
    var m;
    while ((m = re.exec(html))) {
      var t = timeInPlan(m[3], plan);
      if (t == null) continue;
      posts.push({
        id: m[1],
        views: parseInt(String(m[2]).replace(/,/g, ""), 10) || 0,
        time: t,
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
    else if (/(\d+)\s*분/.test(text)) ageMs = parseInt(RegExp.$1, 10) * 60000;
    else if (/(\d+)\s*시간/.test(text)) ageMs = parseInt(RegExp.$1, 10) * 3600000;
    else if (/(\d+)\s*일/.test(text)) ageMs = parseInt(RegExp.$1, 10) * 86400000;
    else if (/(\d+)\s*달|(\d+)\s*개월/.test(text)) {
      var mm = text.match(/(\d+)\s*(?:달|개월)/);
      ageMs = (mm ? parseInt(mm[1], 10) : 1) * 30 * 86400000;
    } else if (/오늘/.test(text)) ageMs = 12 * 3600000;
    else {
      var nums = text.match(/\d+/g);
      if (nums && nums.length >= 2) {
        if (!views) views = parseInt(nums[0], 10);
        ageMs = parseInt(nums[1], 10) * 86400000;
      }
    }
    return { views: views, time: Date.now() - ageMs };
  }

  function parseGmPosts(html, plan) {
    var posts = [];
    var re =
      /gid=(\d{6,})"[^>]*>[\s\S]*?class="day_news">([\s\S]*?)<\/div>/gi;
    var m;
    while ((m = re.exec(html))) {
      var meta = parseGmAge(m[2]);
      if (meta.time < plan.fromMs || meta.time > plan.toMs) continue;
      var thumb = null;
      var tm = /https?:\/\/cdn\.gamemeca\.com\/gmboard\/fam_gallery\/[^"'\\\s<>)]+/i.exec(
        m[0]
      );
      if (tm) thumb = normalizeUrl(tm[0].replace(/[.,;)]+$/, ""));
      // CDN 경로 날짜도 보조 확인
      if (thumb) {
        var pathDate = /\/(20\d{2})\/(\d{2})\/(\d{2})\//.exec(thumb);
        if (pathDate) {
          var pt = new Date(
            +pathDate[1],
            +pathDate[2] - 1,
            +pathDate[3],
            12,
            0,
            0
          ).getTime();
          if (pt < plan.fromMs || pt > plan.toMs) continue;
          meta.time = pt;
        }
      }
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
    for (var k in map)
      if (Object.prototype.hasOwnProperty.call(map, k)) out.push(map[k]);
    out.sort(function (a, b) {
      return b.views - a.views;
    });
    return out;
  }

  var BOB_ALLOW = /^https?:\/\/file\d*\.bobaedream\.co\.kr\/nsfw\//i;
  var BOB_ABS =
    /https?:\/\/file\d*\.bobaedream\.co\.kr\/nsfw\/[^\s"'<>)\\]+/gi;
  var GM_ALLOW = /^https?:\/\/cdn\.gamemeca\.com\/gmboard\/fam_gallery\//i;
  var GM_ABS =
    /https?:\/\/cdn\.gamemeca\.com\/gmboard\/fam_gallery\/[^\s"'<>)\\]+/gi;
  var JJ_ALLOW = /^https?:\/\/img\d*\.jjtv\.kr\//i;
  var JJ_ABS = /https?:\/\/img\d*\.jjtv\.kr\/[^\s"'<>)\\]+/gi;

  function updateFooterBtns() {
    var left = allItems.length - visibleCount;
    if (running) {
      moreBtn.hidden = true;
      moreSearchBtn.hidden = true;
      return;
    }
    if (left > 0) {
      moreBtn.hidden = false;
      moreBtn.textContent =
        "더보기 · " + Math.min(PAGE_SIZE, left) + "장 (남은 " + left + "장)";
      moreSearchBtn.hidden = true;
      return;
    }
    moreBtn.hidden = true;
    if (session && !session.done && allItems.length > 0) {
      moreSearchBtn.hidden = false;
      moreSearchBtn.textContent = "추가검색 · 다음 조회수 자료";
    } else {
      moreSearchBtn.hidden = true;
    }
  }

  function renderVisible(force) {
    var want = Math.min(visibleCount, allItems.length);
    var current = galleryEl.querySelectorAll(".shot").length;
    if (force || current > want) {
      galleryEl.innerHTML = "";
      current = 0;
    }
    for (var i = current; i < want; i++) {
      (function (src) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "shot";
        var img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        img.referrerPolicy = "no-referrer";
        img.onerror = function () {
          if (btn.parentNode) btn.parentNode.removeChild(btn);
        };
        btn.appendChild(img);
        btn.onclick = function () {
          openLightbox(src);
        };
        galleryEl.appendChild(btn);
      })(allItems[i].url);
    }
    updateFooterBtns();
  }

  var paintTimer = null;
  var paintForce = false;
  function schedulePaint(force) {
    if (force) paintForce = true;
    if (paintTimer) return;
    paintTimer = setTimeout(function () {
      paintTimer = null;
      var f = paintForce;
      paintForce = false;
      if (visibleCount < PAGE_SIZE && allItems.length) {
        visibleCount = Math.min(PAGE_SIZE, allItems.length);
      }
      renderVisible(f);
    }, 120);
  }

  function addImgs(arr, views) {
    var v = views || 0;
    var changed = false;
    var added = 0;
    for (var i = 0; i < arr.length; i++) {
      var u = arr[i];
      if (!u) continue;
      if (seenImg[u]) {
        // 이미 확보한 사진은 자리 유지 (중간에 끼어들지 않음)
        for (var j = 0; j < allItems.length; j++) {
          if (allItems[j].url === u && v > allItems[j].views) {
            allItems[j].views = v;
          }
        }
        continue;
      }
      seenImg[u] = 1;
      allItems.push({ url: u, views: v });
      changed = true;
      added++;
    }
    if (!changed) return 0;

    // 화면은 확보 순서대로 아래로만 붙임 (조회수 재정렬로 중간 삽입 안 함)
    if (visibleCount === 0 && allItems.length) {
      visibleCount = Math.min(PAGE_SIZE, allItems.length);
      schedulePaint(true);
    } else if (visibleCount < PAGE_SIZE && allItems.length > visibleCount) {
      visibleCount = Math.min(PAGE_SIZE, allItems.length);
      schedulePaint(false);
    } else {
      updateFooterBtns();
    }
    return added;
  }

  function newBucket() {
    return { posts: [], dig: 0, pages: 0, empty: false };
  }

  function mergeIntoBucket(bucket, list) {
    var map = {};
    for (var i = 0; i < bucket.posts.length; i++) {
      map[bucket.posts[i].id] = bucket.posts[i];
    }
    for (var j = 0; j < list.length; j++) {
      var p = list[j];
      var prev = map[p.id];
      if (!prev || p.views > prev.views) map[p.id] = p;
    }
    var out = [];
    for (var k in map)
      if (Object.prototype.hasOwnProperty.call(map, k)) out.push(map[k]);
    out.sort(function (a, b) {
      return b.views - a.views;
    });
    bucket.posts = out;
  }

  async function fetchBobLists(plan, fromPage, toPage) {
    var LIST = "https://www.bobaedream.co.kr/list?code=nsfw";
    var collected = [];
    for (var page = fromPage; page <= toPage; page++) {
      throwIfAborted();
      setStatus("목록 수집 중... " + page + "/" + toPage + " · 확보 " + allItems.length + "장");
      try {
        var html = await fetchText(LIST + (page > 1 ? "&page=" + page : ""));
        collected = collected.concat(parseBobPosts(html, plan));
      } catch (e) {
        if (e.name === "AbortError") throw e;
      }
    }
    return collected;
  }

  async function digBobPosts(bucket, count) {
    var VIEW_M = "https://m.bobaedream.co.kr/board/bbs_view/nsfw/";
    var VIEW_D = "https://www.bobaedream.co.kr/view?code=nsfw&No=";
    var take = Math.min(count, bucket.posts.length - bucket.dig);
    var before = allItems.length;
    for (var n = 0; n < take; n++) {
      throwIfAborted();
      var post = bucket.posts[bucket.dig + n];
      setStatus(
        "사진 모으는 중... " +
          (n + 1) +
          "/" +
          take +
          " · 화면 " +
          visibleCount +
          "/" +
          allItems.length
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
    bucket.dig += take;
    return allItems.length - before;
  }

  async function scrapeBobae(plan, bucket, firstTake) {
    if (bucket.pages < plan.pages) {
      var got = await fetchBobLists(plan, bucket.pages + 1, plan.pages);
      mergeIntoBucket(bucket, got);
      bucket.pages = plan.pages;
    }
    return digBobPosts(bucket, firstTake);
  }

  async function extendBobae(plan, bucket) {
    var gained = 0;
    if (bucket.posts.length - bucket.dig < MORE_BATCH && !bucket.empty) {
      if (bucket.pages >= MAX_PAGES) {
        bucket.empty = true;
      } else {
        var to = Math.min(MAX_PAGES, bucket.pages + MORE_PAGES);
        var got = await fetchBobLists(plan, bucket.pages + 1, to);
        var beforeLen = bucket.posts.length;
        mergeIntoBucket(bucket, got);
        bucket.pages = to;
        if (bucket.posts.length === beforeLen) bucket.empty = true;
      }
    }
    gained += await digBobPosts(bucket, MORE_BATCH);
    if (bucket.dig >= bucket.posts.length && bucket.empty) {
      /* no more */
    }
    return gained;
  }

  async function fetchGmLists(plan, fromPage, toPage) {
    var LIST = "https://www.gamemeca.com/fam.php?rts=board&gcode=fam_gallery";
    var collected = [];
    for (var page = fromPage; page <= toPage; page++) {
      throwIfAborted();
      setStatus("목록 수집 중... " + page + "/" + toPage + " · 확보 " + allItems.length + "장");
      try {
        var html = await fetchText(LIST + (page > 1 ? "&p=" + page : ""));
        collected = collected.concat(parseGmPosts(html, plan));
      } catch (e) {
        if (e.name === "AbortError") throw e;
      }
    }
    return collected;
  }

  async function digGmPosts(bucket, count, withThumbs) {
    var VIEW =
      "https://www.gamemeca.com/fam.php?rts=board&gcode=fam_gallery&gid=";
    var take = Math.min(count, bucket.posts.length - bucket.dig);
    var before = allItems.length;
    if (withThumbs) {
      for (var t = bucket.dig; t < bucket.dig + take; t++) {
        if (bucket.posts[t] && bucket.posts[t].thumb) {
          addImgs([bucket.posts[t].thumb], bucket.posts[t].views);
        }
      }
    }
    for (var n = 0; n < take; n++) {
      throwIfAborted();
      var post = bucket.posts[bucket.dig + n];
      setStatus(
        "사진 모으는 중... " +
          (n + 1) +
          "/" +
          take +
          " · 화면 " +
          visibleCount +
          "/" +
          allItems.length
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
    bucket.dig += take;
    return allItems.length - before;
  }

  async function scrapeGamemeca(plan, bucket, firstTake) {
    if (bucket.pages < plan.pages) {
      var got = await fetchGmLists(plan, bucket.pages + 1, plan.pages);
      mergeIntoBucket(bucket, got);
      bucket.pages = plan.pages;
    }
    return digGmPosts(bucket, firstTake, true);
  }

  async function extendGamemeca(plan, bucket) {
    if (bucket.posts.length - bucket.dig < MORE_BATCH && !bucket.empty) {
      if (bucket.pages >= MAX_PAGES) bucket.empty = true;
      else {
        var to = Math.min(MAX_PAGES, bucket.pages + MORE_PAGES);
        var got = await fetchGmLists(plan, bucket.pages + 1, to);
        var beforeLen = bucket.posts.length;
        mergeIntoBucket(bucket, got);
        bucket.pages = to;
        if (bucket.posts.length === beforeLen) bucket.empty = true;
      }
    }
    return digGmPosts(bucket, MORE_BATCH, true);
  }

  async function fetchJjLists(plan, fromPage, toPage) {
    var LIST = "https://jjtv.kr/15";
    var collected = [];
    for (var page = fromPage; page <= toPage; page++) {
      throwIfAborted();
      setStatus("목록 수집 중... " + page + "/" + toPage + " · 확보 " + allItems.length + "장");
      try {
        var html = await fetchText(LIST + (page > 1 ? "?page=" + page : ""));
        collected = collected.concat(parseJjtvPosts(html, plan));
      } catch (e) {
        if (e.name === "AbortError") throw e;
      }
    }
    return collected;
  }

  async function digJjPosts(bucket, count) {
    var VIEW = "https://jjtv.kr/15/";
    var take = Math.min(count, bucket.posts.length - bucket.dig);
    var before = allItems.length;
    for (var n = 0; n < take; n++) {
      throwIfAborted();
      var post = bucket.posts[bucket.dig + n];
      setStatus(
        "사진 모으는 중... " +
          (n + 1) +
          "/" +
          take +
          " · 화면 " +
          visibleCount +
          "/" +
          allItems.length
      );
      try {
        var imgs = extractByAllow(
          await fetchText(VIEW + post.id),
          JJ_ALLOW,
          JJ_ABS
        ).filter(function (u) {
          return !/_0000\.(jpe?g|png|gif|webp)(\?|$)/i.test(u);
        });
        addImgs(imgs, post.views);
      } catch (e) {
        if (e.name === "AbortError") throw e;
      }
    }
    bucket.dig += take;
    return allItems.length - before;
  }

  async function scrapeJjtv(plan, bucket, firstTake) {
    if (bucket.pages < plan.pages) {
      var got = await fetchJjLists(plan, bucket.pages + 1, plan.pages);
      mergeIntoBucket(bucket, got);
      bucket.pages = plan.pages;
    }
    return digJjPosts(bucket, firstTake);
  }

  async function extendJjtv(plan, bucket) {
    if (bucket.posts.length - bucket.dig < MORE_BATCH && !bucket.empty) {
      if (bucket.pages >= MAX_PAGES) bucket.empty = true;
      else {
        var to = Math.min(MAX_PAGES, bucket.pages + MORE_PAGES);
        var got = await fetchJjLists(plan, bucket.pages + 1, to);
        var beforeLen = bucket.posts.length;
        mergeIntoBucket(bucket, got);
        bucket.pages = to;
        if (bucket.posts.length === beforeLen) bucket.empty = true;
      }
    }
    return digJjPosts(bucket, MORE_BATCH);
  }

  function sessionCanExtend(s) {
    if (!s || s.done) return false;
    var buckets = [s.bob, s.gm, s.jj];
    for (var i = 0; i < buckets.length; i++) {
      var b = buckets[i];
      if (b.dig < b.posts.length) return true;
      if (!b.empty && b.pages < MAX_PAGES) return true;
    }
    return false;
  }

  function refreshSessionDone() {
    if (!session) return;
    if (!sessionCanExtend(session)) session.done = true;
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.removeAttribute("src");
  }

  function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.hidden = false;
  }

  lightboxClose.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    closeLightbox();
  });

  // 배경(어두운 영역) 누르면 닫기. 사진 자체는 스크롤/확대 제스처에 안 먹히게 분리
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
  });

  stopBtn.onclick = function () {
    if (!running || !abortCtrl) return;
    abortCtrl.abort();
    setStatus(
      "중지 · 확보 " + allItems.length + "장 · 화면 " + visibleCount + "장",
      "ok"
    );
    setRunning(false);
    refreshSessionDone();
    renderVisible(true);
  };

  moreBtn.onclick = function () {
    if (!allItems.length) return;
    var before = visibleCount;
    visibleCount = Math.min(allItems.length, visibleCount + PAGE_SIZE);
    if (visibleCount === before) {
      updateFooterBtns();
      return;
    }
    renderVisible(false);
    setStatus(
      "화면 " + visibleCount + " / 확보 " + allItems.length + "장",
      "ok"
    );
  };

  moreSearchBtn.onclick = function () {
    if (running || !session || session.done) return;
    runMoreSearch().catch(function (e) {
      setRunning(false);
      setStatus("오류: " + (e && e.message ? e.message : e), "error");
      updateFooterBtns();
    });
  };

  async function runSearch() {
    var plan = getSearchPlan();
    setStatus(plan.label + " · 조회수순 검색 시작...", "");
    setRunning(true);
    allItems = [];
    seenImg = {};
    visibleCount = 0;
    session = {
      plan: plan,
      bob: newBucket(),
      gm: newBucket(),
      jj: newBucket(),
      done: false,
    };
    galleryEl.innerHTML = "";
    moreBtn.hidden = true;
    moreSearchBtn.hidden = true;
    abortCtrl = new AbortController();

    try {
      await scrapeBobae(plan, session.bob, plan.take);
      await scrapeGamemeca(plan, session.gm, plan.take);
      await scrapeJjtv(plan, session.jj, plan.take);
      refreshSessionDone();

      setRunning(false);
      if (!allItems.length) {
        setStatus("해당 기간 이미지를 못 모았어. 다시 검색 눌러봐.", "error");
        updateFooterBtns();
        return;
      }
      if (visibleCount === 0) {
        visibleCount = Math.min(PAGE_SIZE, allItems.length);
      }
      renderVisible(true);
      setStatus(
        plan.label +
          " · 조회수순 · 확보 " +
          allItems.length +
          "장 · 화면 " +
          visibleCount +
          "장",
        "ok"
      );
    } catch (e) {
      setRunning(false);
      refreshSessionDone();
      if (e.name === "AbortError" || e.message === "STOPPED") {
        if (visibleCount === 0 && allItems.length) {
          visibleCount = Math.min(PAGE_SIZE, allItems.length);
        }
        renderVisible(true);
        setStatus(
          "중지 · 확보 " + allItems.length + "장 · 화면 " + visibleCount + "장",
          "ok"
        );
        return;
      }
      setStatus("오류: " + (e.message || e), "error");
      updateFooterBtns();
    }
  }

  async function runMoreSearch() {
    if (!session || session.done) return;
    var plan = session.plan;
    var beforeCount = allItems.length;
    setStatus("추가검색 · 다음 조회수 자료 수집 중...", "");
    setRunning(true);
    abortCtrl = new AbortController();

    try {
      await extendBobae(plan, session.bob);
      await extendGamemeca(plan, session.gm);
      await extendJjtv(plan, session.jj);
      refreshSessionDone();
      setRunning(false);

      var gained = allItems.length - beforeCount;
      if (!gained) {
        session.done = true;
        updateFooterBtns();
        setStatus(
          "더 이상 새 사진이 없어. 확보 " + allItems.length + "장",
          "ok"
        );
        return;
      }
      // 새로 모은 건 더보기로 이어서 보게
      renderVisible(true);
      setStatus(
        "추가검색 완료 · +" +
          gained +
          "장 · 확보 " +
          allItems.length +
          "장 · 화면 " +
          visibleCount +
          "장",
        "ok"
      );
      updateFooterBtns();
    } catch (e) {
      setRunning(false);
      refreshSessionDone();
      if (e.name === "AbortError" || e.message === "STOPPED") {
        renderVisible(true);
        setStatus(
          "중지 · 확보 " + allItems.length + "장 · 화면 " + visibleCount + "장",
          "ok"
        );
        return;
      }
      setStatus("오류: " + (e.message || e), "error");
      updateFooterBtns();
    }
  }

  searchBtn.addEventListener("click", function () {
    if (running) return;
    runSearch().catch(function (e) {
      setRunning(false);
      setStatus("오류: " + (e && e.message ? e.message : e), "error");
      updateFooterBtns();
    });
  });

  setStatus("");
})();
