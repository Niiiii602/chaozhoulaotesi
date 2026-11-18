"""Explicitly opt in business metrics; product specifications stay static."""
from html import escape


def count_up(value, unit='', tag='strong'):
    if tag not in ('strong', 'span') or not isinstance(value, int) or value < 0:
        raise ValueError('Count-up metrics require a non-negative integer and a supported tag.')
    number = f'{value:,}'
    final = number + unit
    suffix = f'<span class="count-unit" aria-hidden="true">{escape(unit)}</span>' if unit else ''
    return (
        f'<{tag} class="count-up" data-count-to="{value}" data-count-duration="1000">'
        f'<span class="count-visual" aria-hidden="true" data-count-reserve="{number}">'
        f'<span data-count-value>{number}</span></span>{suffix}'
        f'<span class="sr-only" data-count-final>{escape(final)}</span></{tag}>'
    )
