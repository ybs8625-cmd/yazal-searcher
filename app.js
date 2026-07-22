(() => {
  // 은꼴사·야짤로 유명한 곳 3곳만 고정 (선택 UI 없음)
  const SOURCES = [
    {
      name: "아카 야짤",
      site: "arca.live",
      urls: (range) => [
        `https://arca.live/b/yazzal?mode=best&sort=rating&range=${range}`,
        `https://arca.live/b/shade?mode=best&sort=rating&range=${range}`,
      ],
    },
    {
      name: "일베",
      site: "ilbe.com",
      urls: () => [
        "https://www.ilbe.com/search?keyword=%EC%95%BC%EC%A7%A4",
        "https://www.ilbe.com/search?keyword=%EC%9D%80%EA%BC%B4%EC%82%AC",
        "https://www.ilbe.com/search?keyword=%EC%9D%80%EA%BC%B4",
      ],
    },
    {
      name: "해연갤",
      site: "hygall.com",
      urls: () => [
        "https://hygall.com/?sort=hit",
        "https://hygall.com/search?keyword=%EC%9D%80%EA%BC%B4",
        "https://hygall.com/search?keyword=%EC%95%BC%EC%A7%A4",
      ],
    },
  ];

  const PERIODS = [
    { id: "day", ko: "일간", arca: "24h", take: 18 },
    { id: "week", ko: "주간", arca: "7d", take: 24 },
    { id: "month", ko: "월간", arca: "30d", take: 30 },
  ];

  // 제목에 하나라도 있어야 함
  const TITLE_OK = /야짤|은꼴사|은꼴|움짤|\bgif\b/i;
  // 애니/그림 제목 제외
  const TITLE_BAN =
    /애니|만화|일러스트|픽시브|pixiv|hentai|팬아트|동인|니케|블루아카|AI\s*그림|에이아이|2D|와후|waifu|단보루|젤보루|그림체/i;
  const URL_BAN =
    /pixiv|pximg|danbooru|donmai|gelbooru|sankaku|rule34|booru|zerochan|wixmp|deviantart|waifu|hentai|anime|manga|nhentai|civitai|novelai|aiart/i;

  let selectedPeriod = "day";
  let abortCtrl = null;
  let running = false;

  const periodsEl = document.getElementById("periods");
  const statusEl = document.getElementById("status");
  const galleryEl = document.getElementById("gallery");
  const searchBtn = document.getElementById("searchBtn");
  const stopBtn = document.getElementById("stopBtn");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");

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

  function period() {
    return PERIODS.find((p) => p.id === selectedPeriod) || PERIODS[0];
  }

  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = "status" + (kind ? ` ${kind}` : "");
  }

  function setRunning(on) {
    running = on;
    searchBtn.disabled = on;
    stopBtn.disabled = !on;
  }

  function thrownIfAborted() {
    if (abortCtrl?.signal?.aborted) {
      const e = new Error("STOPPED");
      e.name = "AbortError";
      throw e;
    }
  }

  async function fetchText(url) {
    thrownIfAborted();
    const r = await fetch("https://r.jina.ai/" + url, {
      signal: abortCtrl.signal,
      headers: {
        Accept: "text/html",
        "X-Return-Format": "html",
        "X-Timeout": "20",
      },
    });
    thrownIfAborted();
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.text();
  }

  function normalizeUrl(u, base) {
    if (!u) return null;
    let s = String(u).trim().replace(/&amp;/g, "&");
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
    return s;
  }

  function parseViews(chunk) {
    const m =
      chunk.match(/조회\s*수?\s*[:：]?\s*([\d,]+)/i) ||
      chunk.match(/views?\s*[:：]?\s*([\d,]+)/i) ||
      chunk.match(/\b([\d,]{3,7})\b/);
    return m ? parseInt(m[1].replace(/,/g, ""), 10) || 0 : 0;
  }

  function titleOk(title) {
    if (!title) return false;
    if (TITLE_BAN.test(title)) return false;
    return TITLE_OK.test(title);
  }

  function extractPosts(html, site, listUrl) {
    const posts = [];
    const seen = new Set();
    const re =
      /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>|\[([^\]]{2,160})\]\((https?:\/\/[^)]+)\)/gi;
    let m;
    while ((m = re.exec(html))) {
      let href = m[1] || m[4];
      let title = (m[2] || m[3] || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      href = normalizeUrl(href, listUrl);
      if (!href || !title || title.length < 2) continue;
      if (!href.includes(site)) continue;
      if (/search|login|join|notice|공지|\.css|\.js\b/i.test(href + title)) continue;
      if (!/\/\d{5,}|(view|article|post|bbs|board|b\/[^/]+\/\d+)/i.test(href)) continue;
      if (!titleOk(title)) continue;
      if (seen.has(href)) continue;
      const around = html.slice(Math.max(0, m.index - 60), Math.min(html.length, m.index + 260));
      seen.add(href);
      posts.push({ title, href, views: parseViews(around) });
    }
    return posts;
  }

  function extractImages(html, base) {
    const out = new Set();
    const push = (raw) => {
      const u = normalizeUrl(raw, base);
      if (!u) return;
      if (!/\.(jpe?g|png|webp|gif)(\?|$)/i.test(u.split("#")[0])) return;
      if (/sprite|icon|logo|emoji|avatar|banner|ads?|pixel|favicon|emoticon/i.test(u)) return;
      if (URL_BAN.test(u)) return;
      out.add(u.split("#")[0]);
    };
    for (const x of html.matchAll(
      /(?:src|data-src|data-original|data-lazy)\s*=\s*["']([^"']+)["']/gi
    )) {
      push(x[1]);
    }
    for (const x of html.matchAll(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi)) push(x[1]);
    for (const x of html.matchAll(
      /https?:\/\/[^\s"'<>)\\]+?\.(?:jpe?g|png|webp|gif)(?:\?[^\s"'<>)\\]*)?/gi
    )) {
      push(x[0].replace(/[.,;)]+$/, ""));
    }
    return [...out];
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
      btn.onclick = () => {
        lightboxImg.src = src;
        lightbox.hidden = false;
      };
      galleryEl.appendChild(btn);
    });
  }

  lightbox.onclick = () => {
    lightbox.hidden = true;
    lightboxImg.removeAttribute("src");
  };

  stopBtn.onclick = () => {
    if (!running || !abortCtrl) return;
    abortCtrl.abort();
    setStatus("중지됨", "ok");
    setRunning(false);
  };

  async function runSearch() {
    const p = period();
    abortCtrl = new AbortController();
    setRunning(true);
    galleryEl.innerHTML = "";

    const posts = [];
    const seenPost = new Set();
    const images = [];
    const seenImg = new Set();

    try {
      for (const src of SOURCES) {
        thrownIfAborted();
        setStatus(`${src.name} 목록 읽는 중...`);
        for (const url of src.urls(p.arca)) {
          thrownIfAborted();
          try {
            const html = await fetchText(url);
            for (const post of extractPosts(html, src.site, url)) {
              if (seenPost.has(post.href)) continue;
              seenPost.add(post.href);
              posts.push(post);
            }
          } catch (e) {
            if (e.name === "AbortError") throw e;
          }
        }
      }

      posts.sort((a, b) => b.views - a.views);
      const top = posts.slice(0, p.take);

      if (!top.length) {
        setStatus("제목에 야짤/은꼴 들어간 글을 못 찾았어.", "error");
        setRunning(false);
        return;
      }

      for (let i = 0; i < top.length; i++) {
        thrownIfAborted();
        const post = top[i];
        setStatus(`사진 수집 ${i + 1}/${top.length} · ${post.title.slice(0, 24)}`);
        try {
          const html = await fetchText(post.href);
          for (const img of extractImages(html, post.href)) {
            if (seenImg.has(img)) continue;
            seenImg.add(img);
            images.push(img);
          }
          images.sort((a, b) => Number(/\.gif/i.test(b)) - Number(/\.gif/i.test(a)));
          renderGallery(images);
        } catch (e) {
          if (e.name === "AbortError") throw e;
        }
      }

      setRunning(false);
      if (!images.length) {
        setStatus("글은 있는데 이미지가 안 잡혔어. 다시 눌러봐.", "error");
        return;
      }
      setStatus(`${p.ko} 상위 · 사진 ${images.length}장`, "ok");
    } catch (e) {
      setRunning(false);
      if (e.name === "AbortError" || e.message === "STOPPED") {
        renderGallery(images);
        setStatus(`중지 · ${images.length}장`, "ok");
        return;
      }
      setStatus("오류: " + (e.message || e), "error");
    }
  }

  searchBtn.onclick = () => {
    if (!running) runSearch();
  };
})();
