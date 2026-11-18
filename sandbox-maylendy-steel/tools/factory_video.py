"""Shared, accessible on-site factory film for the home and manufacturing pages."""
from html import escape

VIDEO = 'assets/factory-workshop-maylendy.mp4'
POSTER = 'assets/factory-watermarked/factory-workshop-poster.jpg'


def factory_film(h, section_id='factory-film'):
    ident = escape(section_id, quote=True)
    player_id = ident + '-player'
    caption_id = ident + '-caption'
    heading = h['heading'](
        'Factory / Workshop film',
        'See the workshop.<br>Follow the making.',
        'A short film from our factory floor in Caitang, Chaozhou. See the equipment and everyday work behind your kitchenware.'
    )
    action = h['link']('manufacturing.html#workshop', 'Explore our manufacturing process') if section_id != 'workshop' else h['link']('contact.html?interest=factory-review', 'Discuss a factory review')
    return f'''<section class="section factory-film" id="{ident}"><div class="wrap">{heading}
<figure class="factory-film-figure"><div class="factory-film-grid">
<div class="factory-film-stage" data-factory-video>
<video id="{player_id}" class="factory-film-video" controls playsinline preload="none" width="1280" height="420" poster="{POSTER}" aria-label="MayLendy factory workshop film" aria-describedby="{caption_id}">
<source src="{VIDEO}" type="video/mp4">
Your browser does not support this video. <a href="{VIDEO}">Open the factory film</a>.
</video>
<button class="factory-film-play" type="button" data-factory-play aria-controls="{player_id}" hidden>{h['icon']('play')}<span>Play workshop video</span></button>
</div>
<aside class="factory-film-copy"><span class="eyebrow">FILMED AT OUR FACTORY</span><h3>A working view of your manufacturing partner.</h3><p>Watch the workshop in motion, then explore the process photographs and checkpoints relevant to your order.</p><ul><li>{h['icon']('check')}Workshop and equipment</li><li>{h['icon']('check')}Steel preparation</li><li>{h['icon']('check')}Press forming</li></ul>{action}</aside></div>
<p class="factory-film-error" data-factory-video-error role="status" hidden>The video could not start. <a href="{VIDEO}">Open the video directly</a> or try the player controls.</p>
<figcaption id="{caption_id}"><span>Factory walkthrough · Caitang, Chaozhou</span><span>34 sec · On-site footage</span></figcaption></figure>
</div></section>'''
