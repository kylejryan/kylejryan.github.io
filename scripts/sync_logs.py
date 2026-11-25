"""Run bun run sync:logs before publishing to refresh the checked-in archive."""
import json
import subprocess
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from html import escape, unescape
from pathlib import Path
from urllib.parse import urlsplit

LOGS = Path(__file__).resolve().parents[1] / "logs"
FEED = "https://www.adversarialsystems.com/feed"


def render(article):
    date = article["date"]
    fields = {k: escape(v) for k, v in article.items()}
    return f'''            <a class="log-entry" href="{fields['url']}" target="_blank" rel="noopener">
                <time class="log-time" datetime="{date}">{date.replace('-', '.')}</time>
                <div class="log-body">
                    <div class="log-cmd">cat {fields['filename']}</div>
                    <div class="log-output">{fields['title']}. {fields['description']}</div>
                    <div class="entry-source">{fields['source']}</div>
                </div>
            </a>'''


def main():
    data = LOGS / "articles.json"
    page = LOGS / "index.html"
    # RSS is a rolling window. Keep earlier articles and external publications.
    articles = {a["url"]: a for a in json.loads(data.read_text())}
    feed = subprocess.check_output(["curl", "-fsSL", "--max-time", "30", FEED])
    items = ET.fromstring(feed).findall("channel/item")
    if not items:
        raise ValueError("No articles in the RSS feed")
    for item in items:
        url = item.findtext("link").strip()
        parsed = urlsplit(url)
        if parsed.scheme != "https" or parsed.hostname != "www.adversarialsystems.com":
            raise ValueError(f"Unexpected article URL: {url}")
        filename = parsed.path.rstrip("/").split("/")[-1].replace("-", "_") + ".md"
        articles[url] = {
            "date": parsedate_to_datetime(item.findtext("pubDate")).date().isoformat(),
            "title": unescape(item.findtext("title")).strip(),
            "description": unescape(item.findtext("description")).strip(),
            "source": "Adversarial Systems",
            "url": url,
            "filename": articles.get(url, {}).get("filename", filename),
        }
    ordered = sorted(articles.values(), key=lambda a: a["date"], reverse=True)
    start, rest = page.read_text().split("<!-- BEGIN articles -->")
    _, end = rest.split("            <!-- END articles -->")
    entries = "\n\n".join(render(article) for article in ordered)
    page.write_text(f"{start}<!-- BEGIN articles -->\n{entries}\n            <!-- END articles -->{end}")
    data.write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
