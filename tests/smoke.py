"""Check the local server from a new user's chosen port, using stdlib only."""
import json
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parents[1]
with socket.socket() as sock:
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
process = subprocess.Popen([sys.executable, str(root / "server.py"), "--port", str(port)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
base = f"http://127.0.0.1:{port}"
try:
    for attempt in range(40):
        try:
            urllib.request.urlopen(base, timeout=1).close()
            break
        except OSError:
            if process.poll() is not None:
                raise RuntimeError(process.stderr.read().decode())
            time.sleep(.05)
    else:
        raise RuntimeError("Server did not start")
    for path in ("/", "/app.js", "/styles.css", "/bundled-data.js", "/examples/words.csv", "/examples/words.json"):
        with urllib.request.urlopen(base + path, timeout=2) as response:
            assert response.status == 200 and response.read(), path
    with urllib.request.urlopen(base + "/runtime-config.js") as response:
        assert b"DICTATION_AUDIO_PROXY = true" in response.read()
        assert response.headers['Cache-Control'] == 'no-store'
    with urllib.request.urlopen(base + "/examples/words.json") as response:
        assert len(json.load(response)['words']) == 3
    for path, code in (("/.study-data.json",404),("/.git/config",404),("/server.py",404),("/api/audio?url=https%3A%2F%2F127.0.0.1%2Fsecret",400),("/api/audio?url=https%3A%2F%2Fdict.youdao.com%3Abad%2Fdictvoice",400)):
        try:
            urllib.request.urlopen(base + path)
            raise AssertionError(path)
        except urllib.error.HTTPError as error:
            assert error.code == code, (path, error.code)
    print("PASS: arbitrary port, all assets/examples, runtime proxy discovery, private paths and invalid proxy URLs")
finally:
    process.terminate()
    process.communicate(timeout=5)
