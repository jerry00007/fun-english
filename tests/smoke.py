"""Smoke test: Fun English restructure acceptance checks.

Usage: python3 tests/smoke.py [URL_BASE]
Default URL_BASE: http://127.0.0.1:8765  (python3 -m http.server 8765)
Requires: playwright (chromium or system chrome).
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8765"
OUT = pathlib.Path("/var/folders/cj/sym8d02j35z6_q_nfdznjrtm0000gn/T/opencode/smoke")
OUT.mkdir(parents=True, exist_ok=True)

PASSED, FAILED = [], []


def check(name, ok, detail=""):
    (PASSED if ok else FAILED).append(name)
    print(("  PASS " if ok else "  FAIL ") + name + (f"  [{detail}]" if detail else ""))


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel="chrome")
        ctx = browser.new_context(viewport={"width": 834, "height": 1112})
        page = ctx.new_page()
        errors = []
        not_found = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("response", lambda r: not_found.append(r.url) if r.status == 404 else None)

        page.goto(BASE + "/index.html")
        page.wait_for_timeout(2000)

        print("== home stations ==")
        stations = page.locator(".station")
        check("4 stations rendered", stations.count() == 4, f"got {stations.count()}")
        check("brain station has sudoku launcher",
              page.locator(".station #sudokuCard").count() >= 1)
        titles = page.locator(".station-title").all_inner_texts()
        check("station titles", len([t for t in titles if t.strip()]) == 4, str(titles))

        print("== chips filter still flat ==")
        page.locator(".chip[data-cat='storybook']").click()
        page.wait_for_timeout(600)
        flat = page.locator(".course-grid .course-card").count()
        stations_after = page.locator(".station").count()
        check("filtered view = flat cards, no stations",
              flat == 3 and stations_after == 0, f"cards={flat} stations={stations_after}")
        page.locator(".chip[data-cat='all']").click()
        page.wait_for_timeout(600)

        print("== all courses x all modes render ==")
        course_ids = page.evaluate("COURSES.map(c => c.id)")
        check("14 courses defined", len(course_ids) == 14, str(course_ids))
        for cid in course_ids:
            page.goto(BASE + "/index.html#/course/" + cid)
            page.wait_for_timeout(900)
            modes = page.evaluate("COURSES.find(c=>c.id==='%s').modes" % cid)
            tabs = page.locator(".tab").count()
            check(f"{cid}: tabs==modes({len(modes)})", tabs == len(modes), f"tabs={tabs}")
            for m in modes:
                page.locator(f".tab[data-mode='{m}']").click()
                page.wait_for_timeout(500)
                n = page.locator("#modeContainer .game-wrap, #modeContainer .card-grid, "
                                 "#modeContainer .phonic-grid, #modeContainer .book, "
                                 "#modeContainer .talk-wrap, #modeContainer .quiz-box, "
                                 "#modeContainer .trace-wrap").count()
                check(f"{cid}/{m} renders", n >= 1, f"containers={n}")

        print("== dining-table slots: no overlap ==")
        page.goto(BASE + "/index.html#/course/setting-table")
        page.wait_for_timeout(900)
        page.locator(".tab[data-mode='game']").click()
        page.wait_for_timeout(800)
        slot_geo = page.evaluate("""() => {
          const table = document.querySelector('.table-obj');
          const tr = table.getBoundingClientRect();
          const out = [];
          table.querySelectorAll('.slot').forEach(s => {
            const r = s.getBoundingClientRect();
            out.push({en: s.dataset.word, cx: r.left + r.width/2 - tr.left,
                      cy: r.top + r.height/2 - tr.top, w: r.width});
          });
          const fs = parseFloat(getComputedStyle(table.querySelector('.slot')).fontSize);
          return {slots: out, table: {w: tr.width, h: tr.height}, ring: fs * 1.4};
        }""")
        slots, ring = slot_geo["slots"], slot_geo["ring"]
        overlaps = []
        for i in range(len(slots)):
            for j in range(i + 1, len(slots)):
                a, b = slots[i], slots[j]
                d = ((a["cx"] - b["cx"]) ** 2 + (a["cy"] - b["cy"]) ** 2) ** 0.5
                if d < ring * 0.95:
                    overlaps.append(f"{a['en']}~{b['en']}:{d:.0f}<{ring:.0f}")
        check("no slot ring overlap", not overlaps, "; ".join(overlaps))
        tw, th = slot_geo["table"]["w"], slot_geo["table"]["h"]
        edge = [s["en"] for s in slots
                if s["cx"] < ring / 2 - 6 or s["cx"] > tw - ring / 2 + 6
                or s["cy"] < ring / 2 - 6 or s["cy"] > th - ring / 2 + 6]
        check("all rings inside table", not edge, ",".join(edge))
        page.screenshot(path=str(OUT / "game_table.png"))

        print("== count-pop bubbles centered ==")
        page.goto(BASE + "/index.html#/course/how-many")
        page.wait_for_timeout(900)
        page.locator(".tab[data-mode='game']").click()
        page.wait_for_timeout(1200)
        bub = page.evaluate("""() => {
          const f = document.querySelector('.pop-field').getBoundingClientRect();
          const bs = [...document.querySelectorAll('.p-bubble')].map(b => {
            const r = b.getBoundingClientRect();
            const cs = getComputedStyle(b);
            return {l: (r.left - f.left)/f.width*100, r: (r.right - f.left)/f.width*100,
                    tilt: cs.getPropertyValue('--tilt')};
          });
          const l = Math.min(...bs.map(b => b.l)), r = Math.max(...bs.map(b => b.r));
          return {n: bs.length, left: l, right: r, mid: (l + r)/2,
                  tiltMax: Math.max(...bs.map(b => Math.abs(parseFloat(b.tilt))))};
        }""")
        check("bubble row midpoint ~50%", abs(bub["mid"] - 50) < 1.5, f"mid={bub['mid']:.1f}")
        check("edge breathing room >=3%", bub["left"] >= 3 and bub["right"] <= 97,
              f"L={bub['left']:.1f} R={bub['right']:.1f}")
        check("tilt capped ±4°", bub["tiltMax"] <= 4.1, f"max={bub['tiltMax']}")
        page.screenshot(path=str(OUT / "game_pop.png"))

        print("== memory game ==")
        page.goto(BASE + "/index.html#/course/what-is-it")
        page.wait_for_timeout(900)
        page.locator(".tab[data-mode='game']").click()
        page.wait_for_timeout(800)
        cards = page.locator(".mem-card").count()
        check("8 memory cards", cards == 8, f"got {cards}")
        page.locator(".mem-card").nth(0).click()
        page.wait_for_timeout(300)
        flipped = page.locator(".mem-card.flipped").count()
        check("flip works", flipped == 1, f"flipped={flipped}")
        en0 = page.locator(".mem-card").nth(0).get_attribute("data-en")
        for i in range(1, 8):
            if page.locator(".mem-card").nth(i).get_attribute("data-en") == en0:
                page.locator(".mem-card").nth(i).click()
                break
        page.wait_for_timeout(900)
        matched = page.locator(".mem-card.matched").count()
        check("match works", matched == 2, f"matched={matched}")
        page.screenshot(path=str(OUT / "game_memory.png"))

        print("== art: no unicode fallback for animals ==")
        art_ok = page.evaluate("""() => {
          const c = COURSES.find(x => x.id === 'what-is-it');
          return c.words.every(w => w.emoji.includes('<img'));
        }""")
        check("what-is-it all SVG art", art_ok)
        page.locator(".tab[data-mode='words']").click()
        page.wait_for_timeout(700)
        imgs = page.locator(".word-card .emoji img").count()
        check("words view renders 8 art imgs", imgs == 8, f"imgs={imgs}")
        page.screenshot(path=str(OUT / "art_words.png"))

        print("== trace on new courses ==")
        for cid in ["setting-table", "opw2-u3"]:
            page.goto(BASE + "/index.html#/course/" + cid)
            page.wait_for_timeout(800)
            tab = page.locator(".tab[data-mode='trace']")
            ok = tab.count() == 1
            if ok:
                tab.click()
                page.wait_for_timeout(700)
                ok = page.locator(".trace-wrap canvas").count() >= 1
            check(f"{cid} trace works", ok)

        print("== vowel skins ==")
        page.goto(BASE + "/index.html#/course/opw2-u6")
        page.wait_for_timeout(800)
        page.locator(".tab[data-mode='game']").click()
        page.wait_for_timeout(700)
        cls = page.evaluate("document.querySelector('.jump-grid').className")
        check("jump grid vowel class js-o", "js-o" in cls, cls)
        page.screenshot(path=str(OUT / "game_jump_vowel.png"))

        print("== star pools: words cap 3 ==")
        page.goto(BASE + "/index.html#/course/setting-table")
        page.wait_for_timeout(800)
        page.locator(".tab[data-mode='words']").click()
        page.wait_for_timeout(500)
        for i in range(6):
            page.locator(".word-card").nth(i).click()
            page.wait_for_timeout(180)
        sc = page.inner_text("#starCount")
        check("words capped at 3/14", sc.strip() == "3/14", sc.strip())
        total_icons = page.locator(".star-icons .star").count()
        check("star icons == 14", total_icons == 14, f"icons={total_icons}")

        print("== progress v1 -> v2 migration ==")
        ctx.clear_cookies()
        page.evaluate("""() => {
          localStorage.clear();
          localStorage.setItem('cwd_progress_v1', JSON.stringify({
            'setting-table': {stars: 6, total: 8, done: false, lastMode: 'words', ts: 1}
          }));
        }""")
        page.goto(BASE + "/index.html")
        page.wait_for_timeout(1500)
        v2 = page.evaluate("""() => {
          const raw = localStorage.getItem('cwd_progress_v2');
          return raw ? JSON.parse(raw)['setting-table'] : null;
        }""")
        check("v2 migrated", v2 is not None and v2.get("modes", {}).get("words") == 3,
              json.dumps(v2)[:120])
        v1_kept = page.evaluate("!!localStorage.getItem('cwd_progress_v1')")
        check("v1 preserved", v1_kept)

        print("== console errors ==")
        def is_favicon(m):
            loc = (m.location or {}).get("url", "") or ""
            return "favicon" in (loc + m.text).lower() if hasattr(m, "location") else "favicon" in m.text.lower()
        real = [m.text for m in errors if not is_favicon(m)] if errors and hasattr(errors[0], "location") else \
               [e for e in errors if "favicon" not in e.lower()]
        check("zero console/page errors", not real, "; ".join(real[:3]))
        if not_found:
            print("  404 URLs:", *not_found[:10], sep="\n    ")

        browser.close()

    print(f"\\nRESULT: {len(PASSED)} passed, {len(FAILED)} failed")
    if FAILED:
        print("FAILED:", *FAILED, sep="\\n  - ")
        sys.exit(1)


if __name__ == "__main__":
    main()
