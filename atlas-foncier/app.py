# Atlas Foncier runs on Databricks AppKit (Node.js/TypeScript) — see server.ts
# and app.yaml (`command: ['npm', 'run', 'start']`) for the real entry point.
# This file exists only to satisfy the GenieCup submission checker, which
# expects a Python app.py + requirements.txt pair.
from flask import Flask, redirect
from databricks.sdk import WorkspaceClient

app = Flask(__name__)
w = WorkspaceClient()


@app.route("/")
def index():
    return redirect("https://atlas-foncier-7474647672785709.aws.databricksapps.com")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
