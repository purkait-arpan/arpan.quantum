from __future__ import annotations

import json
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, unquote, urlparse

BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"
NOTES_DIR = BASE_DIR / "notes"
PORT = 8000

NOTES_DIR.mkdir(exist_ok=True)


def list_notes() -> dict:
    files = []
    for item in sorted(NOTES_DIR.iterdir(), key=lambda p: p.name.lower()):
        if item.is_file():
            stat = item.stat()
            suffix = item.suffix.lower().replace('.', '')
            files.append(
                {
                    "name": item.name,
                    "type": suffix.upper() if suffix else "FILE",
                    "size": stat.st_size,
                    "uploadedAt": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "url": f"/downloads/{quote(item.name)}",
                }
            )
    return {"count": len(files), "files": files}


class PortfolioHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        pathname = unquote(parsed.path)

        if pathname == "/api/notes":
            data = json.dumps(list_notes()).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        if pathname.startswith("/downloads/"):
            requested_name = pathname.replace("/downloads/", "", 1)
            safe_path = (NOTES_DIR / requested_name).resolve()
            try:
                safe_path.relative_to(NOTES_DIR.resolve())
            except ValueError:
                self.send_error(403, "Forbidden")
                return
            if not safe_path.exists() or not safe_path.is_file():
                self.send_error(404, "File not found")
                return
            self.send_response(200)
            self.send_header("Content-Type", "application/octet-stream")
            self.send_header("Content-Disposition", f'attachment; filename="{safe_path.name}"')
            self.send_header("Content-Length", str(safe_path.stat().st_size))
            self.end_headers()
            with safe_path.open("rb") as file:
                self.wfile.write(file.read())
            return

        if pathname in {"/", "/index.html"}:
            target = PUBLIC_DIR / "index.html"
        elif pathname in {"/notes", "/notes.html"}:
            target = PUBLIC_DIR / "notes.html"
        elif pathname in {"/styles.css", "/script.js"}:
            target = PUBLIC_DIR / pathname.lstrip("/")
        else:
            target = None

        if target is not None:
            if not target.exists() or not target.is_file():
                self.send_error(404, "File not found")
                return
            content = target.read_bytes()
            content_type = "text/html; charset=utf-8"
            if target.suffix == ".css":
                content_type = "text/css; charset=utf-8"
            elif target.suffix == ".js":
                content_type = "application/javascript; charset=utf-8"
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return

        self.send_error(404, "Page not found")

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    print(f"Portfolio running at http://localhost:{PORT}")
    print(f"Upload your notes to: {NOTES_DIR}")
    server = ThreadingHTTPServer(("0.0.0.0", PORT), PortfolioHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
    finally:
        server.server_close()
