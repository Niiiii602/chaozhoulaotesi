"""Render the owner-supplied English buying guides through the site helpers.

Importing this module has no file-writing side effects. Call build_guides(helper)
with page, intro, heading, link, cta and canon from the site generator. Load
``guides.css`` after ``site.css``; every stylesheet selector is guide-scoped.
EDITORIAL_NOTES is for the owner's review only and is never rendered.
"""

from html import escape


STYLESHEET = "guides.css"
HUB_FILE = "buying-guides.html"
HUB_TITLE = "Stainless Steel Kitchenware Buying Guides"
HUB_DESCRIPTION = (
    "Compare stainless steel grades, tri-ply and single-layer cookware, and "
    "food-storage lids with practical selection tables and buyer checklists."
)
ORGANIZATION_ID = "https://maylendy.com/#organization"

# Paragraph numbers refer to the supplied DOCX's 99-paragraph text extraction.
# These notes are an internal handoff, not buyer-facing page content.
EDITORIAL_NOTES = (
    {
        "id": "source-and-scope",
        "source": "MayLendy_Stainless_Steel_Product_Guides_EN.docx, paragraphs 003–004, 086–089",
        "note": (
            "The guide copy supports initial selection, not a model specification, "
            "test report or destination-market compliance review. Map material and "
            "construction statements to current SKUs and components. Product/quality "
            "staff should confirm layer composition, thickness, coverage, cooktop "
            "compatibility and lid-care conditions against the product records."
        ),
    },
    {
        "id": "material-family-boundary",
        "source": "Owner's task instruction; DOCX paragraphs 008–026",
        "note": (
            "Food-storage bodies are limited to 304 stainless steel, 316L stainless "
            "steel or titanium, selected by model. The general 201 discussion applies "
            "only to specified cookware/kettles and must never imply a food-storage "
            "option. Titanium is a separate body material, not a stainless steel grade."
        ),
    },
    {
        "id": "tri-ply-2-2-mm",
        "source": "DOCX paragraphs 035–051",
        "note": (
            "The existing 2.2 mm tri-ply claim is unresolved: confirm whether the "
            "figure is total thickness or a layer measurement, the actual materials "
            "in every layer, and whether cladding covers the body or the base only. "
            "Also obtain finished weight, edge construction and exact-SKU cooktop "
            "evidence. The guide presents 2.2 mm only as a conditional quotation "
            "example and a buyer question; it does not verify an existing product "
            "claim or change the catalog. Aluminum is a common-design example, "
            "not a declared MayLendy layer composition."
        ),
    },
    {
        "id": "ms-material-and-lid-care",
        "source": "DOCX paragraphs 076–085",
        "note": (
            "The full material name behind MS and any coating have not been supplied. "
            "Do not expand the acronym or infer its composition. Obtain its full "
            "material specification, finish, matching models and separate care "
            "instructions. Confirm complete-product versus component dishwasher, "
            "microwave, freezer and oven permissions, tested temperature conditions, "
            "removable parts and leak-resistance test scope for each offered assembly. "
            "The guide uses MS only as the catalog label and makes no performance claim."
        ),
    },
    {
        "id": "claims-and-market-evidence",
        "source": "DOCX paragraphs 026, 088–090, 099",
        "note": (
            "Do not infer food-safe, rust-proof, salt-proof, leakproof or appliance "
            "claims from a material name or layer count. Keep food-contact and "
            "regulatory statements specific to the finished product and market. "
            "For the United States, FDA food-contact status depends on the substance, "
            "intended use and conditions of use; a grade label is not blanket authorization."
        ),
    },
    {
        "id": "references-and-placement",
        "source": "DOCX paragraphs 006, 028, 053, 091–099",
        "note": (
            "Link the guides from Buyer Questions and the relevant grade, cookware "
            "and storage families. Keep comparison text in crawlable HTML tables. "
            "The supplied technical-reference names have no URLs; they are listed "
            "without invented links and do not certify MayLendy products. No external "
            "reference text was retrieved or copied. The parent generator must load "
            "guides.css after site.css and register all four routes in its site outputs."
        ),
    },
)

REFERENCES = (
    "worldstainless, Categories, grades and product forms",
    "worldstainless, Design Guidelines for Stainless Steel in the Food and Beverage Industry",
    "British Stainless Steel Association, 304/304L and 316/316L composition and corrosion effects",
    "Tramontina, Tri-Ply Stainless Steel Cookware: construction and induction details",
    "U.S. FDA, Determining the Regulatory Status of Components of a Food Contact Material",
)

_GUIDES = (
    {
        "filename": "guide-steel-grades.html",
        "title": "Choosing Stainless Steel Grades",
        "description": (
            "Compare 201, 304 and 316L stainless steel by product and exposure. "
            "See MayLendy's food-storage material scope and four selection checks."
        ),
        "kicker": "Buying guide / Materials",
        "answer": (
            "Choose the grade specified for the product and its actual use conditions. "
            "304 may fit many everyday kitchenware applications; 316L may be considered "
            "where the specification calls for additional resistance to chloride-related "
            "localized corrosion. Consider 201 only for specified cookware or kettles "
            "with suitable service conditions."
        ),
        "summary": (
            "Compare 201, 304 and 316L by working environment and product specification, "
            "with a clear distinction between cookware and food-storage materials."
        ),
        "topics": ("Product and component grade", "Exposure and corrosion limits", "Destination-market evidence"),
    },
    {
        "filename": "guide-cookware-construction.html",
        "title": "Tri-Ply vs. Single-Layer Cookware",
        "description": (
            "Compare cookware construction, heating behavior, weight and cooktop "
            "compatibility, then check the exact model's layers, thickness and coverage."
        ),
        "kicker": "Buying guide / Cookware construction",
        "answer": (
            "Choose single-layer or tri-ply cookware against the model's verified "
            "cooking performance, weight, price and cooktop compatibility. "
            "Single-layer may suit a simpler construction; tri-ply may fit a requirement "
            "for a layered body or tested heat distribution. Layer count alone does "
            "not establish heating performance or induction compatibility."
        ),
        "summary": (
            "Compare construction, heating behavior and trade-offs, then read the "
            "layer materials, thickness and cladding coverage together."
        ),
        "topics": ("Construction and heating", "Thickness and cladding coverage", "Exact-model cooktop compatibility"),
    },
    {
        "filename": "guide-storage-lids.html",
        "title": "Choosing the Right Food Storage Lid",
        "description": (
            "Compare PP, silicone glass, silicone, clip, MS, steel and bamboo storage lids "
            "by compatible model, use conditions and component-specific care."
        ),
        "kicker": "Buying guide / Food-storage lids",
        "answer": (
            "Choose a lid that fits the exact container and the way it will be used. "
            "PP may suit a lightweight format, glass with a silicone surround may "
            "suit visibility, and pure silicone may suit a flexible lid profile. "
            "Material or closure style alone does not establish leak resistance, "
            "appliance suitability or a temperature limit."
        ),
        "summary": (
            "Compare five lid families, keeping model fit, cleaning, leak-resistance "
            "evidence and appliance permissions together."
        ),
        "topics": ("Lid and container fit", "Care for every component", "Leak resistance and appliance limits"),
    },
)

GUIDE_FILES = (HUB_FILE,) + tuple(guide["filename"] for guide in _GUIDES)

_GRADE_ROWS = (
    (
        "201",
        "Consider only for cookware or kettle models whose specification permits it "
        "and whose expected exposure is moderate. Confirm the exact grade and service conditions.",
        "Do not treat 201 as interchangeable with 304 or suitable for every wet, salty "
        "or aggressive-cleaning environment. Validate the exact product and intended "
        "use. It is not a MayLendy food-storage body option.",
    ),
    (
        "304",
        "A widely used general-purpose austenitic grade that may fit many everyday "
        "kitchenware applications when the product specification supports it.",
        "304 is not corrosion-proof. Chlorides, cleaning chemicals, surface condition, "
        "fabrication and exposure can affect performance.",
    ),
    (
        "316L",
        "Consider when the specification calls for additional resistance to "
        "chloride-related localized corrosion compared with 304, subject to product-specific review.",
        "316L is not immune to corrosion. The L denotes low carbon and is especially "
        "relevant to welding-related sensitization; it does not guarantee superior "
        "performance in every use.",
    ),
)

_COOKWARE_ROWS = (
    (
        "Construction",
        "A single metal layer forms the specified body or cooking surface. Confirm "
        "the alloy, thickness and whether the base uses a separate bonded disc.",
        "Three bonded metal layers are commonly used; layer materials and coverage "
        "vary. Confirm whether the body is fully clad or only the base is layered.",
    ),
    (
        "Heating behavior",
        "Performance depends on material, thickness, geometry and heat source. "
        "Use model-specific test results for claims about heating response.",
        "A conductive core, often aluminum in common designs, can change heat "
        "distribution. A particular result needs supporting model-level testing.",
    ),
    (
        "Potential fit",
        "May suit a simpler construction or a buyer's target price and weight when "
        "the model meets the required cooking performance.",
        "May suit programs that specify a layered body or require verified heating "
        "performance across the base or sidewalls.",
    ),
    (
        "Trade-offs",
        "May not meet a buyer's requirement for a layered conductive core or a "
        "particular tested heating profile.",
        "Can affect product weight, cost and construction details. Confirm finished "
        "weight, layer thickness and edge construction.",
    ),
    (
        "Cooktop compatibility",
        "Confirm compatibility for the exact SKU and intended cooktop.",
        "Tri-ply does not automatically mean induction-compatible. Verify the "
        "magnetic layer or base design and the SKU's compatibility test.",
    ),
)

_LID_ROWS = (
    (
        "Integrated PP lid",
        "A lightweight option for container models designed for this lid family.",
        "Use in a microwave, oven, freezer or dishwasher only if the exact lid model "
        "is approved for that use. Leak resistance needs a model-specific test.",
        "Wash and dry according to the model instructions. Keep away from direct "
        "heat unless the product is explicitly rated for it.",
    ),
    (
        "Glass lid with silicone surround",
        "May fit when visibility of stored contents is a priority and the matching "
        "container is specified for this lid.",
        "Glass can be damaged by impact. The glass component alone does not "
        "establish oven or microwave suitability for the complete assembly.",
        "Follow the instructions for both glass and silicone. Avoid sudden "
        "temperature changes unless the specific assembly is rated for them.",
    ),
    (
        "Pure silicone lid",
        "A flexible lid option for container models designed to accept its profile.",
        "Use only with compatible models. A flexible fit does not by itself "
        "establish a leakproof seal or suitability for heating.",
        "Clean and store as directed for the exact silicone component. Confirm "
        "appliance and temperature limits before use.",
    ),
    (
        "PP lid with detachable clips",
        "A closure format for models designed with clip components.",
        "Clip closure does not automatically mean leakproof. Do not force clips "
        "beyond their intended movement; confirm the relevant performance test.",
        "Clean the lid and clips as directed. Inspect clips for wear or damage "
        "and replace the component if the model instructions require it.",
    ),
    (
        "MS lid",
        "A clear-view lid option for a matching 01RC food-storage body.",
        "Confirm the full material specification, lid opening style and silicone gasket. Use only with the specified body and approved appliance conditions.",
        "Follow the care and temperature instructions for the exact lid and gasket; inspect the closure before use.",
    ),
    (
        "Stainless steel lid",
        "A metal-lid configuration for matching 04-series food-storage containers.",
        "A steel lid does not establish microwave suitability or compatibility across models. Confirm the complete body, lid and seal configuration.",
        "Follow the finish-specific cleaning instructions and dry after cleaning. Review the silicone gasket care separately.",
    ),
    (
        "Bamboo lid",
        "A bamboo-lid configuration for matching 04-series food-storage containers.",
        "Confirm the lid dimensions, finish and body fit. Bamboo does not establish appliance suitability or interchangeability across models.",
        "Use only the cleaning method validated for the exact bamboo or coated component, and follow its drying and storage instructions.",
    ),
)


def _section(helper, anchor, kicker, title, copy, content, soft=False):
    tone = " guide-section-soft" if soft else ""
    return (
        f'<section class="section guide-section{tone}" id="{escape(anchor)}">'
        '<div class="wrap">'
        + helper["heading"](escape(kicker), escape(title), escape(copy))
        + content
        + "</div></section>"
    )


def _table(anchor, caption, columns, rows, wide=False):
    """Keep full comparisons in native, keyboard-scrollable HTML tables."""
    hint_id = f"{anchor}-hint"
    caption_id = f"{anchor}-caption"
    table_class = "guide-table guide-table-wide" if wide else "guide-table"
    header = "".join(f'<th scope="col">{escape(column)}</th>' for column in columns)
    body = "".join(
        "<tr>"
        + f'<th scope="row">{escape(row[0])}</th>'
        + "".join(f"<td>{escape(cell)}</td>" for cell in row[1:])
        + "</tr>"
        for row in rows
    )
    return (
        f'<p class="guide-table-hint" id="{hint_id}">'
        "On smaller screens, scroll within the table to read all columns.</p>"
        '<div class="guide-table-scroll" role="region" tabindex="0" '
        f'aria-labelledby="{caption_id}" aria-describedby="{hint_id}">'
        f'<table class="{table_class}"><caption id="{caption_id}">{escape(caption)}</caption>'
        f"<thead><tr>{header}</tr></thead><tbody>{body}</tbody></table></div>"
    )


def _checklist(steps):
    return '<ol class="guide-checklist">' + "".join(
        f"<li><h3>{escape(title)}</h3><p>{escape(copy)}</p></li>" for title, copy in steps
    ) + "</ol>"


def _callout(title, copy):
    return (
        '<aside class="guide-callout">'
        f"<h3>{escape(title)}</h3><p>{escape(copy)}</p></aside>"
    )


def _related(helper, products, current):
    product_links = "".join(
        "<li>" + helper["link"](href, escape(label)) + "</li>" for href, label in products
    )
    guide_links = "".join(
        "<li>" + helper["link"](guide["filename"], escape(guide["title"])) + "</li>"
        for guide in _GUIDES if guide["filename"] != current
    )
    return _section(
        helper, "related-products", "Continue your selection", "Related products & buying help",
        "Use the product page to select a model, then match its specification to your brief.",
        '<div class="guide-related"><div><h3>Explore the products</h3>'
        f'<ul class="guide-link-list">{product_links}</ul></div>'
        '<div><h3>Read the related guides</h3>'
        f'<ul class="guide-link-list">{guide_links}<li>'
        + helper["link"](HUB_FILE, "All buying guides")
        + '</li></ul></div></div>',
        soft=True,
    )


def _references(indices):
    items = "".join(f"<li>{escape(REFERENCES[index])}</li>" for index in indices)
    return (
        '<section class="section guide-references" id="reading-references"><div class="wrap">'
        '<h2>Reading references provided with the guide</h2>'
        f'<ul>{items}</ul><p>These references support general selection principles only. '
        "They do not certify MayLendy products. Product specifications, care instructions "
        "and compliance status depend on the exact model records and applicable market "
        "requirements.</p></div></section>"
    )


def _article_start(helper, guide):
    nav_items = (
        ("#comparison", "Compare the options"),
        ("#buyer-checklist", "Four buyer checks"),
        ("#related-products", "Related products"),
        ("#reading-references", "Reading references"),
    )
    nav = '<nav class="guide-jump-links" aria-label="On this page">' + "".join(
        helper["link"](href, label) for href, label in nav_items
    ) + "</nav>"
    return (
        '<article class="guide-page guide-article">'
        + helper["intro"](
            guide["kicker"], escape(guide["title"]),
            '<strong class="guide-answer-label">The direct answer.</strong> ' + escape(guide["answer"]),
            helper["link"](HUB_FILE, "All buying guides"), cls="guide-intro",
        )
        + '<div class="wrap guide-reading-tools">'
        '<p class="guide-byline">By MayLendy · Kitchenware selection guide</p>'
        + nav + "</div>"
    )


def _grade_body(helper, guide):
    body = _article_start(helper, guide)
    body += _section(
        helper, "comparison", "Material comparison", "Match the grade to the job.",
        "The product, exposure and destination-market requirements guide the choice.",
        _callout(
            "MayLendy food-storage body options",
            "MayLendy food-storage bodies are offered in 304 stainless steel, 316L "
            "stainless steel or titanium, according to the model specification. Titanium "
            "is a separate body material, not a stainless steel grade. The 201 comparison "
            "below applies only to specified cookware and kettles; 201 is not a "
            "food-storage body option.",
        )
        + _table("grades", "201, 304 and 316L: potential fit and limits",
                 ("Grade", "When it may fit", "Limits and buyer checks"), _GRADE_ROWS),
    )
    body += _section(
        helper, "buyer-checklist", "Four buyer checks", "A practical material selection path.",
        "Choose from the approved specification after checking the actual use conditions.",
        _checklist((
            ("Identify the food-contact parts", "Identify the product and every part that "
             "contacts food. Confirm the declared grade or material for each relevant component."),
            ("Describe the working environment", "Record food type, contact time, cleaning "
             "method, moisture and exposure to salts or cleaning agents."),
            ("Match the evidence to your market", "Confirm the destination-market requirements "
             "and the evidence available for the finished product and intended use."),
            ("Select the documented grade", "Choose the grade from the approved product "
             "specification. A grade name alone is not proof of food-contact compliance."),
        ))
        + _callout(
            "A grade name is not a performance guarantee",
            "A 201, 304 or 316L label alone does not establish that a finished product "
            "is food safe, rust-proof or salt-proof. Review the product documentation "
            "and applicable market requirements for the claims you need.",
        ),
        soft=True,
    )
    body += _related(helper, (
        ("food-storage.html", "Food storage: 304, 316L or titanium"),
        ("cookware.html", "Cookware materials and construction"),
        ("kettles.html", "Specified stainless steel kettles"),
        ("buyer-questions.html#faq-materials", "Material questions & answers"),
    ), guide["filename"])
    body += _references((0, 1, 2, 4))
    body += helper["cta"](
        "Start with the product and its use.",
        "Send the model, food-contact components, intended use and destination market. "
        "Ask us for the material specification and the evidence relevant to your order.",
    )
    return body + "</article>"


def _cookware_body(helper, guide):
    body = _article_start(helper, guide)
    body += _section(
        helper, "comparison", "Construction comparison", "Look beyond the layer count.",
        "Use the verified product specification to compare performance, weight and cost.",
        _table("construction", "Single-layer and tri-ply cookware compared",
               ("Comparison", "Single-layer cookware", "Tri-ply cookware"), _COOKWARE_ROWS)
        + _callout(
            "Read the thickness together with the construction",
            "If a quotation gives a value such as 2.2 mm, ask whether it is the total "
            "thickness or a single-layer measurement. Request the material of every "
            "layer and confirm whether the cladding covers the body or the base only. "
            "That figure by itself does not identify the construction of a particular model.",
        ),
    )
    body += _section(
        helper, "buyer-checklist", "Four buyer checks", "Specify the complete cookware model.",
        "Bring the performance target and the construction details into the same discussion.",
        _checklist((
            ("Set the cooking requirements", "Describe the intended cooking use, heat source, "
             "performance targets, target price and acceptable finished weight."),
            ("Read the construction drawing", "Confirm every layer material, total thickness "
             "and individual layer thicknesses. Check full-body versus base-only coverage, "
             "any separate bonded disc and the edge construction."),
            ("Review the performance evidence", "Ask for model-specific evidence for the "
             "heating response or distribution you require. A conductive core in a common "
             "design does not verify the result for the model you are sourcing."),
            ("Confirm the exact cooktop match", "Verify the SKU's compatibility with the "
             "intended cooktop. For induction, check the magnetic layer or base design "
             "and the relevant compatibility test."),
        )),
        soft=True,
    )
    body += _related(helper, (
        ("cookware.html", "Explore stainless steel cookware"),
        ("products.html", "Browse the product catalog"),
        ("buyer-questions.html#faq-materials", "Material questions & answers"),
        ("buyer-questions.html#use-care", "Use & care questions"),
    ), guide["filename"])
    body += _references((0, 3))
    body += helper["cta"](
        "Compare the construction for your cookware brief.",
        "Send the cookware model, intended cooktop, performance targets and quantity. "
        "Ask us to confirm the drawing, layer materials, thickness, finished weight "
        "and compatibility for that SKU.",
    )
    return body + "</article>"


def _lid_body(helper, guide):
    body = _article_start(helper, guide)
    body += _section(
        helper, "comparison", "Lid comparison", "Choose the lid and body together.",
        "The matching model and each component's care instructions define the permitted use.",
        _table("lids", "Food-storage lid types, uses and care",
               ("Lid type", "When it may fit", "Limits and use conditions", "Care guidance"),
               _LID_ROWS, wide=True)
        + _callout(
            "Care follows the exact model",
            "Follow the care instructions supplied for your exact model. Appliance "
            "compatibility and temperature limits vary by component. Do not heat, "
            "freeze or dishwash a lid unless its product instructions expressly permit it.",
        ),
    )
    body += _section(
        helper, "buyer-checklist", "Four buyer checks", "Check the complete storage assembly.",
        "Review the body, lid and removable components as one specified configuration.",
        _checklist((
            ("Confirm the matching components", "Identify the container model, body material, "
             "lid profile and any seal or clip components. MayLendy food-storage body "
             "options are 304 stainless steel, 316L stainless steel or titanium, by model."),
            ("Check every appliance permission", "Confirm whether approval covers the "
             "complete product or only a removable component for dishwasher, microwave "
             "or freezer use. For oven use, obtain the tested temperature limit and "
             "conditions for every permitted component."),
            ("Keep the cleaning instructions", "Identify removable parts and how to clean "
             "and dry them. Follow material- and finish-specific care, including the "
             "instructions for glass, silicone, clips, bamboo or coated parts."),
            ("Match leak evidence to the model", "If leak resistance is required, request "
             "the applicable model test and its conditions. Neither a flexible lid "
             "nor a clip closure establishes a leakproof seal on its own."),
        )),
        soft=True,
    )
    body += _related(helper, (
        ("food-storage.html", "All food-storage containers"),
        ("storage-pp.html", "Integrated PP lid containers"),
        ("storage-glass.html", "Glass lids with silicone surrounds"),
        ("storage-silicone.html", "Pure silicone lid containers"),
        ("storage-clips.html", "PP lids with detachable clips"),
        ("storage-special.html", "MS, stainless steel & bamboo lid options"),
        ("buyer-questions.html#use-care", "Model-specific use & care answers"),
    ), guide["filename"])
    body += _references((1, 4))
    body += helper["cta"](
        "Find the lid that fits your storage range.",
        "Send the container model, preferred lid, intended use and destination market. "
        "Ask us for the matching configuration, component care instructions and "
        "the performance evidence relevant to your brief.",
    )
    return body + "</article>"


def _hub_body(helper):
    body = '<div class="guide-page guide-hub">' + helper["intro"](
        "Kitchenware buying guides", HUB_TITLE,
        "Compare the material, construction and lid against the product you are sourcing. "
        "Start with the relevant guide, then match your choices to the exact model, "
        "use conditions and destination market.",
        helper["link"]("#choose-a-guide", "Choose a guide"), cls="guide-intro",
    )
    cards = "".join(
        '<article class="guide-card">'
        f'<span class="eyebrow">{number:02d} / {escape(guide["kicker"].split(" / ")[1])}</span>'
        f'<h3>{escape(guide["title"])}</h3><p>{escape(guide["summary"])}</p>'
        '<ul class="guide-topics">'
        + "".join(f"<li>{escape(topic)}</li>" for topic in guide["topics"])
        + "</ul>" + helper["link"](guide["filename"], "Read the guide") + "</article>"
        for number, guide in enumerate(_GUIDES, start=1)
    )
    body += _section(
        helper, "choose-a-guide", "Three practical comparisons", "Start with your buying decision.",
        "Each guide includes a comparison table, four buyer checks and links to the relevant products.",
        '<div class="guide-card-grid">' + cards + "</div>",
    )
    body += _section(
        helper, "selection-brief", "A useful selection brief", "Bring four details to the discussion.",
        "These guides support initial selection. The exact model specification, test "
        "evidence and market requirements complete the decision.",
        _checklist((
            ("Product and model", "Name the product family and the model or configuration "
             "you want to compare, including its food-contact components."),
            ("Real use conditions", "Describe food contact, cleaning, moisture and the "
             "intended appliance or cooktop. Include the performance you need."),
            ("Material and construction", "Match the body, layers and lid to the model. "
             "MayLendy food-storage body options are 304 stainless steel, 316L stainless "
             "steel or titanium. 201 is considered only for specified cookware or kettles."),
            ("Market and evidence", "Identify the destination market and request the "
             "product specifications, relevant tests and component care instructions."),
        )),
        soft=True,
    )
    body += _section(
        helper, "related-products", "From guide to product", "Explore the range with a clear brief.",
        "Match the selection principles to the product you plan to source.",
        '<ul class="guide-link-list guide-hub-links">'
        + "".join("<li>" + helper["link"](href, label) + "</li>" for href, label in (
            ("food-storage.html", "Food-storage containers & lids"),
            ("cookware.html", "Cookware construction options"),
            ("kettles.html", "Stainless steel kettles"),
            ("products.html", "All product specifications"),
            ("buyer-questions.html#faq-materials", "Material questions & answers"),
            ("buyer-questions.html#use-care", "Use & care questions"),
        ))
        + "</ul>",
    )
    body += helper["cta"](
        "Turn your product questions into a sourcing brief.",
        "Tell us the product, model, intended use, quantity and destination market. "
        "We will work through the material, construction and care details with you.",
    )
    return body + "</div>"


def build_guides(helper):
    """Write the hub and three guides using the caller's page function.

    Required helpers: page, intro, heading, link, cta, canon. Returns a small
    integration report; editorial notes stay in Python and are never published.
    """
    page = helper["page"]
    canon = helper["canon"]
    hub_url = canon(HUB_FILE)
    listing_id = hub_url + "#guide-list"
    page(
        HUB_FILE, HUB_TITLE, HUB_DESCRIPTION, _hub_body(helper),
        active="products.html",
        extra=[
            {
                "@type": "CollectionPage", "@id": hub_url + "#webpage",
                "url": hub_url, "name": HUB_TITLE, "description": HUB_DESCRIPTION,
                "mainEntity": {"@id": listing_id}, "inLanguage": "en",
            },
            {
                "@type": "ItemList", "@id": listing_id, "name": HUB_TITLE,
                "numberOfItems": len(_GUIDES),
                "itemListElement": [
                    {"@type": "ListItem", "position": number,
                     "name": guide["title"], "url": canon(guide["filename"])}
                    for number, guide in enumerate(_GUIDES, start=1)
                ],
            },
        ],
    )
    for guide, renderer in zip(_GUIDES, (_grade_body, _cookware_body, _lid_body)):
        url = canon(guide["filename"])
        page(
            guide["filename"], guide["title"], guide["description"], renderer(helper, guide),
            active="products.html",
            extra=[{
                "@type": "Article", "@id": url + "#article", "url": url,
                "headline": guide["title"], "description": guide["description"],
                "mainEntityOfPage": {"@id": url + "#webpage"},
                "isPartOf": {"@id": hub_url + "#webpage"},
                "author": {"@id": ORGANIZATION_ID},
                "publisher": {"@id": ORGANIZATION_ID}, "inLanguage": "en",
            }],
        )
    return {"pages": GUIDE_FILES, "stylesheet": STYLESHEET, "editorial_notes": EDITORIAL_NOTES}
