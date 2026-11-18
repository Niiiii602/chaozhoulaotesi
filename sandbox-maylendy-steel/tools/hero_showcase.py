"""Two frameless photo galleries with ordinary product links as the baseline."""
from pathlib import Path
import json
from html import escape

ROOT = Path(__file__).resolve().parents[1]
LANES = (("storage", "Food storage", 1), ("kitchen", "Cookware, kettles & serving", -1))


def markup(icon):
    """Keep the public markup(icon) signature used by the home-page generator."""
    items = json.loads((ROOT / "data/showcase-products.json").read_text(encoding="utf-8"))
    sections = []
    for lane_id, title, direction in LANES:
        products = [item for item in items if item.get("lane") == lane_id]
        first = products[0] if products else {"name": "Explore the collection", "subtitle": "Stainless steel kitchenware", "href": "products.html"}
        links = "".join(
            f'<a class="showcase-dual-tile" href="{escape(item["href"])}" data-product-id="{escape(item["id"])}">'
            f'<img src="{escape(item["src"])}" alt="{escape(item["name"])}" decoding="async" draggable="false">'
            f'<span>{escape(item["name"])}</span></a>' for item in products
        )
        if not links:
            links = '<a class="showcase-dual-empty" href="products.html">Explore all stainless steel kitchenware</a>'
        sections.append(f'''<section class="showcase-dual-lane" data-showcase-lane="{lane_id}" data-direction="{direction}" aria-labelledby="showcase-{lane_id}-heading">
  <div class="showcase-dual-heading"><h2 id="showcase-{lane_id}-heading">{escape(title)}</h2><span class="showcase-dual-count" aria-hidden="true"><b data-showcase-number>{'01' if products else '00'}</b><span> / </span><span>{len(products):02d}</span></span></div>
  <div class="showcase-dual-stage" data-showcase-viewport role="group" aria-roledescription="product gallery" aria-label="{escape(title)}" aria-describedby="showcase-dual-help"><div class="showcase-dual-fallback" data-showcase-fallback>{links}</div></div>
  <div class="showcase-dual-caption"><a class="showcase-dual-selected" data-showcase-link href="{escape(first['href'])}"><span><small data-showcase-subtitle>{escape(first['subtitle'])}</small><strong data-showcase-title>{escape(first['name'])}</strong></span>{icon()}</a><div class="showcase-dual-controls" role="group" aria-label="{escape(title)} controls" hidden><button type="button" data-showcase-prev aria-label="Previous {escape(title.lower())} product">{icon('chevron-left')}</button><button type="button" data-showcase-next aria-label="Next {escape(title.lower())} product">{icon('chevron-right')}</button></div></div>
</section>''')
    return f'''<div class="showcase-dual" data-showcase role="group" aria-label="Explore stainless steel kitchenware">
{''.join(sections)}
<div class="showcase-dual-toolbar"><span data-showcase-hint>Swipe to explore each collection</span><button class="showcase-dual-pause" type="button" data-showcase-pause aria-label="Pause both product galleries" aria-pressed="false" hidden><span data-showcase-pause-icon>{icon('pause')}</span><span data-showcase-pause-label>Pause motion</span></button></div>
<p id="showcase-dual-help" class="sr-only">Two product collections. Use the previous and next buttons, or focus a gallery and use left and right arrow keys. Drag horizontally to explore. Press Space to pause both galleries, and Enter to open the centered product.</p>
<span class="sr-only" role="status" aria-live="polite" aria-atomic="true" data-showcase-announcement></span>
</div>'''
