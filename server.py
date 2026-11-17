#!/usr/bin/env python3
"""Optional local preview with a narrowly scoped dictionary audio proxy."""
import argparse
import urllib.error
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ALLOWED = {"dict.youdao.com": "/dictvoice", "ssl.gstatic.com": "/dictionary/static/sounds/"}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlsplit(self.path)
        if parsed.path == "/api/audio":
            url = urllib.parse.parse_qs(parsed.query).get("url", [""])[0]
            target = urllib.parse.urlsplit(url)
            if (target.scheme != "https" or target.hostname not in ALLOWED
                    or target.port not in (None, 443) or target.username
                    or not target.path.startswith(ALLOWED.get(target.hostname, "!"))):
                self.send_error(400, "Unsupported audio host")
                return
            try:
                request = urllib.request.Request(url, headers={"User-Agent": "DictationStudio/1.0"})
                with urllib.request.build_opener(NoRedirect).open(request, timeout=4) as response:
                    content_type = response.headers.get("Content-Type", "")
                    if not content_type.startswith(("audio/", "application/octet-stream")):
                        raise ValueError("Not audio")
                    body = response.read(5_000_001)
                    if not body or len(body) > 5_000_000:
                        raise ValueError("Invalid audio size")
                self.send_response(200)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except (OSError, ValueError, urllib.error.URLError):
                self.send_error(502, "Audio unavailable")
            return
        # Only serve public application assets, never code, dotfiles or backups.
        if parsed.path not in ("/", "/index.html", "/app.js", "/styles.css", "/bundled-data.js"):
            self.send_error(404)
            return
        super().do_GET()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=4174)
    args = parser.parse_args()
    print(f"Dictation Studio: http://127.0.0.1:{args.port}/", flush=True)
    ThreadingHTTPServer(("127.0.0.1", args.port), Handler).serve_forever()
