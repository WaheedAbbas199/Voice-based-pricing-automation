#!/usr/bin/env python3
"""VoxPrice launcher — one command starts everything (database setup, backend API and the frontend):

    python main.py              # PostgreSQL from .env
    python main.py --sqlite     # quick try-out without PostgreSQL (file database in ./data)
    python main.py --help
"""
import argparse, importlib.util, os, socket, subprocess, sys, threading, time, webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VENV = ROOT / ".venv"
REQUIRED = [("fastapi", "fastapi"), ("uvicorn", "uvicorn"), ("sqlalchemy", "sqlalchemy"), ("psycopg", "psycopg"),
            ("multipart", "python-multipart"), ("google.genai", "google-genai")]


def say(msg=""):
    print(msg, flush=True)


def missing_packages():
    out = []
    for mod, pip in REQUIRED:
        try:
            if importlib.util.find_spec(mod) is None:
                out.append(pip)
        except (ImportError, ValueError):
            out.append(pip)
    return out


def in_venv():
    return sys.prefix != getattr(sys, "base_prefix", sys.prefix)


def ensure_dependencies(args):
    if not missing_packages():
        return
    if args.no_install:
        sys.exit("Missing packages: " + ", ".join(missing_packages()) + "\nRun: pip install -r requirements.txt")
    py = sys.executable
    if not in_venv():                                  # keep the system Python clean: install into ./.venv
        py = str(VENV / ("Scripts/python.exe" if os.name == "nt" else "bin/python"))
        if not Path(py).exists():
            say("Creating a virtual environment in .venv ...")
            subprocess.check_call([sys.executable, "-m", "venv", str(VENV)])
    say("Installing required packages (first run only, needs internet) ...")
    try:
        subprocess.check_call([py, "-m", "pip", "install", "--disable-pip-version-check", "-q", "-r", str(ROOT / "requirements.txt")])
    except subprocess.CalledProcessError:
        sys.exit("\nCould not install packages automatically. Run manually:\n  pip install -r requirements.txt")
    os.execv(py, [py, str(Path(__file__).resolve()), *sys.argv[1:], "--no-install"])


def ensure_env_file():
    env, example = ROOT / ".env", ROOT / ".env.example"
    if not env.exists() and example.exists():
        env.write_text(example.read_text(encoding="utf-8"), encoding="utf-8")
        say("Created .env from .env.example — open it to add your GEMINI_API_KEY and database settings.")


def ensure_database(url: str):
    """Make sure the PostgreSQL database exists (creates it when the user is allowed to)."""
    from sqlalchemy import create_engine, text
    from sqlalchemy.engine import make_url
    from sqlalchemy.exc import OperationalError
    u = make_url(url)
    if u.get_backend_name() != "postgresql":
        return
    try:
        with create_engine(u).connect():
            return
    except OperationalError as e:
        err = str(e)
        if "does not exist" not in err:
            sys.exit("\nCannot connect to PostgreSQL at %s:%s as '%s'.\n\n%s\n\nFix one of these:\n"
                     "  1. Start PostgreSQL (or run:  docker compose up -d db )\n"
                     "  2. Correct DATABASE_URL in the .env file\n"
                     "  3. Just want to try it?  python main.py --sqlite\n" % (u.host, u.port, u.username, err.strip().splitlines()[0]))
    say(f"Database '{u.database}' does not exist - creating it ...")
    try:
        admin = create_engine(u.set(database="postgres"), isolation_level="AUTOCOMMIT")
        with admin.connect() as c:
            c.execute(text('CREATE DATABASE "%s"' % u.database.replace('"', "")))
    except Exception as e:
        sys.exit(f"\nCould not create the database automatically ({str(e).strip().splitlines()[0]}).\nCreate it yourself:  createdb {u.database}")


def open_browser_when_ready(host, port):
    def run():
        for _ in range(80):
            try:
                socket.create_connection(("127.0.0.1", port), 0.5).close()
                break
            except OSError:
                time.sleep(0.25)
        webbrowser.open(f"http://localhost:{port}")
    threading.Thread(target=run, daemon=True).start()


def main():
    ap = argparse.ArgumentParser(description="Run the VoxPrice frontend + backend")
    ap.add_argument("--sqlite", action="store_true", help="use a local SQLite file instead of PostgreSQL (quick try-out)")
    ap.add_argument("--host"), ap.add_argument("--port", type=int)
    ap.add_argument("--no-browser", action="store_true")
    ap.add_argument("--no-install", action="store_true", help="do not auto-install missing packages")
    args = ap.parse_args()
    if sys.version_info < (3, 10):
        sys.exit("Python 3.10 or newer is required.")
    os.chdir(ROOT); sys.path.insert(0, str(ROOT))
    ensure_dependencies(args)
    ensure_env_file()
    if args.sqlite:
        (ROOT / "data").mkdir(exist_ok=True)
        os.environ["DATABASE_URL"] = "sqlite:///" + (ROOT / "data" / "voxprice.db").as_posix()
    from backend.config import settings           # loads .env
    host, port = args.host or settings.HOST, args.port or settings.PORT
    if not args.sqlite:
        ensure_database(settings.DATABASE_URL)
    import uvicorn
    say("\n" + "=" * 62 + "\n  VoxPrice is starting\n" + "=" * 62)
    say(f"  Open:      http://localhost:{port}")
    say(f"  Database:  {'SQLite file (data/voxprice.db)' if args.sqlite else 'PostgreSQL'}")
    say(f"  Gemini:    {'key found (model ' + settings.GEMINI_MODEL + ')' if settings.GEMINI_API_KEY else 'NO KEY - set GEMINI_API_KEY in .env to enable voice processing'}")
    say(f"  Admin:     {settings.ADMIN_EMAIL}  /  {settings.ADMIN_PASSWORD}   (change after first login)")
    say("  Stop:      Ctrl + C\n" + "=" * 62 + "\n")
    if not args.no_browser:
        open_browser_when_ready(host, port)
    uvicorn.run("backend.app:app", host=host, port=port, log_level="info")


if __name__ == "__main__":
    main()
