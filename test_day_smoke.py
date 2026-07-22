# -*- coding: utf-8 -*-
"""일/주/월/기간: 단일 하단버튼 + 더보기 후 이어붙이기 검증 (검증 후 중지로 단축)."""
import http.server
import os
import re
import sys
import threading
import time

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 8767


def start_server():
    os.chdir(ROOT)

    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass

    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def footer(page):
    btn = page.locator("#footerAction")
    if btn.count() == 0 or not btn.is_visible():
        return ""
    return (btn.inner_text() or "").strip()


def shots(page):
    return page.locator("#gallery .shot").count()


def stop_search(page):
    btn = page.locator("#stopBtn")
    if btn.count() and not btn.is_disabled():
        btn.click()
        page.wait_for_timeout(800)


def run_one(page, label, custom=False):
    print(f"\n=== {label} ===", flush=True)
    page.goto(f"http://127.0.0.1:{PORT}/", wait_until="domcontentloaded")
    assert page.inner_text("#ver").strip() == "7.5"
    page.locator("#periods .chip", has_text=label).click()
    if custom:
        page.wait_for_selector("#rangeBox:not([hidden])")
    page.click("#searchBtn")

    page.wait_for_function(
        """() => {
          const b = document.getElementById('footerAction');
          return !!(b && !b.hidden && (b.textContent || '').length);
        }""",
        timeout=30000,
    )
    t0 = footer(page)
    print("footer0", t0, flush=True)
    assert "검색중" in t0

    page.wait_for_function(
        "() => document.querySelectorAll('#gallery .shot').length >= 3",
        timeout=120000,
    )
    print("shots1", shots(page), "footer1", footer(page), flush=True)

    assert page.locator("#moreBtn").count() == 0
    assert page.locator("#searchProgress").count() == 0
    assert page.locator("#footerAction").count() == 1

    more_ok = False
    for i in range(45):
        page.wait_for_timeout(2000)
        t = footer(page)
        n = shots(page)
        running = page.locator("#searchBtn").is_disabled()
        print(f"tick{i} n={n} running={running} footer={t}", flush=True)

        # 이중 표기 금지: 버튼 텍스트에 둘 다 있으면 실패
        if "검색중" in t and "더보기" in t:
            raise AssertionError("검색중/더보기 동시 표기: " + t)

        if "더보기" in t:
            n0 = n
            page.click("#footerAction")
            page.wait_for_timeout(700)
            t2 = footer(page)
            n2 = shots(page)
            print(f"AFTER_MORE {n0}->{n2} footer={t2}", flush=True)
            assert n2 >= n0
            assert "더보기" not in t2 or "검색중" not in t2

            if "검색중" in t2:
                m = re.search(r"검색중\((\d+)/(\d+)\)", t2)
                assert m, t2
                assert int(m.group(2)) >= 60, "더보기 후 cap이 60 이상이어야 함"
                # 이어붙이기 확인
                ok = False
                for _ in range(25):
                    page.wait_for_timeout(2000)
                    n3 = shots(page)
                    t3 = footer(page)
                    print(f"grow n={n3} footer={t3}", flush=True)
                    if n3 > n2 or "더보기" in t3:
                        ok = True
                        break
                    if not page.locator("#searchBtn").is_disabled():
                        ok = n3 >= n2
                        break
                assert ok, "더보기 후 신규 사진이 이어지지 않음"
            more_ok = True
            break

        if not running:
            # 검색이 너무 빨리 끝남 — 최소 사진만 확인
            break

    stop_search(page)
    print(
        "DONE n=",
        shots(page),
        "footer=",
        footer(page),
        "more_tested=",
        more_ok,
        flush=True,
    )
    assert shots(page) >= 3
    # 일/주는 보통 더보기까지 감. 월/기간도 가능하면 통과, 못해도 단일버튼+표출이면 OK
    return more_ok


def main():
    httpd = start_server()
    time.sleep(0.2)
    failed = []
    more_flags = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        for label, custom in [
            ("일간", False),
            ("주간", False),
            ("월간", False),
            ("기간선택", True),
        ]:
            try:
                more_flags[label] = run_one(page, label, custom=custom)
                print(f"OK {label}", flush=True)
            except Exception as e:
                print(f"FAIL {label}: {e}", flush=True)
                failed.append(label)
                try:
                    page.screenshot(path=os.path.join(ROOT, f"fail_{label}.png"))
                except Exception:
                    pass
        browser.close()
    httpd.shutdown()
    print("MORE_FLAGS", more_flags, flush=True)
    # 일간·주간은 더보기 시나리오가 꼭 통과해야 함
    if not more_flags.get("일간") or not more_flags.get("주간"):
        print("FAIL: 일간/주간 더보기 시나리오 미검증", flush=True)
        sys.exit(1)
    if failed:
        print("FAILED", failed, flush=True)
        sys.exit(1)
    print("ALL OK", flush=True)


if __name__ == "__main__":
    main()
