"""
Snapshot proyek Cosmic Journey PER FASE (hemat token).
Hanya file yang benar-benar dibutuhkan AI untuk fase itu yang disertakan.

Pakai (jalankan dari root proyek):
  python build_context.py 8                 -> cosmic_context_before_phase_8.txt
  python build_context.py 9A                -> ..._9A.txt
  python build_context.py 12 --add "src/sections/*.module.css"   (tambah file untuk item 6)
  python build_context.py 10 --list         -> hanya tampilkan isi + ukuran, tanpa menulis
  python build_context.py --sizes           -> tabel perkiraan token semua fase
  python build_context.py 14 --full         -> snapshot penuh (perilaku lama, fase bebas)

Fase tersedia: 8, 9A, 9B, 10, 11A, 11B, 12, 13

Opsi lain:
  --add POLA          tambah file (glob), boleh berulang
  --exclude POLA      buang file (glob), boleh berulang
  --strip-comments    buang komentar JS satu baris dan komentar CSS (lebih hemat, tapi catatan desain ikut hilang)
  --max BYTE          batas ukuran per file (default 80000)

PENTING: jalankan skrip ini tepat sebelum membuka sesi fase tersebut, supaya
file baru dari fase sebelumnya (mis. komponen gerbang Fase 10) ikut terbaca.

Skrip hanya MEMBACA file proyek. File .env tidak pernah disertakan,
dan pola kunci rahasia (sb_secret_..., JWT) otomatis disensor.
"""
import argparse
import re
import sys
from datetime import datetime
from fnmatch import fnmatch
from pathlib import Path

ROOT = Path(".")
EXT = {".js", ".jsx", ".mjs", ".css", ".json", ".html", ".toml", ".sql"}
TOP_DIRS = {"src", "netlify", "supabase"}
SKIP_PARTS = {"node_modules", "dist", ".git", ".netlify", ".vite"}
SKIP_NAMES = {"package-lock.json"}

SECRET_PATTERNS = [
    re.compile(r"sb_secret_[A-Za-z0-9_\-]+"),
    re.compile(r"eyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}"),
]

# ─────────────────────────────────────────────────────────────
# MANIFEST PER FASE
#   full    : file disertakan utuh (glob, dibandingkan dengan path huruf kecil)
#   excerpt : hanya cuplikan CSS latar (rule pertama + lapisan inset:0 ber-background)
#   exclude : dibuang walau cocok dengan full
#   note    : pengingat untuk kamu (dicetak setelah build)
# Pola yang tidak cocok dengan file apa pun hanya diberi peringatan
# (mis. komponen baru yang memang belum dibuat).
# ─────────────────────────────────────────────────────────────
SEC = "src/sections/"
CMP = "src/components/"

PHASES = {
    "8": {
        "title": "Fondasi keterbacaan (token + kedalaman starfield)",
        "full": [
            "src/index.css",
            CMP + "StarField.jsx",
            "src/App.jsx",
            CMP + "HomeWarp.jsx",
        ],
        "excerpt": [SEC + "*.module.css"],
        "note": "CSS section hanya cuplikan latar, cukup untuk mendata risiko 'ganda redup'.",
    },
    "9A": {
        "title": "Terapkan token: Intro, Solar, Phenomena, DeepSpace, UniverseScale",
        "full": [
            "src/index.css",
            SEC + "Intro.jsx", SEC + "Intro.module.css",
            SEC + "SolarSystem.module.css",
            SEC + "Phenomena.jsx", SEC + "Phenomena.module.css",
            SEC + "DeepSpace.jsx", SEC + "DeepSpace.module.css",
            CMP + "UniverseScale.module.css",
            CMP + "universeScenes.jsx",
        ],
        "note": "SolarSystem.jsx (3D) sengaja tidak ikut. Jika perlu: --add \"src/sections/SolarSystem.jsx\".",
    },
    "9B": {
        "title": "Terapkan token: Ending, Wishing, Form, Secret, Gallery, popup, player, nav",
        "full": [
            "src/index.css",
            SEC + "Ending.jsx", SEC + "Ending.module.css",
            SEC + "Wishing.module.css",
            CMP + "WishForm.module.css",
            SEC + "SecretEnding.module.css",
            SEC + "Gallery.module.css",
            CMP + "FactPopup.jsx", CMP + "FactPopup.module.css",
            CMP + "MessageBox.jsx", CMP + "MessageBox.module.css",
            CMP + "MusicPlayer.module.css",
            CMP + "NavDots.jsx", CMP + "NavDots.module.css",
        ],
        "note": "JSX Wishing/WishForm/SecretEnding/Gallery/MusicPlayer tidak ikut (hanya CSS yang berubah). "
                "Jika AI butuh, tambahkan dengan --add.",
    },
    "10": {
        "title": "Gerbang masuk, audio mobile, teks Intro",
        "full": [
            "index.html",
            "src/main.jsx",
            "src/index.css",
            "src/App.jsx",
            "src/hooks/useAudio.js",
            "src/hooks/useSfx.js",
            CMP + "MusicPlayer.jsx",
            SEC + "Intro.jsx", SEC + "Intro.module.css",
        ],
    },
    "11A": {
        "title": "Copy pass: data, index.html, Intro, Solar, Phenomena, DeepSpace, scenes",
        "full": [
            "index.html",
            "src/data/index.js",
            SEC + "Intro.jsx",
            SEC + "SolarSystem.jsx",
            SEC + "Phenomena.jsx",
            SEC + "DeepSpace.jsx",
            CMP + "UniverseScale.jsx",
            CMP + "universeScenes.jsx",
            CMP + "*Gate*.jsx",
            SEC + "*Gate*.jsx",
        ],
        "note": "Pola *Gate* cocok dengan komponen gerbang dari Fase 10 (nama bebas).",
    },
    "11B": {
        "title": "Copy pass: Ending, Wishing, Form, Secret, Gallery, komponen, pesan error",
        "full": [
            SEC + "Ending.jsx",
            SEC + "Wishing.jsx",
            CMP + "WishForm.jsx",
            SEC + "SecretEnding.jsx",
            SEC + "Gallery.jsx",
            CMP + "FactPopup.jsx",
            CMP + "MessageBox.jsx",
            CMP + "MusicPlayer.jsx",
            CMP + "NavDots.jsx",
            CMP + "HomeWarp.jsx",
            "src/services/wishes.js",
            "netlify/functions/submit-wish.js",
            "netlify/functions/get-wishes.js",
            "src/data/dummyWishes.js",
        ],
        "note": "dummyWishes.js sudah tidak dipakai sejak Fase 6; buang dengan --exclude bila ingin lebih hemat.",
    },
    "12": {
        "title": "Ramah pembaca (MusicPlayer mini, Comfort, FactPopup, MessageBox, Phenomena)",
        "full": [
            "src/index.css",
            "src/App.jsx",
            CMP + "StarField.jsx",
            CMP + "MusicPlayer.jsx", CMP + "MusicPlayer.module.css",
            CMP + "FactPopup.jsx", CMP + "FactPopup.module.css",
            CMP + "MessageBox.jsx", CMP + "MessageBox.module.css",
            CMP + "NavDots.jsx", CMP + "NavDots.module.css",
            SEC + "Phenomena.jsx", SEC + "Phenomena.module.css",
        ],
        "note": "Untuk item 6 (jarak aman 360px tiap section): --add \"src/sections/*.module.css\".",
    },
    "13": {
        "title": "QA akhir pemolesan (hampir seluruh proyek)",
        "full": ["*"],
        "exclude": ["supabase/*", "src/data/dummyWishes.js", "vite.config.js"],
    },
}


def parse_args():
    ap = argparse.ArgumentParser(description="Bangun snapshot konteks proyek per fase.")
    ap.add_argument("phase", nargs="?", help="8, 9A, 9B, 10, 11A, 11B, 12, 13")
    ap.add_argument("--add", action="append", default=[], help="tambah file (glob), boleh berulang")
    ap.add_argument("--exclude", action="append", default=[], help="buang file (glob), boleh berulang")
    ap.add_argument("--max", type=int, default=80_000, help="batas byte per file (default 80000)")
    ap.add_argument("--strip-comments", action="store_true", help="buang komentar satu baris / komentar CSS")
    ap.add_argument("--full", action="store_true", help="abaikan manifest: snapshot penuh (perilaku lama)")
    ap.add_argument("--list", action="store_true", help="tampilkan isi snapshot saja, tanpa menulis")
    ap.add_argument("--sizes", action="store_true", help="tabel perkiraan token tiap fase")
    return ap.parse_args()


def is_project_file(p: Path) -> bool:
    if not p.is_file() or p.name.lower().startswith(".env"):
        return False
    if p.suffix not in EXT or p.name in SKIP_NAMES or SKIP_PARTS & set(p.parts):
        return False
    return len(p.parts) == 1 or p.parts[0] in TOP_DIRS


def collect():
    files = [p for p in ROOT.rglob("*") if is_project_file(p)]
    order = {"netlify": 1, "supabase": 2, "src": 3}
    files.sort(key=lambda p: (0 if len(p.parts) == 1 else order.get(p.parts[0], 9), p.as_posix().lower()))
    return files


def matches(posix: str, pats) -> bool:
    return any(fnmatch(posix, pat.lower()) for pat in pats)


def classify(p: Path, spec: dict, add, user_exclude):
    """Kembalikan 'full', 'excerpt', atau None (tidak disertakan)."""
    posix = p.as_posix().lower()
    if matches(posix, user_exclude):
        return None
    if matches(posix, add):
        return "full"
    if matches(posix, spec.get("exclude", [])):
        return None
    if matches(posix, spec.get("full", [])):
        return "full"
    if matches(posix, spec.get("excerpt", [])):
        return "excerpt"
    return None


def slim(text: str) -> str:
    text = "\n".join(line.rstrip() for line in text.splitlines())
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def strip_comments(text: str, suffix: str) -> str:
    if suffix == ".css":
        text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    elif suffix in {".js", ".jsx", ".mjs"}:
        text = "\n".join(l for l in text.splitlines() if not l.strip().startswith("//"))
    return slim(text)


_RULE = re.compile(r"([^{}]+)\{([^{}]*)\}")


def css_excerpt(text: str) -> str:
    """Rule pertama (akar section) + lapisan inset:0 yang punya background."""
    clean = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    out, first = [], True
    for m in _RULE.finditer(clean):
        sel = " ".join(m.group(1).split())
        body = " ".join(m.group(2).split())
        keep = first or ("background" in body and re.search(r"inset:\s*0", body))
        first = False
        if keep:
            decls = [d.strip() + ";" for d in body.split(";") if d.strip()]
            out.append(sel + " {\n  " + "\n  ".join(decls) + "\n}")
    head = "/* CUPLIKAN: hanya rule akar + lapisan latar (inset: 0 + background). BUKAN file lengkap. */"
    return head + "\n" + "\n\n".join(out)


def redact(text: str):
    count = 0
    for pat in SECRET_PATTERNS:
        text, n = pat.subn("[REDACTED]", text)
        count += n
    return text, count


def render(p: Path, mode: str, strip: bool):
    raw = p.read_text(encoding="utf-8", errors="replace")
    text = slim(raw)
    if mode == "excerpt":
        text = css_excerpt(text)
    elif strip:
        text = strip_comments(text, p.suffix)
    return redact(text)


def est_tokens(nbytes: int) -> int:
    return nbytes // 4


def build_phase(key, spec, files, args, write=True):
    add, user_ex = args.add, args.exclude
    chosen, omitted = [], []
    for p in files:
        mode = classify(p, spec, add, user_ex)
        (chosen if mode else omitted).append((p, mode))

    # peringatan pola tanpa file
    dead = []
    all_posix = [p.as_posix().lower() for p in files]
    for pat in spec.get("full", []) + spec.get("excerpt", []) + add:
        if pat != "*" and not any(fnmatch(x, pat.lower()) for x in all_posix):
            dead.append(pat)

    body, written, skipped, redacted = [], [], [], []
    for p, mode in chosen:
        if mode == "full" and p.stat().st_size > args.max:
            skipped.append(p.as_posix())
            continue
        try:
            text, n = render(p, mode, args.strip_comments)
        except OSError as e:
            skipped.append(f"{p.as_posix()} ({e})")
            continue
        if n:
            redacted.append(f"{p.as_posix()} ({n})")
        tag = " [CUPLIKAN]" if mode == "excerpt" else ""
        body.append(f"===== FILE: {p.as_posix()}{tag} =====\n{text}\n===== END FILE =====\n")
        written.append((p, mode))

    content = "\n".join(body)
    return {
        "written": written, "omitted": [p for p, _ in omitted], "skipped": skipped,
        "redacted": redacted, "dead": dead, "body": content, "bytes": len(content.encode("utf-8")),
    }


def write_snapshot(key, spec, res, label):
    out = Path(f"cosmic_context_before_phase_{key}.txt")
    with out.open("w", encoding="utf-8") as f:
        f.write("COSMIC JOURNEY: SNAPSHOT KODE (subset per fase, hemat token)\n")
        f.write(f"Dibuat: {datetime.now():%Y-%m-%d %H:%M}\n")
        f.write(f"Posisi: siap untuk mengerjakan FASE {key}" + (f" ({spec['title']})" if spec.get("title") else "") + "\n")
        f.write(f"{label}\n")
        f.write("File yang TIDAK tercantum di DAFTAR FILE sudah ada di proyek tetapi sengaja tidak disertakan.\n")
        f.write("Jangan mengarang isinya; jika butuh salah satunya, minta saya mengunggahnya.\n")
        f.write("File bertanda [CUPLIKAN] hanya berisi sebagian aturan CSS, bukan file lengkap.\n\n")
        f.write("DAFTAR FILE (disertakan):\n")
        for p, mode in res["written"]:
            f.write(f"- {p.as_posix()}{' [CUPLIKAN]' if mode == 'excerpt' else ''}\n")
        if res["omitted"]:
            f.write("\nFILE LAIN DI PROYEK (tidak disertakan):\n")
            f.write(", ".join(p.as_posix() for p in res["omitted"]) + "\n")
        f.write("\n" + "=" * 70 + "\n\n")
        f.write(res["body"])
    return out


def main():
    args = parse_args()
    if not (ROOT / "package.json").exists():
        sys.exit("package.json tidak ditemukan. Jalankan skrip ini dari root proyek.")

    files = collect()
    if not files:
        sys.exit("Tidak ada file proyek yang ditemukan.")

    if args.sizes:
        full_res = build_phase("all", {"full": ["*"]}, files, args)
        print(f"{'FASE':<6}{'FILE':>5}{'~TOKEN':>10}   JUDUL")
        for key, spec in PHASES.items():
            r = build_phase(key, spec, files, args)
            print(f"{key:<6}{len(r['written']):>5}{est_tokens(r['bytes']):>10,}   {spec['title']}")
        print(f"{'penuh':<6}{len(full_res['written']):>5}{est_tokens(full_res['bytes']):>10,}   (semua file, perilaku lama)")
        print("\nCatatan: file baru dari fase 10 dst belum ada, jadi angka fase akhir masih perkiraan.")
        return

    if not args.phase:
        sys.exit("Sebutkan fase: " + ", ".join(PHASES) + "  (atau --sizes untuk tabel ukuran)")

    key = args.phase.upper()
    if args.full:
        spec = {"title": "snapshot penuh", "full": ["*"]}
        label = "Snapshot ini berisi SELURUH file kode proyek, kondisi TERBARU."
    elif key in PHASES:
        spec = PHASES[key]
        label = "Snapshot ini hanya berisi file yang relevan untuk fase ini, kondisi TERBARU."
    else:
        sys.exit(f"Fase '{args.phase}' tidak ada di manifest. Pilih: {', '.join(PHASES)} (atau pakai --full).")

    res = build_phase(key, spec, files, args)
    if not res["written"]:
        sys.exit("Tidak ada file yang cocok. Periksa manifest atau pola --add.")

    if args.list:
        for p, mode in res["written"]:
            print(f"{p.stat().st_size:>8}  {p.as_posix()}{'  [cuplikan]' if mode == 'excerpt' else ''}")
        print(f"\n{len(res['written'])} file, ~{est_tokens(res['bytes']):,} token")
        return

    out = write_snapshot(key, spec, res, label)
    full_bytes = build_phase("all", {"full": ["*"]}, files, args)["bytes"]
    saved = 100 - round(res["bytes"] * 100 / max(full_bytes, 1))

    print(f"Selesai: {out} ({len(res['written'])} file, ~{est_tokens(res['bytes']):,} token, "
          f"hemat ±{saved}% dibanding snapshot penuh)")
    for p, mode in res["written"]:
        print(f"  + {p.as_posix()}{'  [cuplikan]' if mode == 'excerpt' else ''}")
    if res["dead"]:
        print("\nPola tanpa file (aman diabaikan jika filenya memang belum dibuat):")
        for d in res["dead"]:
            print(f"  ? {d}")
    if res["redacted"]:
        print("\nKunci rahasia disensor di:")
        for r in res["redacted"]:
            print(f"  * {r}")
    if res["skipped"]:
        print("\nDilewati (terlalu besar atau gagal dibaca; naikkan --max jika perlu):")
        for s in res["skipped"]:
            print(f"  - {s}")
    if spec.get("note"):
        print(f"\nCatatan fase {key}: {spec['note']}")


if __name__ == "__main__":
    main()
