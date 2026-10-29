from pathlib import Path

SKIP = {"node_modules", "dist", ".git"}
rows = []
for p in Path("src").rglob("*"):
    if p.is_file() and not SKIP & set(p.parts):
        rows.append((p.stat().st_size, p.as_posix()))
for size, path in sorted(rows, reverse=True)[:20]:
    print(f"{size/1024:7.1f} KB  {path}")