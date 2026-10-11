"""Local dev server with GitHub Pages–style extensionless .html URLs."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("PORT", "8765"))


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?", 1)[0]
        local = self.translate_path(path)
        if not path.endswith("/") and not os.path.exists(local):
            ext = os.path.splitext(local)[1]
            if not ext and os.path.isfile(local + ".html"):
                query = self.path.split("?", 1)[1] if "?" in self.path else ""
                self.path = path + ".html" + (("?" + query) if query else "")
        return super().do_GET()


if __name__ == "__main__":
    os.chdir(ROOT)
    host = "127.0.0.1"
    httpd = ThreadingHTTPServer((host, PORT), Handler)
    print(f"Serving {ROOT}")
    print(f"  Home:  http://{host}:{PORT}/")
    print(f"  CMS:   http://{host}:{PORT}/cms/")
    print("Press Ctrl+C to stop.")
    httpd.serve_forever()
