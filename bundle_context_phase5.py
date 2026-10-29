"""
Snapshot HEMAT TOKEN untuk FASE 5: Poles dan QA
Pakai (dari root proyek):
  python bundle_context_phase5.py      -> semua src (besar)
  python bundle_context_phase5.py a    -> 5A: Wishing + form
  python bundle_context_phase5.py b    -> 5B: Secret Ending + HomeWarp
  python bundle_context_phase5.py c    -> 5C: Gallery + audio + navigasi
Hasil tiap bagian menimpa file sebelumnya; unggah satu bagian per sesi.
Hasil: cosmic_context_before_phase_5.txt
Skrip ini hanya MEMBACA file proyek.
"""
import re
import sys
from datetime import datetime
from fnmatch import fnmatch
from pathlib import Path

PHASE = "5"
ROOT = Path(".")
EXT = {".js", ".jsx", ".css", ".json", ".html", ".toml"}
SKIP_PARTS = {"node_modules", "dist", ".git"}
SKIP_NAMES = {"package-lock.json"}
MAX_BYTES = 60_000
ARGS = [a.lower() for a in sys.argv[1:]]
WITH_OPT = "--opt" in ARGS

# Pola dicocokkan ke path huruf kecil; "*" boleh mewakili "/".
GROUPS = {
    "a": [  # Wishing + form
        "*/wishing*", "*/wish*form*", "*/ending*", "*/services/wishes*", "*/starfield*",
        "*/factpopup*", "*/messagebox*",
    ],
    "b": [  # Secret Ending + HomeWarp
        "*/secretending*", "*/homewarp*", "*/ending*", "*/useaudio*",
    ],
    "c": [  # Gallery + audio + navigasi
        "*/gallery*", "*/services/wishes*", "*/data/dummywishes*", "*/navdots*",
        "*/progressbar*", "*/useaudio*", "*musicplayer*", "*audioplayer*",
    ],
}
COMMON = [
    "package.json",
    "src/app.*",
    "src/index.css",
    "*/styles/*",
    "*/variables.css",
    "*/global*.css",
    "*/usesfx*"
]


def all_files():
    out = []
    for p in sorted(ROOT.rglob("*")):
        if (
            p.is_file()
            and p.suffix in EXT
            and p.name not in SKIP_NAMES
            and not SKIP_PARTS & set(p.parts)
            and (p.parts[0] in ("src", "netlify") or len(p.parts) == 1)
        ):
            out.append(p)
    return out


def match(files, patterns):
    picked, missing = [], []
    for pat in patterns:
        hits = [f for f in files if fnmatch(f.as_posix().lower(), pat)]
        if not hits:
            missing.append(pat)
        for h in hits:
            if h not in picked:
                picked.append(h)
    return picked, missing


def slim(text):
    text = "\n".join(line.rstrip() for line in text.splitlines())
    return re.sub(r"\n{3,}", "\n\n", text).strip()


files = all_files()
part = next((a for a in ARGS if a in GROUPS), None)
if part:
    chosen, missing_req = match(files, COMMON + GROUPS[part])
    LABEL = f" (bagian 5{part.upper()})"
else:  # tanpa argumen: seluruh src (bisa besar)
    chosen = [f for f in files if f.parts[0] != "netlify"]
    missing_req = []
    LABEL = " (SEMUA file)"

out = Path(f"cosmic_context_before_phase_{PHASE}.txt")
skipped, body = [], []
for p in chosen:
    if p.stat().st_size > MAX_BYTES:
        skipped.append(p.as_posix())
        continue
    text = slim(p.read_text(encoding="utf-8", errors="replace"))
    body.append(f"===== FILE: {p.as_posix()} =====\n{text}\n===== END FILE =====\n")

written = [p for p in chosen if p.as_posix() not in skipped]
with out.open("w", encoding="utf-8") as f:
    f.write("COSMIC JOURNEY: SNAPSHOT KODE (versi hemat token)\n")
    f.write(f"Dibuat: {datetime.now():%Y-%m-%d %H:%M}\n")
    f.write(f"Posisi: siap untuk mengerjakan FASE {PHASE}{LABEL}\n")
    f.write("Snapshot ini berisi file yang relevan untuk fase ini, kondisi kode TERBARU.\n")
    f.write("File lain tidak disertakan; jika butuh, minta saya mengunggahnya.\n\n")
    f.write("DAFTAR FILE:\n")
    for p in written:
        f.write(f"- {p.as_posix()}\n")
    f.write("\n" + "=" * 70 + "\n\n")
    f.write("\n".join(body))

print(f"Selesai: {out} ({len(written)} file, ~{out.stat().st_size // 4:,} token)")
for p in written:
    print(f"  + {p.as_posix()}")
if missing_req:
    print("\nPola WAJIB tanpa file (mungkin belum ada / beda nama):")
    for m in missing_req:
        print(f"  ! {m}")
if skipped:
    print("\nDilewati karena terlalu besar (naikkan MAX_BYTES jika perlu):")
    for s in skipped:
        print(f"  - {s}")
