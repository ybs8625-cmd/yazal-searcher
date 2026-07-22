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

  // 광고·트래킹·사이드바 이미지
  const AD_URL =
    /doubleclick|googlesyndication|googleadservices|googletag|adsense|pagead|adservice|amazon-adsystem|taboola|outbrain|adsrvr|adnxs|adcolony|advert|adsystem|adserver|adimg|ads\.|\/ads\/|\/ad\/|banner|sponsor|promo|tracking|pixel|analytics|scorecard|facebook\.com\/tr|criteo|moatads|imrworldwide|stickyad|popunder|popads|adfit|dable|realclick|adman|ad-cdn|adcdn|kaspersky|creativecdn|serving-sys|ad\.|adsales|adtech|yieldmo|pubmatic|openx|rubicon|casalemedia|ads-twitter|ads-api/i;

  // 본문 첨부/업로드로 보이는 경로 (가점)
  const CONTENT_PATH =
    /\/files?\/|\/attach|\/upload|\/uploads?\/|\/image\/|\/images\/|\/img\/|\/media\/|\/data\/|ncache\.|dcimg|ac\.namu\.la|namu\.la|hygall\.|ilbe\.com\/files|postfiles|blogfiles|editor|viewer|original|full/i;

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

  /** 광고/레이아웃 덩어리 제거 후 본문만 남김 */
  function extractArticleHtml(html) {
    var s = String(html || "");

    // 스크립트·스타일·noscript 제거
    s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
    s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
    s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

    // 광고/사이드/헤더/푸터 블록 제거
    s = s.replace(
      /<(aside|header|footer|nav)[\s\S]*?<\/\1>/gi,
      " "
    );
    s = s.replace(
      /<[^>]+(?:class|id)=["'][^"']*(?:ad-|ads|advert|sponsor|banner|sidebar|side-bar|recommend|related|popup|modal|cookie|gnb|lnb|footer|header|navi)[^"']*["'][^>]*>[\s\S]*?<\/[^>]+>/gi,
      " "
    );

    // 본문 후보 영역만 추출
    var chunks = [];
    var patterns = [
      /<article[\s\S]*?<\/article>/gi,
      /<(?:div|section)[^>]*(?:class|id)=["'][^"']*(?:article|content|write_div|view-content|post-content|board-content|reading|fr-view|viewer|entry-content|article_body|article-body|post_content|gall_view|writing_view|board-view)[^"']*["'][^>]*>[\s\S]*?<\/(?:div|section)>/gi,
    ];
    for (var p = 0; p < patterns.length; p++) {
      var m;
      var re = patterns[p];
      while ((m = re.exec(s))) {
        if (m[0] && m[0].length > 80) chunks.push(m[0]);
      }
    }

    if (chunks.length) {
      // 가장 긴 본문 덩어리 = 핵심 내용일 확률 높음
      chunks.sort(function (a, b) {
        return b.length - a.length;
      });
      return chunks.slice(0, 2).join("\n");
    }
    return s;
  }

  function isJunkOrAdUrl(u) {
    if (!u) return true;
    if (AD_URL.test(u) || URL_BAN.test(u)) return true;
    if (/sprite|icon|logo|emoji|avatar|profile|favicon|emoticon|stamp|button|badge|thumb_user|nickname|captcha/i.test(u))
      return true;
    // 너무 작은 이미지/썸네일 힌트
    if (/[?&](w|width|h|height)=(1|2|3|4|5|10|16|20|24|32|40|48|50|64)(\D|$)/i.test(u))
      return true;
    if (/(\/|=)(16x16|32x32|48x48|64x64|1x1|thumb_s|tiny|mini)(\/|$|\.)/i.test(u))
      return true;
    if (/data:image/i.test(u)) return true;
    return false;
  }

  function scoreContentImage(u) {
    var score = 0;
    if (CONTENT_PATH.test(u)) score += 40;
    if (/\.(jpe?g|gif)(\?|$)/i.test(u)) score += 15;
    if (/\.png(\?|$)/i.test(u)) score += 5;
    if (/original|full|large|big|attach|upload/i.test(u)) score += 20;
    if (/thumb|small|preview|resize|thumbnail|s\.jpg|_s\./i.test(u)) score -= 25;
    if (/ncache\.ilbe|dcimg|ac\.namu\.la|namu\.la|hygall/i.test(u)) score += 25;
    // 쿼리에 큰 사이즈
    if (/[?&](w|width)=(8|9|[1-9]\d{2,})/i.test(u)) score += 10;
    return score;
  }

  function extractImages(html, base, opts) {
    opts = opts || {};
    var onlyContent = opts.onlyContent !== false; // 기본: 본문만
    var body = onlyContent ? extractArticleHtml(html) : html;

    var scored = [];
    var seen = {};

    function push(raw) {
      var u = normalizeUrl(raw, base);
      if (!u) return;
      if (!/\.(jpe?g|png|webp|gif)(\?|$)/i.test(u.split("?")[0])) return;
      if (isJunkOrAdUrl(u)) return;
      u = u.split("#")[0];
      if (seen[u]) return;
      seen[u] = 1;
      var sc = scoreContentImage(u);
      // 본문 첨부 느낌이 거의 없으면 버림
      if (sc < 15) return;
      scored.push({ u: u, sc: sc });
    }

    var x;
    // lazy/original 우선 속성
    var re1 =
      /(?:data-original|data-url|data-src|data-lazy|data-orig-src|src)\s*=\s*["']([^"']+)["']/gi;
    while ((x = re1.exec(body))) push(x[1]);
    var re2 = /!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi;
    while ((x = re2.exec(body))) push(x[1]);
    var re3 =
      /https?:\/\/[^\s"'<>)\\]+?\.(?:jpe?g|png|webp|gif)(?:\?[^\s"'<>)\\]*)?/gi;
    while ((x = re3.exec(body))) push(x[0].replace(/[.,;)]+$/, ""));

    scored.sort(function (a, b) {
      return b.sc - a.sc;
    });

    // 글당 너무 많이 안 가져감 (광고 잔여 방지)
    var max = opts.max || 8;
    var out = [];
    for (var i = 0; i < scored.length && out.length < max; i++) {
      out.push(scored[i].u);
    }
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
            // 목록 페이지 이미지는 광고/썸네일 투성이라 절대 안 긁음
            setStatus(src.name + " · 글 " + found.length + "개 확보 (누적 " + posts.length + ")");
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
          // 본문(article) 핵심 사진만, 글당 최대 6장
          var imgs = extractImages(postHtml, post.href, {
            onlyContent: true,
            max: 6,
          });
          for (var k = 0; k < imgs.length; k++) {
            if (seenImg[imgs[k]]) continue;
            seenImg[imgs[k]] = 1;
            images.push(imgs[k]);
          }
          images.sort(function (a, b) {
            return (
              Number(/\.gif/i.test(b)) - Number(/\.gif/i.test(a)) ||
              scoreContentImage(b) - scoreContentImage(a)
            );
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
