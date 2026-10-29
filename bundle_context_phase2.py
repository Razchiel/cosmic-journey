"""
Snapshot HEMAT TOKEN untuk FASE 2: Form permintaan
Hanya memuat file yang dibutuhkan AI untuk fase ini.

Pakai (jalankan dari root proyek):
  python bundle_context_phase2.py            -> hanya file WAJIB
  python bundle_context_phase2.py --opt      -> WAJIB + OPSIONAL (jika AI minta konteks tambahan)
Hasil: cosmic_context_before_2.txt  (nama sesuai aturan Master Context)
Skrip ini hanya MEMBACA file proyek.
"""
import re
import sys
from datetime import datetime
from fnmatch import fnmatch
from pathlib import Path

PHASE = "2"
ROOT = Path(".")
EXT = {".js", ".jsx", ".css", ".json", ".html", ".toml"}
SKIP_PARTS = {"node_modules", "dist", ".git"}
SKIP_NAMES = {"package-lock.json"}
MAX_BYTES = 60_000  # file lebih besar dilewati (mis. data base64)
WITH_OPT = "--opt" in sys.argv

# Pola dicocokkan ke path huruf kecil (pemisah "/"), "*" boleh mewakili "/".
REQUIRED = [
    "package.json",
    "src/app.*",
    "*/wishing*",
    "*/services/wishes*",
    "*/ending*",
    "*/usesfx*",
    "*/factpopup*",
    "*/messagebox*",
    "src/index.css",
    "*/styles/*",
    "*/variables.css",
    "*/global*.css",
]
OPTIONAL = [
    "*/navdots*",
    "*/progressbar*",
    "*/useaudio*",
    "index.html",
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
chosen, missing_req = match(files, REQUIRED)
if WITH_OPT:
    extra, _ = match(files, OPTIONAL)
    chosen += [e for e in extra if e not in chosen]

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
    f.write(f"Posisi: siap untuk mengerjakan FASE {PHASE}\n")
    f.write("Snapshot ini berisi HANYA file yang relevan untuk fase ini, kondisi kode TERBARU.\n")
    f.write("File lain di proyek tidak disertakan; jika butuh, minta saya mengunggahnya.\n\n")
    f.write("DAFTAR FILE:\n")
    for p in written:
        f.write(f"- {p.as_posix()}\n")
    f.write("\n" + "=" * 70 + "\n\n")
    f.write("\n".join(body))

size = out.stat().st_size
print(f"Selesai: {out} ({len(written)} file, ~{size // 4:,} token)")
for p in written:
    print(f"  + {p.as_posix()}")
if missing_req:
    print("\nPola WAJIB yang tidak menemukan file (mungkin belum dibuat / beda nama):")
    for m in missing_req:
        print(f"  ! {m}")
if skipped:
    print("\nDilewati karena terlalu besar (naikkan MAX_BYTES jika perlu):")
    for s in skipped:
        print(f"  - {s}")
if not WITH_OPT:
    print("\nTips: tambah --opt jika AI meminta konteks tambahan.")
