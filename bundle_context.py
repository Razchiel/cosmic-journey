"""
Membuat satu file snapshot kode untuk diunggah ke sumber Gemini.

Pakai:  python bundle_context.py N
N = nomor fase BERIKUTNYA yang akan dikerjakan.
  python bundle_context.py 0   -> sebelum mengerjakan Fase 0
  python bundle_context.py 1   -> setelah Fase 0 selesai, sebelum Fase 1
  python bundle_context.py 2   -> setelah Fase 1 selesai, sebelum Fase 2
Hasil: cosmic_context_before_phase_N.txt
Skrip ini hanya MEMBACA file proyek, tidak mengubah apa pun.
"""
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(".")
INCLUDE_FILES = ["index.html", "vite.config.js", "package.json", "netlify.toml"]
INCLUDE_DIRS = ["src", "netlify"]  # folder yang belum ada otomatis dilewati
EXT = {".js", ".jsx", ".css", ".json", ".html", ".toml", ".sql"}
SKIP_PARTS = {"node_modules", "dist", ".git"}
SKIP_NAMES = {"package-lock.json"}
MAX_BYTES = 150_000  # lewati file raksasa (mis. data base64)

phase = sys.argv[1] if len(sys.argv) > 1 else "0"


def collect():
    files = []
    for name in INCLUDE_FILES:
        p = ROOT / name
        if p.is_file():
            files.append(p)
    for d in INCLUDE_DIRS:
        base = ROOT / d
        if not base.exists():
            continue
        for p in sorted(base.rglob("*")):
            if (
                p.is_file()
                and p.suffix in EXT
                and p.name not in SKIP_NAMES
                and not SKIP_PARTS & set(p.parts)
            ):
                files.append(p)
    return files


files = collect()
out = Path(f"cosmic_context_before_phase_{phase}.txt")
skipped = []
written = 0

with out.open("w", encoding="utf-8") as f:
    f.write("COSMIC JOURNEY: SNAPSHOT KODE\n")
    f.write(f"Dibuat: {datetime.now():%Y-%m-%d %H:%M}\n")
    f.write(f"Posisi: siap untuk mengerjakan FASE {phase}\n")
    f.write("Isi snapshot ini adalah kondisi kode TERBARU di proyek.\n\n")
    f.write("DAFTAR FILE:\n")
    for p in files:
        f.write(f"- {p.as_posix()}\n")
    f.write("\n" + "=" * 70 + "\n\n")
    for p in files:
        if p.stat().st_size > MAX_BYTES:
            skipped.append(p.as_posix())
            continue
        f.write(f"===== FILE: {p.as_posix()} =====\n")
        f.write(p.read_text(encoding="utf-8", errors="replace"))
        f.write("\n===== END FILE =====\n\n")
        written += 1

print(f"Selesai: {out} ({written} file)")
if skipped:
    print("Dilewati karena terlalu besar (naikkan MAX_BYTES jika perlu):")
    for s in skipped:
        print(f"- {s}")
