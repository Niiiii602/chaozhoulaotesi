(() => {
  const state = {
    activeModal: null,
    activeSeries: null,
    activeImageIndex: 0,
    reelTimer: null,
    reelElapsed: 0,
    reelIndex: 0,
    reelMode: "video",
  };

  /*
   * Product information is kept in one catalog so the grid, filters and
   * product modal always use the same series-level source of truth.
   * Capacities and dimensions come from the PDF catalog where available;
   * values marked "confirm by model" are intentionally left open for OEM
   * enquiries rather than presented as blanket specifications.
   */
  const productCategories = [
    {
      id: "storage",
      label: "Stainless Steel Food Storage Containers",
      shortLabel: "Food storage",
      description: "Recommended for meal prep, chilled storage and organized kitchens, with flexible sizes and lid options ready for OEM programs.",
      series: [
        {
          id: "storage-rc-pp-lid",
          category: "storage",
          title: "01RC rectangular containers / PP lid",
          eyebrow: "01RC series / matching PP lid",
          description: "A coordinated rectangular range with the same body profile and matching PP lid across 14 catalog models, from compact meal-prep sizes to large-format foodservice capacities.",
          images: [
            { src: "assets/catalog/storage-rc-400-ai.webp", alt: "01RC400 stainless steel food container with PP lid" },
            { src: "assets/catalog/storage-rc-550-ai.webp", alt: "01RC550 stainless steel food container with PP lid" },
            { src: "assets/catalog/storage-rc-650-ai.webp", alt: "01RC650 stainless steel food container with PP lid" },
            { src: "assets/catalog/storage-rc-1000-ai.webp", alt: "01RC1000 stainless steel food container with PP lid" },
            { src: "assets/catalog/storage-rc-1300-ai.webp", alt: "01RC1300 stainless steel food container with PP lid" },
            { src: "assets/catalog/storage-rc-2250-ai.webp", alt: "01RC2250 stainless steel food container with PP lid" },
            { src: "assets/catalog/storage-rc-2000-ai.webp", alt: "01RC2000 stainless steel food container with PP lid" },
            { src: "assets/catalog/storage-rc-2500-ai.webp", alt: "01RC2500 stainless steel food container with PP lid" },
            { src: "assets/catalog/storage-rc-4200-ai.webp", alt: "01RC4200 stainless steel food container with PP lid" },
            { src: "assets/catalog/storage-rc-3000-ai.webp", alt: "01RC3000 stainless steel food container with PP lid" },
            { src: "assets/catalog/storage-rc-5000-ai.webp", alt: "01RC5000 stainless steel food container with PP lid" },
            { src: "assets/catalog/storage-rc-6600-ai.webp", alt: "01RC6600 stainless steel food container with PP lid" },
            { src: "assets/catalog/storage-rc-2600-ai.webp", alt: "01RC2600 stainless steel food container with PP lid" },
            { src: "assets/catalog/storage-rc-3700-ai.webp", alt: "01RC3700 stainless steel food container with PP lid" },
          ],
          catalogTitle: "Stainless Steel Food Container with PP Lid",
          catalogKicker: "01RC / catalog models",
          catalogNote: "Catalog dimensions and capacities shown below. 304# and 316L# material options are available by model and project.",
          catalogModels: [
            { code: "01RC400", materials: ["304#", "316L#"], capacity: "400ml / 13.5oz / 1.7cup", size: "16.5 x 12.5 x 4.5cm", image: "assets/catalog/storage-rc-400-ai.webp", alt: "01RC400 stainless steel food container with PP lid" },
            { code: "01RC550", materials: ["304#", "316L#"], capacity: "550ml / 18.6oz / 2.3cup", size: "16.5 x 12.5 x 6cm", image: "assets/catalog/storage-rc-550-ai.webp", alt: "01RC550 stainless steel food container with PP lid" },
            { code: "01RC650", materials: ["304#", "316L#"], capacity: "650ml / 21.9oz / 2.7cup", size: "17.5 x 13 x 5.8cm", image: "assets/catalog/storage-rc-650-ai.webp", alt: "01RC650 stainless steel food container with PP lid" },
            { code: "01RC1000", materials: ["304#", "316L#"], capacity: "1000ml / 33.8oz / 4.2cup", size: "17.5 x 13 x 9.2cm", image: "assets/catalog/storage-rc-1000-ai.webp", alt: "01RC1000 stainless steel food container with PP lid" },
            { code: "01RC1300", materials: ["304#", "316L#"], capacity: "1300ml / 43.9oz / 5.5cup", size: "21.4 x 16.3 x 7.2cm", image: "assets/catalog/storage-rc-1300-ai.webp", alt: "01RC1300 stainless steel food container with PP lid" },
            { code: "01RC2250", materials: ["304#", "316L#"], capacity: "2250ml / 76oz / 9.5cup", size: "24.8 x 19.3 x 8.2cm", image: "assets/catalog/storage-rc-2250-ai.webp", alt: "01RC2250 stainless steel food container with PP lid" },
            { code: "01RC2000", materials: ["304#", "316L#"], capacity: "2000ml / 68oz / 8.4cup", size: "29.8 x 21.4 x 5.8cm", image: "assets/catalog/storage-rc-2000-ai.webp", alt: "01RC2000 stainless steel food container with PP lid" },
            { code: "01RC2500", materials: ["304#", "316L#"], capacity: "2500ml / 84oz / 10.6cup", size: "29.8 x 21.4 x 7cm", image: "assets/catalog/storage-rc-2500-ai.webp", alt: "01RC2500 stainless steel food container with PP lid" },
            { code: "01RC4200", materials: ["304#", "316L#"], capacity: "4200ml / 142oz / 17.8cup", size: "29.8 x 21.4 x 10.5cm", image: "assets/catalog/storage-rc-4200-ai.webp", alt: "01RC4200 stainless steel food container with PP lid" },
            { code: "01RC3000", materials: ["304#", "316L#"], capacity: "3000ml / 101oz / 12.7cup", size: "36.8 x 25.2 x 6.2cm", image: "assets/catalog/storage-rc-3000-ai.webp", alt: "01RC3000 stainless steel food container with PP lid" },
            { code: "01RC5000", materials: ["304#", "316L#"], capacity: "5000ml / 169oz / 21.1cup", size: "36.8 x 25.2 x 8.5cm", image: "assets/catalog/storage-rc-5000-ai.webp", alt: "01RC5000 stainless steel food container with PP lid" },
            { code: "01RC6600", materials: ["304#"], capacity: "6600ml / 223oz / 27.9cup", size: "36.8 x 25.2 x 11.3cm", image: "assets/catalog/storage-rc-6600-ai.webp", alt: "01RC6600 stainless steel food container with PP lid" },
            { code: "01RC2600", materials: ["304#", "316L#"], capacity: "2600ml / 88oz / 11cup", size: "38.8 x 16.5 x 7.5cm", image: "assets/catalog/storage-rc-2600-ai.webp", alt: "01RC2600 stainless steel food container with PP lid" },
            { code: "01RC3700", materials: ["304#", "316L#"], capacity: "3700ml / 125oz / 15.6cup", size: "38.8 x 16.5 x 10cm", image: "assets/catalog/storage-rc-3700-ai.webp", alt: "01RC3700 stainless steel food container with PP lid" },
          ],
          featureTiles: [
            {
              src: "assets/storage-feature-catalog-cover-v2.webp",
              alt: "Catalog cover showing stacked rectangular stainless steel food containers with matching lids",
              label: "01 / Stack",
              title: "Organized storage",
              caption: "Matching-lid formats stack neatly for shelf and fridge routines.",
            },
            {
              src: "assets/storage-feature-two-set-seal-v2.webp",
              alt: "Triple-seal design detail for a stainless steel food storage container",
              label: "02 / Seal detail",
              title: "Triple-seal design",
              caption: "The lid, silicone ring and raised edges help keep food contained.",
            },
            {
              src: "assets/storage-feature-two-set-hand-v3.webp",
              alt: "Hand holding a sealed stainless steel food storage container",
              label: "03 / Carry",
              title: "Carry-ready seal",
              caption: "A close-fitting lid helps protect meals on the move.",
            },
            {
              src: "assets/storage-feature-two-set-main-v5.webp",
              alt: "Stacked stainless steel food storage containers with matching clear lids",
              label: "04 / Daily use",
              title: "Stackable stainless bodies",
              caption: "Smooth edges, food-grade steel and durable lids for daily storage.",
            },
            {
              src: "assets/storage-feature-yellow-oven-v1.webp",
              alt: "Stainless steel food storage container being used in an oven",
              label: "05 / Compatibility",
              title: "Microwave safe*",
              caption: "Oven • dishwasher • refrigerator / freezer",
              note: "*Remove PP lid before heating.",
              variant: "compatibility",
            },
          ],
          specs: [
            { label: "Dimensions", value: "01RC400 16.5 x 12.5 x 4.5 cm; 01RC550 16.5 x 12.5 x 6 cm; 01RC650 17.5 x 13 x 5.8 cm; 01RC1000 17.5 x 13 x 9.2 cm; 01RC1300 21.4 x 16.3 x 7.2 cm; 01RC2250 24.8 x 19.3 x 8.2 cm; 01RC2000 29.8 x 21.4 x 5.8 cm; 01RC2500 29.8 x 21.4 x 7 cm; 01RC4200 29.8 x 21.4 x 10.5 cm; 01RC3000 36.8 x 25.2 x 6.2 cm; 01RC5000 36.8 x 25.2 x 8.5 cm; 01RC6600 36.8 x 25.2 x 11.3 cm; 01RC2600 38.8 x 16.5 x 7.5 cm; 01RC3700 38.8 x 16.5 x 10 cm" },
            { label: "Capacity", value: "400 / 550 / 650 / 1,000 / 1,300 / 2,000 / 2,250 / 2,500 / 2,600 / 3,000 / 3,700 / 4,200 / 5,000 / 6,600 ml (catalog models)" },
            { label: "Body material", value: "304# or 316L# stainless steel options shown in the catalog; confirm availability by model" },
            { label: "Lid material", value: "Matching PP lid" },
            { label: "Customization", value: "304# / 316L# grade, size, finish, lid color, seal, packaging and private label by project" },
          ],
          highlight: "One body shape, 14 catalog models from 400 to 6,600 ml",
          cardFacts: ["14 catalog models", "400-6,600 ml", "304# / 316L# options"],
        },
        {
          id: "storage-divided-lunch",
          category: "storage",
          title: "Rectangular PP-cover containers",
          eyebrow: "Rectangular format / PP cover",
          description: "Rectangular stainless containers with a matching PP cover, including the 650 ml variant shown in the product catalog. Final sizes are confirmed by model.",
          images: [
            { src: "assets/catalog/storage-divided.webp", alt: "650 ml rectangular stainless steel container with PP cover" },
            { src: "assets/catalog/storage-open-photo.webp", alt: "Open rectangular stainless steel container" },
            { src: "assets/catalog/storage-rc-1300.webp", alt: "Rectangular stainless steel container with matching PP lid" },
          ],
          specs: [
            { label: "Dimensions", value: "Confirm by model; 650 ml rectangular variant shown" },
            { label: "Capacity", value: "650 ml shown variant; other capacities available on request" },
            { label: "Body material", value: "304 stainless steel; grade options to confirm" },
            { label: "Lid material", value: "Matching PP cover" },
            { label: "Customization", value: "Material grade, size, cover color, finish, packaging and private label" },
          ],
          highlight: "650 ml rectangular variant shown",
          cardFacts: ["650 ml shown", "Rectangular body", "Matching PP cover"],
        },
        {
          id: "storage-multi-container-set",
          category: "storage",
          title: "Multi-functional container sets",
          eyebrow: "Set program / coordinated sizes",
          description: "Coordinated size combinations built around the same stainless body family for bundled retail and food-storage programs.",
          images: [
            { src: "assets/catalog/storage-set.webp", alt: "Multi-size stainless steel food storage container set" },
            { src: "assets/catalog/storage-stack-photo.webp", alt: "Stacked stainless steel food storage containers" },
            { src: "assets/catalog/storage-open-photo.webp", alt: "Open stainless steel storage set" },
          ],
          specs: [
            { label: "Dimensions", value: "Multiple sizes; confirm the selected set configuration" },
            { label: "Capacity", value: "Examples include 650 + 1,300 ml and 1,000 x 2 + 4,200 ml" },
            { label: "Body material", value: "304 / 316L stainless steel options; confirm by model" },
            { label: "Lid material", value: "PP lid combinations available by set" },
            { label: "Customization", value: "Material grade, set composition, insert, finish, carton and private label" },
          ],
          highlight: "Set composition tailored to the target shelf",
          cardFacts: ["Multi-size sets", "304 / 316L options", "Private-label pack-out"],
        },
        {
          id: "storage-round-lid",
          category: "storage",
          title: "Rectangular containers / alternate lids",
          eyebrow: "Rectangular body / steel or clear lid",
          description: "Rectangular stainless containers paired with alternate lid constructions, including steel-lid and clear-lid variants for different retail programs.",
          images: [
            { src: "assets/catalog/storage-round-580.webp", alt: "580 ml rectangular stainless steel container" },
            { src: "assets/catalog/storage-steel-lid.webp", alt: "1400 ml rectangular stainless steel container with steel lid" },
            { src: "assets/catalog/storage-stack-photo.webp", alt: "Stacked rectangular stainless steel containers" },
          ],
          specs: [
            { label: "Dimensions", value: "Confirm by model" },
            { label: "Capacity", value: "580 ml and 1,400 ml examples shown; other sizes on request" },
            { label: "Body material", value: "304 stainless steel; grade options to confirm" },
            { label: "Lid material", value: "Steel, clear or PP lid options by model" },
            { label: "Customization", value: "Material grade, size, lid type, finish, decoration and private label" },
          ],
          highlight: "Alternate lid constructions for a rectangular body",
          cardFacts: ["580 / 1,400 ml examples", "Rectangular formats", "Lid options"],
        },
      ],
    },
    {
      id: "cookware",
      label: "Stainless Steel Cookware",
      shortLabel: "Cookware",
      description: "Tri-ply and deep-draw cookware formats with documented base construction and configurable handles, lids and finishes.",
      series: [
        {
          id: "cookware-tri-ply",
          category: "cookware",
          title: "Tri-ply cookware",
          eyebrow: "Cookware / 2.2 mm tri-ply",
          description: "A coordinated cookware foundation for shallow fry pans and woks, built with durable 2.2 mm tri-ply construction for even heating and dependable everyday cooking.",
          images: [
            { src: "assets/cookware/tri-ply-pan-carousel-1.jpg", alt: "Tri-ply stainless steel frying pan on a cooktop" },
            { src: "assets/cookware/tri-ply-pan-carousel-2.jpg", alt: "Tri-ply frying pan with glass lid" },
            { src: "assets/cookware/tri-ply-pan-carousel-3.jpg", alt: "Tri-ply pan cooking performance" },
            { src: "assets/cookware/tri-ply-pan-carousel-4.jpg", alt: "Tri-ply stainless steel pan construction" },
            { src: "assets/cookware/tri-ply-pan-carousel-5.jpg", alt: "Tri-ply pan handle and finish details" },
          ],
          specs: [
            { label: "Dimensions", value: "Shallow pan 26 / 28 / 30 / 32 cm; wok 30 / 32 cm" },
            { label: "Usage", value: "Practical sizes for everyday frying and wok cooking" },
            { label: "Body material", value: "2.2 mm tri-ply stainless steel" },
            { label: "Lid material", value: "Glass lid" },
            { label: "Customization", value: "Tri-ply milk saucepans, soup pots, steamers, hot pots and divided hot pots" },
          ],
          highlight: "Reliable tri-ply performance for everyday cooking",
          cardFacts: ["2.2 mm tri-ply", "26-32 cm", "Lid / handle options"],
        },
        {
          id: "cookware-skillets",
          category: "cookware",
          title: "Single-layer stainless steel cookware",
          eyebrow: "Cookware / single-layer formats",
          description: "Versatile single-layer stainless steel cookware for everyday kitchens, with 201, 304 and 316 options, multiple diameters and fully customizable shapes and handles.",
          images: [
            { src: "assets/cookware/single-layer-pan-1.jpg", alt: "Single-layer stainless steel cookware" },
            { src: "assets/cookware/single-layer-pan-2.jpg", alt: "Single-layer stainless steel pot" },
            { src: "assets/cookware/single-layer-pan-3.jpg", alt: "Single-layer stainless steel pan" },
            { src: "assets/cookware/single-layer-pan-4.jpg", alt: "Single-layer cookware handle detail" },
            { src: "assets/cookware/single-layer-pan-5.jpg", alt: "Single-layer stainless steel cookware range" },
          ],
          specs: [
            { label: "Dimensions", value: "16 / 18 / 20 / 22 / 24 / 26 cm" },
            { label: "Capacity", value: "Sized for everyday cooking and serving" },
            { label: "Body material", value: "201 / 304 / 316 stainless steel" },
            { label: "Lid material", value: "Optional lid, selected by project" },
            { label: "Customization", value: "Custom shapes and handle designs available" },
          ],
          highlight: "Flexible materials, sizes and custom handle options",
          cardFacts: ["16-26 cm", "201 / 304 / 316", "Custom shape & handle"],
        },
      ],
    },
    {
      id: "plates",
      label: "Stainless Steel Serving Plates / Trays",
      shortLabel: "Serving plates",
      description: "Serving and compartment formats for catering, children and everyday tableware programs.",
      series: [
        {
          id: "plates-serving-compartment",
          category: "plates",
          title: "Compartment serving plates",
          eyebrow: "Serving plate / three-compartment",
          description: "A three-compartment stainless serving plate format suitable for portioned service, school meals and catering programs.",
          images: [
            { src: "assets/catalog/plate-clean.webp", alt: "Three-compartment stainless steel serving plate" },
            { src: "assets/catalog/plate-lifestyle.webp", alt: "Stainless steel serving plate in use" },
            { src: "assets/catalog/plate-collection.webp", alt: "Collection of stainless steel serving plates" },
            { src: "assets/catalog/plate-dimensions.webp", alt: "Stainless steel plate with dimension reference" },
          ],
          specs: [
            { label: "Dimensions", value: "23.5 x 18 cm (shown model)" },
            { label: "Capacity", value: "Compartment volume confirm by model" },
            { label: "Body material", value: "Stainless steel; grade to confirm by model" },
            { label: "Lid material", value: "No lid in shown serving format; cover options on request" },
            { label: "Customization", value: "Material grade, compartment layout, size, finish and private label" },
          ],
          highlight: "Three compartments / 160 g shown model",
          cardFacts: ["23.5 x 18 cm", "160 g shown model", "Three compartments"],
        },
      ],
    },
    {
      id: "kettles",
      label: "Stainless Steel Kettles",
      shortLabel: "Kettles",
      description: "Stainless kettle silhouettes shown for household and foodservice programs, with capacity and construction confirmed per model.",
      series: [
        {
          id: "kettles-household-range",
          category: "kettles",
          title: "Stainless kettle range",
          eyebrow: "Kettles / model-led specification",
          description: "High-quality, durable whistling kettles for export programs, made from 201 stainless steel and offered in five practical capacities.",
          images: [
            { src: "assets/catalog/kettle-white.webp", alt: "White stainless steel kettle" },
            { src: "assets/catalog/kettle-transparent.webp", alt: "Stainless steel kettle with transparent lid" },
            { src: "assets/catalog/kettle-lifestyle.webp", alt: "Stainless steel kettle in a kitchen setting" },
          ],
          specs: [
            { label: "Dimensions", value: "2.5L / 3.5L / 4.5L / 5.5L / 7.5L" },
            { label: "Capacity", value: "Five practical sizes for household and foodservice use" },
            { label: "Body material", value: "201 stainless steel" },
            { label: "Lid material", value: "Whistling lid and heat-safe handle" },
            { label: "Customization", value: "Capacity, finish, handle, packaging and private label" },
          ],
          highlight: "High-quality durable whistling kettles in five capacities",
          cardFacts: ["Model-led capacity", "Stainless body", "Handle / lid options"],
        },
      ],
    },
  ];

  /*
   * The PDF catalog's storage pages are laid out as a set of small, highly
   * scannable model blocks. Keep those blocks as data so the same renderer
   * can preserve the catalog order while still giving every model a useful
   * product-modal entry.
   */
  const catalogMaterials = ["304#", "316L#"];
  const makeCatalogModel = (code, capacity, size, image, materials = catalogMaterials, variant = "") => {
    const capacities = Array.isArray(capacity) ? capacity : [capacity];
    const sizes = Array.isArray(size) ? size : [size];
    const details = capacities.map((value, index) => ({ capacity: value, size: sizes[index] || sizes[sizes.length - 1] }));
    return {
      code,
      variant,
      materials: [...materials],
      capacity: capacities.join(" + "),
      size: sizes.join(" / "),
      details,
      image,
      alt: `${code} stainless steel food storage container`,
    };
  };

  const makeCatalogSeries = (group, featureTiles = []) => {
    const models = group.models || [];
    const setPanel = group.presentation === "set";
    const panelSeries = setPanel || group.presentation === "panel";
    return {
      id: group.id,
      category: "storage",
      presentation: group.presentation || "catalog",
      setPanel,
      panelSeries,
      title: group.title,
      eyebrow: group.eyebrow,
      description: group.description,
      images: models.map((model) => ({ src: model.image, alt: model.alt })),
      panelGallery: panelSeries,
      panelModels: panelSeries ? models : undefined,
      catalogTitle: group.title,
      catalogKicker: group.kicker,
      catalogNote: group.note,
      catalogModels: models,
      featureTiles,
      specs: group.panelSpecs || [
        { label: "Catalog source", value: `2026 electronic catalog / pages ${group.pages}` },
        { label: "Model count", value: `${models.length} catalog model${models.length === 1 ? "" : "s"}` },
        { label: "Body material", value: group.materialNote || "304# / 316L# stainless steel options shown by model" },
        { label: "Lid material", value: group.lidNote || "Matching PP lid / cover construction shown by model" },
        { label: "Customization", value: "Material grade, size, finish, lid color, seal, packaging and private label by project" },
      ],
      highlight: group.highlight || `${models.length} catalog models / specification-led OEM selection`,
      cardFacts: [`${models.length} catalog models`, "PDF dimensions shown", "OEM-ready formats"],
    };
  };

  const storageCatalogGroups = [
    {
      id: "storage-catalog-p02-01rc",
      pages: "2",
      kicker: "PDF P02 / 01RC series",
      title: "01RC rectangular containers / PP lid",
      eyebrow: "01RC series / matching PP lid",
      description: "The core 01RC rectangular range, shown in the PDF catalog from compact meal-prep sizes through large-format foodservice capacities.",
      note: "Catalog page 2 / 304# and 316L# options shown for each model.",
      highlight: "9 rectangular models from 400 to 4,200 ml",
      models: [
        makeCatalogModel("01RC400", "400ml / 13.5oz / 1.7cup", "16.5 x 12.5 x 4.5cm", "assets/catalog/storage-rc-400-warm.webp"),
        makeCatalogModel("01RC550", "550ml / 18.6oz / 2.3cup", "16.5 x 12.5 x 6cm", "assets/catalog/storage-rc-550-warm.webp"),
        makeCatalogModel("01RC650", "650ml / 21.9oz / 2.7cup", "17.5 x 13.5 x 6cm", "assets/catalog/storage-rc-650-warm.webp"),
        makeCatalogModel("01RC1000", "1000ml / 33.8oz / 4.2cup", "17.5 x 13 x 9.2cm", "assets/catalog/storage-rc-1000-warm.webp"),
        makeCatalogModel("01RC1300", "1300ml / 43.9oz / 5.5cup", "21.5 x 16.1 x 7.1cm", "assets/catalog/storage-rc-1300-warm.webp"),
        makeCatalogModel("01RC2250", "2250ml / 76oz / 9.5cup", "24.8 x 19.3 x 8.2cm", "assets/catalog/storage-rc-2250-warm.webp"),
        makeCatalogModel("01RC2000", "2000ml / 68oz / 8.4cup", "29.8 x 21.4 x 5.8cm", "assets/catalog/storage-rc-2000-warm.webp"),
        makeCatalogModel("01RC2500", "2500ml / 84oz / 10.6cup", "29.8 x 21.4 x 7.5cm", "assets/catalog/storage-rc-2500-warm.webp"),
        makeCatalogModel("01RC4200", "4200ml / 142oz / 17.8cup", "29.8 x 21.4 x 10.5cm", "assets/catalog/storage-rc-4200-warm.webp"),
      ],
    },
    {
      id: "storage-catalog-p03-01rc-sq",
      pages: "3",
      kicker: "PDF P03 / 01RC + 01SQ",
      title: "Large rectangular and square containers",
      eyebrow: "01RC / 01SQ series",
      description: "Large-format rectangular models continue alongside square formats for merchandising, prep and foodservice storage programs.",
      note: "Catalog page 3 / 01SQ4300 is shown with a 304# option; confirm grade by model.",
      highlight: "8 models across rectangular and square formats",
      models: [
        makeCatalogModel("01RC3000", "3000ml / 101oz / 12.7cup", "36.8 x 25.2 x 6.2cm", "assets/catalog/storage-rc-3000-ai.webp"),
        makeCatalogModel("01RC5000", "5000ml / 169oz / 21.1cup", "36.8 x 25.2 x 8.5cm", "assets/catalog/storage-rc-5000-ai.webp"),
        makeCatalogModel("01RC6600", "6600ml / 223oz / 27.9cup", "36.8 x 25.2 x 11.3cm", "assets/catalog/storage-rc-6600-ai.webp", ["304#"]),
        makeCatalogModel("01RC2600", "2600ml / 88oz / 11cup", "38.8 x 16.5 x 7.5cm", "assets/catalog/storage-rc-2600-ai.webp"),
        makeCatalogModel("01RC3700", "3700ml / 125oz / 15.6cup", "38.8 x 16.5 x 10cm", "assets/catalog/storage-rc-3700-ai.webp"),
        makeCatalogModel("01SQ400", "400ml / 14oz / 1.7cup", "12.3 x 12.3 x 7cm", "assets/catalog/storage-p03-sq400.webp"),
        makeCatalogModel("01SQ1000", "1000ml / 34oz / 4.2cup", "25.2 x 12.3 x 7cm", "assets/catalog/storage-p03-sq1000.webp"),
        makeCatalogModel("01SQ4300", "4300ml / 145oz / 18.2cup", "29 x 29 x 8.7cm", "assets/catalog/storage-p03-sq4300.webp", ["304#"]),
      ],
    },
    {
      id: "storage-catalog-p05-lunch",
      pages: "5",
      kicker: "PDF P05 / divided lunch boxes",
      title: "Lunch boxes with dividers / PP lid",
      eyebrow: "Bento format / divided body",
      description: "Compartmentalized stainless lunch boxes help keep flavors separate while supporting bento service and food-prep routines.",
      note: "Catalog page 5 / freezer-safe, dishwasher-safe and oven-safe claims shown for the container body.",
      highlight: "Divided formats for bento, meal prep and catering",
      models: [
        makeCatalogModel("01-SG450/280ml", "730ml / 25oz / 3.1cup", "21.5 x 16.5 x 5.8cm", "assets/catalog/storage-p05-sg450.webp"),
        makeCatalogModel("01-SSG400/280/280ml", "960ml / 32oz / 4.1cup", "25.2 x 19.5 x 5.7cm", "assets/catalog/storage-p05-ssg400.webp"),
        makeCatalogModel("01-CTXSSG1700ml", "1700ml / 57oz / 7.2cup", "38.8 x 16.5 x 5.8cm", "assets/catalog/storage-p05-ctxssg1700.webp"),
      ],
    },
    {
      id: "storage-catalog-p06-baking",
      pages: "6",
      kicker: "PDF P06 / baking dish formats",
      title: "PP-cover stainless steel baking dishes",
      eyebrow: "Baking dish / PP cover",
      description: "Deep rectangular baking-dish formats pair a stainless body with a practical PP cover for bake, chill, serve and store workflows.",
      note: "Catalog page 6 / 304# and 316L# options shown for each model.",
      highlight: "4 baking-dish formats from 2,000 to 5,000 ml",
      models: [
        makeCatalogModel("01-KP2000ml", "2000ml / 68oz / 8.5cup", "29.8 x 21.4 x 5.8cm", "assets/catalog/storage-p06-kp2000.webp"),
        makeCatalogModel("01-KP2500ml", "2500ml / 85oz / 10.6cup", "29.8 x 21.4 x 7cm", "assets/catalog/storage-p06-kp2500.webp"),
        makeCatalogModel("01-KP3000ml", "3000ml / 102oz / 12.7cup", "36.8 x 25.2 x 6.2cm", "assets/catalog/storage-p06-kp3000.webp"),
        makeCatalogModel("01-KP5000ml", "5000ml / 169oz / 21.1cup", "36.8 x 25.2 x 8.5cm", "assets/catalog/storage-p06-kp5000.webp"),
      ],
    },
    {
      id: "storage-catalog-p07-sets",
      pages: "7",
      presentation: "set",
      kicker: "PDF P07 / multi-functional sets",
      title: "Multi-functional food storage container sets",
      eyebrow: "01 series / coordinated sets",
      description: "Coordinated sets combine matching bodies and lids into retail-ready size programs for kitchens, meal prep and foodservice.",
      note: "Catalog page 7 / 304# and 316L# options shown for each set configuration.",
      highlight: "4 coordinated sets built around matching PP lids",
      models: [
        makeCatalogModel("01-BXH650/1300ml", ["650ml / 22oz / 2.7cup", "1300ml / 44oz / 5.5cup"], ["17.5 x 13 x 5.8cm", "21.5 x 16.1 x 7.1cm"], "assets/catalog/storage-p07-bxh650-1300.webp"),
        makeCatalogModel("01-BXH650/1300/2250ml", ["650ml / 22oz / 2.7cup", "1300ml / 44oz / 5.5cup", "2250ml / 76oz / 9.5cup"], ["17.5 x 13 x 5.8cm", "21.5 x 16.1 x 7.1cm", "24.8 x 19.3 x 8.2cm"], "assets/catalog/storage-p07-bxh650-1300-2250.webp"),
        makeCatalogModel("01-B01-BXH400*2/2000ml", ["400ml / 14oz / 1.7cup x 2", "2000ml / 68oz / 8.5cup"], ["16.5 x 12.5 x 4.5cm", "29.8 x 21.4 x 5.8cm"], "assets/catalog/storage-p07-b01-bxh400x2-2000.webp"),
        makeCatalogModel("01-KP650*2/2500ml", ["650ml / 22oz / 2.7cup x 2", "2500ml / 85oz / 10.6cup"], ["17.5 x 13 x 5.8cm", "29.8 x 21.4 x 7.5cm"], "assets/catalog/storage-p07-kp650x2-2500.webp"),
      ],
    },
    {
      id: "storage-catalog-p08-sets",
      pages: "8",
      presentation: "set",
      kicker: "PDF P08 / coordinated set formats",
      title: "Large-capacity container sets",
      eyebrow: "01 series / large-format sets",
      description: "Larger combinations extend the same matching-lid system into stackable pantry, refrigerator and catering configurations.",
      note: "Catalog page 8 / dimensions and capacities are listed per set component.",
      highlight: "4 multi-size sets for organized storage",
      models: [
        makeCatalogModel("01-BXH1000*2/4200ml", ["1000ml / 34oz / 4.2cup x 2", "4200ml / 142oz / 17.8cup"], ["17.5 x 13 x 9.2cm", "29.8 x 21.4 x 10.5cm"], "assets/catalog/storage-p08-bxh1000x2-4200.webp"),
        makeCatalogModel("01-KP650*2/1300*2/5000ml", ["650ml / 22oz / 2.7cup x 2", "1300ml / 44oz / 5.5cup x 2", "5000ml / 169oz / 21.1cup"], ["17.5 x 13 x 5.8cm", "21.5 x 16.1 x 7.1cm", "36.8 x 25.2 x 8.5cm"], "assets/catalog/storage-p08-kp650x2-1300x2-5000.webp"),
        makeCatalogModel("01-CTX650*2/2600ml", ["650ml / 22oz / 2.7cup x 2", "2600ml / 88oz / 11cup"], ["17.5 x 13 x 5.8cm", "38.8 x 16.5 x 7.5cm"], "assets/catalog/storage-p08-ctx650x2-2600.webp"),
        makeCatalogModel("01-CTX1000*2/3700ml", ["1000ml / 34oz / 4.2cup x 2", "3700ml / 125oz / 15.6cup"], ["17.5 x 13 x 9.2cm", "38.8 x 16.5 x 10.1cm"], "assets/catalog/storage-p08-ctx1000x2-3700.webp"),
      ],
    },
    {
      id: "storage-catalog-p09-sets",
      pages: "9",
      presentation: "set",
      kicker: "PDF P09 / square set formats",
      title: "Square and mixed-size storage sets",
      eyebrow: "01 series / square-base sets",
      description: "Square-base combinations create compact, modular programs for pantry organization, meal prep and bundled retail packs.",
      note: "Catalog page 9 / 304# and 316L# options shown for each configuration.",
      highlight: "3 mixed-size set configurations",
      models: [
        makeCatalogModel("01-KP400*2/1000/4300ml", ["400ml / 14oz / 1.7cup x 2", "1000ml / 34oz / 4.2cup", "4300ml / 145oz / 18.2cup"], ["12.3 x 12.3 x 7cm", "25.2 x 12.3 x 7cm", "29 x 29 x 8.7cm"], "assets/catalog/storage-p09-kp400x2-1000-4300.webp"),
        makeCatalogModel("01-KP1000*2/4300ml", ["1000ml / 34oz / 4.2cup x 2", "4300ml / 145oz / 18.2cup"], ["25.2 x 12.3 x 7cm", "29 x 29 x 8.7cm"], "assets/catalog/storage-p09-kp1000x2-4300.webp"),
        makeCatalogModel("01-KP400*4/4300ml", ["400ml / 14oz / 1.7cup x 4", "4300ml / 145oz / 18.2cup"], ["12.3 x 12.3 x 7cm", "29 x 29 x 8.7cm"], "assets/catalog/storage-p09-kp400x4-4300.webp"),
      ],
    },
    {
    id: "storage-catalog-p10-10rc",
    pages: "10",
    kicker: "PDF P10 / 10RC series",
    presentation: "panel",
    title: "10RC rectangular containers / silicone lid",
      eyebrow: "10RC series / silicone-lid profiles",
      description: "Two silicone-lid profiles provide practical 600, 900 and 1,200 ml formats for meal prep, food storage and everyday carrying. The blue lid adds a hanging hook, while the lower profile uses side heat-protection tabs for easier handling.",
      note: "Catalog page 10 / six pictured formats across two silicone-lid designs.",
    highlight: "Two silicone-lid designs: hanging hook and side heat-protection tabs",
    panelSpecs: [
      { label: "Lid Material", value: "Food-grade silicone" },
      { label: "Advantage", value: "Microwave, oven, freezer, dishwasher safe" },
      { label: "Custom Branding", value: "Available" },
      { label: "Standard", value: "FDA/LFGB/DGCCRF" },
      { label: "Usage", value: "Great For Meal Prep, Food Storage, Lunch Boxes, Or Leftovers." },
    ],
      models: [
        makeCatalogModel("10RC600", "600ml / 20.3oz / 2.5cup", "15.5 x 11.5 x 5.5cm", "assets/catalog/storage-p10-10rc600-a.webp", catalogMaterials, "Profile A"),
        makeCatalogModel("10RC900", "900ml / 30.4oz / 3.8cup", "18.3 x 12.4 x 5.8cm", "assets/catalog/storage-p10-10rc900-a.webp", catalogMaterials, "Profile A"),
        makeCatalogModel("10RC1200", "1200ml / 40.6oz / 5.1cup", "19.8 x 14.5 x 6cm", "assets/catalog/storage-p10-10rc1200-a.webp", catalogMaterials, "Profile A"),
        makeCatalogModel("10RC600", "600ml / 20.3oz / 2.5cup", "15.5 x 11.5 x 5.8cm", "assets/catalog/storage-p10-10rc600-b.webp", catalogMaterials, "Profile B"),
        makeCatalogModel("10RC900", "900ml / 30.4oz / 3.8cup", "18.3 x 12.5 x 5.9cm", "assets/catalog/storage-p10-10rc900-b.webp", catalogMaterials, "Profile B"),
        makeCatalogModel("10RC1200", "1200ml / 40.6oz / 5.1cup", "19.8 x 14.5 x 6cm", "assets/catalog/storage-p10-10rc1200-b.webp", catalogMaterials, "Profile B"),
      ],
    },
    {
      id: "storage-catalog-p11-round",
      pages: "11",
      kicker: "PDF P11 / 10R round series",
      presentation: "panel",
      title: "Silicone glass-lid storage containers",
      eyebrow: "10RC + 10R series / plastic-free lid options",
      description: "Rectangular and round stainless containers with silicone glass lids keep food visible while avoiding plastic contact. The complete container can be placed in the microwave for convenient reheating.",
      note: "Catalog pages 10-11 / 304# and 316L# options shown for each model.",
      highlight: "Plastic-free silicone glass lid: microwave-ready stainless container",
      panelSpecs: [
        { label: "Lid Material", value: "Silicone glass lid, plastic-free" },
        { label: "Advantage", value: "Entire container microwave safe; oven, freezer and dishwasher compatible" },
        { label: "Custom Branding", value: "Available" },
        { label: "Standard", value: "FDA/LFGB/DGCCRF" },
        { label: "Usage", value: "Ideal For Meal Prep, Reheating, Food Storage, Lunch Boxes, Or Leftovers." },
      ],
      models: [
        makeCatalogModel("10RC600", "600ml / 20.3oz / 2.5cup", "15.2 x 11.1 x 5.4cm", "assets/catalog/storage-p10-10rc600-c.webp", catalogMaterials, "Rectangular"),
        makeCatalogModel("10RC900", "900ml / 30.4oz / 3.8cup", "17.8 x 12.1 x 5.8cm", "assets/catalog/storage-p10-10rc900-c.webp", catalogMaterials, "Rectangular"),
        makeCatalogModel("10RC1200", "1200ml / 40.6oz / 5.1cup", "19.4 x 14.2 x 6cm", "assets/catalog/storage-p10-10rc1200-c.webp", catalogMaterials, "Rectangular"),
        makeCatalogModel("10r280", "280ml / 9.5oz / 1.2cup", "10 x 5.3cm", "assets/catalog/storage-p11-10r280.webp"),
        makeCatalogModel("10R630", "630ml / 21.3oz / 2.7cup", "12.8 x 6.5cm", "assets/catalog/storage-p11-10r630.webp"),
        makeCatalogModel("10R1200", "1200ml / 40.6oz / 5.1cup", "15.7 x 8.5cm", "assets/catalog/storage-p11-10r1200.webp"),
        makeCatalogModel("10R2100", "2100ml / 71oz / 8.9cup", "19 x 10cm", "assets/catalog/storage-p11-10r2100.webp"),
      ],
    },
    {
      id: "storage-catalog-p11-01-alt",
      pages: "11",
      kicker: "PDF P11 / alternate 01 formats",
      title: "Alternate 01-series rectangular formats",
      eyebrow: "01 series / alternate clear-lid profiles",
      description: "A final 01-series group uses alternate clear-lid and latch details while retaining the same stainless storage foundation.",
      note: "Catalog page 11 / capacities and dimensions are shown for the pictured profile.",
      highlight: "3 alternate rectangular profiles",
      presentation: "panel",
      panelSpecs: [
        { label: "Lid Material", value: "BPA-Free PP" },
        { label: "Advantage", value: "Microwave, oven, freezer, dishwasher safe" },
        { label: "Custom Branding", value: "Available" },
        { label: "Standard", value: "FDA/LFGB/DGCCRF" },
        { label: "Usage", value: "Great For Meal Prep, Food Storage, Lunch Boxes, Or Leftovers." },
      ],
      models: [
        makeCatalogModel("01RC550", "550ml / 18.6oz / 2.3cup", "16.8 x 12.8 x 5.8cm", "assets/catalog/storage-p11-01rc550-alt.webp", catalogMaterials, "Alternate profile"),
        makeCatalogModel("01RC1300", "1300ml / 43.9oz / 5.5cup", "22 x 16.8 x 7.2cm", "assets/catalog/storage-p11-01rc1300-alt.webp", catalogMaterials, "Alternate profile"),
        makeCatalogModel("01RC450/280", ["450ml / 15.2oz / 1.9cup", "280ml / 9.5oz / 1.2cup"], ["22 x 16.7 x 5.5cm", "22 x 16.7 x 5.5cm"], "assets/catalog/storage-p11-01rc450-280.webp"),
      ],
    },
    {
      id: "storage-catalog-p12-02",
      pages: "12",
      kicker: "PDF P12 / 02RC + 02R",
      presentation: "panel",
      title: "02RC / 02R value storage containers",
      eyebrow: "02 series / promotional latch-lid formats",
      description: "A practical promotional range with dependable stainless bodies, secure latch lids and everyday sizes. Designed to deliver an attractive price point and strong value for retail programs, giveaways and volume orders.",
      note: "Catalog page 12 / 304# and 316L# options shown for each model.",
      highlight: "Cost-effective promotional range with reliable everyday performance",
      panelSpecs: [
        { label: "Lid Material", value: "Food-grade PP with stainless latch details" },
        { label: "Advantage", value: "Secure latches, stackable formats and easy everyday cleaning" },
        { label: "Custom Branding", value: "Available" },
        { label: "Standard", value: "FDA/LFGB/DGCCRF" },
        { label: "Usage", value: "Great For Promotional Programs, Meal Prep, Takeaway, Food Storage, Or Leftovers." },
      ],
      models: [
        makeCatalogModel("02RC580", "580ml / 19.6oz / 2.5cup", "15.7 x 11.8 x 7cm", "assets/catalog/storage-p12-02rc580.webp"),
        makeCatalogModel("02RC850", "850ml / 28.7oz / 3.6cup", "18.7 x 13 x 7.3cm", "assets/catalog/storage-p12-02rc850.webp"),
        makeCatalogModel("02RC1200", "1200ml / 40.6oz / 5.1cup", "20.1 x 15.2 x 7.5cm", "assets/catalog/storage-p12-02rc1200.webp"),
        makeCatalogModel("02R700", "700ml / 23.7oz / 3cup", "13.7 x 8.2cm", "assets/catalog/storage-p12-02r700.webp"),
        makeCatalogModel("02R1050", "1050ml / 35.5oz / 4.4cup", "15.6 x 9.2cm", "assets/catalog/storage-p12-02r1050.webp"),
      ],
    },
  ];

  // Keep the catalog sequence intact while swapping the two requested panel modules.
  const tenRcIndex = storageCatalogGroups.findIndex((group) => group.id === "storage-catalog-p10-10rc");
  const alternate01Index = storageCatalogGroups.findIndex((group) => group.id === "storage-catalog-p11-01-alt");
  if (tenRcIndex >= 0 && alternate01Index >= 0) {
    [storageCatalogGroups[tenRcIndex], storageCatalogGroups[alternate01Index]] = [
      storageCatalogGroups[alternate01Index],
      storageCatalogGroups[tenRcIndex],
    ];
  }

  const makeSetBundleSeries = (groups) => {
    const models = groups.flatMap((group) => group.models || []);
    return {
      id: "storage-catalog-sets",
      category: "storage",
      presentation: "set",
      setPanel: true,
      panelSeries: true,
      title: "Stackable food storage container sets",
      eyebrow: "01 series / coordinated sets",
      description: "A complete set program covering compact, large-capacity and square-base combinations for meal prep, pantry organization and bundled retail packs.",
      images: models.map((model) => ({ src: model.image, alt: model.alt })),
      panelGallery: true,
      panelModels: models,
      catalogTitle: "Stackable food storage container sets",
      catalogKicker: "PDF P07-P09 / coordinated set formats",
      catalogNote: "Catalog pages 7-9 / dimensions and capacities are listed per set component.",
      catalogModels: models,
      specs: [
        { label: "Lid Material", value: "BPA-Free PP" },
        { label: "Advantage", value: "Microwave, oven, freezer, dishwasher safe" },
        { label: "Custom Branding", value: "Available" },
        { label: "Standard", value: "FDA/LFGB/DGCCRF" },
      ],
      highlight: "Complete your product line with coordinated sizes for every storage routine.",
      cardFacts: [`${models.length} set configurations`, "PDF pages 7-9", "304# / 316L# options"],
    };
  };

  /*
   * Pages 2-6 are presented as one original-style gallery. Each thumbnail is
   * a complete, PDF-faithful model panel (material, image and specification
   * text together), so the selected model never loses its catalog context.
   */
  const singleModelPanelModels = [
    makeCatalogModel("01RC400", "400ml / 13.5oz / 1.7cup", "16.5 x 12.5 x 4.5cm", "assets/catalog/storage-2603-single-01rc400.webp"),
    makeCatalogModel("01RC550", "550ml / 18.6 / 2.3cup", "16.5 x 12.5 x 6cm", "assets/catalog/storage-2603-single-01rc550.webp"),
    makeCatalogModel("01RC650", "650ml / 21.9oz / 2.7cup", "17.5 x 13 x 5.8cm", "assets/catalog/storage-2603-single-01rc650.webp"),
    makeCatalogModel("01RC1000", "1000ml / 33.8oz / 4.2cup", "17.5 x 13 x 9.2cm", "assets/catalog/storage-2603-single-01rc1000.webp"),
    makeCatalogModel("01RC1300", "1300ml / 43.9oz / 5.5cup", "21.4 x 16.3 x 7.2cm", "assets/catalog/storage-2603-single-01rc1300.webp"),
    makeCatalogModel("01RC2250", "2250ml / 76oz / 9.5cup", "24.8 x 19.3 x 8.2cm", "assets/catalog/storage-2603-single-01rc2250.webp"),
    makeCatalogModel("01RC2000", "2000ml / 62oz / 8.4cup", "29.8 x 21.4 x 5.8cm", "assets/catalog/storage-2603-single-01rc2000.webp"),
    makeCatalogModel("01RC2500", "2500ml / 84oz / 10.6cup", "29.8 x 21.4 x 7cm", "assets/catalog/storage-2603-single-01rc2500.webp"),
    makeCatalogModel("01RC4200", "4200ml / 142oz / 17.8cup", "29.8 x 21.4 x 10.5cm", "assets/catalog/storage-2603-single-01rc4200.webp"),
    makeCatalogModel("01RC3000", "3000ml / 101oz / 12.7cup", "36.8 x 25.2 x 6.2cm", "assets/catalog/storage-2603-single-01rc3000.webp"),
    makeCatalogModel("01RC5000", "5000ml / 169oz / 21.1cup", "36.8 x 25.2 x 8.5cm", "assets/catalog/storage-2603-single-01rc5000.webp"),
    makeCatalogModel("01RC6600", "6600ml / 223oz / 27.9cup", "36.8 x 25.2 x 11.3cm", "assets/catalog/storage-2603-single-01rc6600.webp", ["304#"]),
    makeCatalogModel("01RC2600", "2600ml / 87oz / 11cup", "38.8 x 16.5 x 7.5cm", "assets/catalog/storage-2603-single-01rc2600.webp"),
    makeCatalogModel("01RC3700", "3700ml / 125oz / 15.6cup", "38.8 x 16.5 x 10cm", "assets/catalog/storage-2603-single-01rc3700.webp"),
    makeCatalogModel("01SQ400", "400ml / 14oz / 1.7cup", "12.3 x 12.3 x 7cm", "assets/catalog/storage-2603-single-01sq400.webp"),
    makeCatalogModel("01SQ1000", "1000ml / 34oz / 4.2cup", "25.2 x 12.3 x 7cm", "assets/catalog/storage-2603-single-01sq1000.webp"),
    makeCatalogModel("01SQ4300", "4300ml / 145oz / 18.2cup", "29 x 29 x 8.7cm", "assets/catalog/storage-2603-single-01sq4300.webp", ["304#"]),
    makeCatalogModel("01-SG450/280ml", "730ml / 25oz / 3.1cup", "21.4 x 16.3 x 5.8cm", "assets/catalog/storage-2603-single-01-sg450-280ml.webp"),
    makeCatalogModel("01-SSG400/280/280ml", "960ml / 32oz / 4.6cup", "25.2 x 19.5 x 5.7cm", "assets/catalog/storage-2603-single-01-ssg400-280-280ml.webp"),
    makeCatalogModel("01-CTXSSG1700ml", "1700ml / 57oz / 7.2cup", "38.8 x 16.5 x 5.8", "assets/catalog/storage-2603-single-01-ctxssg1700ml.webp"),
  ];

  const makeSingleModelPanelSeries = (models) => ({
    id: "storage-featured-2603-single",
    category: "storage",
    title: "Single-model food storage catalog",
    eyebrow: "2603 PDF / pages 2-6",
    description: "Our best-selling range for meal prep, lunch boxes and leftovers, with matching PP lids and OEM-ready sizes.",
    images: models.map((model) => ({ src: model.image, alt: `${model.code} catalog panel` })),
    panelGallery: true,
    panelModels: models,
    specs: [
      { label: "Lid Material", value: "BPA-Free PP" },
      { label: "Advantage", value: "Microwave, oven, freezer, dishwasher safe" },
      { label: "Custom Branding", value: "Available" },
      { label: "Standard", value: "FDA/LFGB/DGCCRF" },
      { label: "Usage", value: "Great For Meal Prep, Food Storage, Lunch Boxes, Or Leftovers." },
    ],
    highlight: `${models.length} complete catalog panels / model data stays with the image`,
    cardFacts: [`${models.length} single models`, "PDF pages 2-6", "304# / 316L# options"],
  });

  const singleModelPageGroups = new Set(["2", "3", "5", "6"]);
  const originalStorageFeatureTiles = productCategories[0].series[0]?.featureTiles || [];
  const singleModelSeries = {
    ...makeSingleModelPanelSeries(singleModelPanelModels),
    featureTiles: originalStorageFeatureTiles,
  };
  const setBundleSeries = makeSetBundleSeries(storageCatalogGroups.filter((group) => group.presentation === "set"));
  productCategories[0].series = [
    singleModelSeries,
    setBundleSeries,
    ...storageCatalogGroups
      .filter((group) => group.presentation === "panel")
      .map((group) => makeCatalogSeries(group)),
    ...storageCatalogGroups
      .filter((group) => !singleModelPageGroups.has(group.pages) && group.presentation !== "set" && group.presentation !== "panel")
      .map((group) => makeCatalogSeries(group)),
  ];

  const productData = {
    categories: productCategories,
    series: productCategories.flatMap((category) => category.series),
  };

  const seriesIndex = Object.create(null);
  productData.series.forEach((series) => {
    seriesIndex[series.id] = series;
  });

  // IDs used by the first prototype are retained so existing links/bookmarks
  // still open the closest current series after the grid is rebuilt.
  const legacySeriesAliases = {
    "tri-ply": "cookware-tri-ply",
    skillet: "cookware-skillets",
    airtight: "storage-featured-2603-single",
    bento: "storage-featured-2603-single",
    "steel-tray": "storage-catalog-sets",
    "storage-catalog-p07-sets": "storage-catalog-sets",
    "storage-catalog-p08-sets": "storage-catalog-sets",
    "storage-catalog-p09-sets": "storage-catalog-sets",
  };

  const reelFrames = [
    { src: "assets/factory-forming-zone-floor.webp", chapter: "Press line" },
    { src: "assets/factory-material-control.png", chapter: "Materials" },
    { src: "assets/factory-sheet-prep-source2-clean-v2.webp", chapter: "Sheet prep" },
    { src: "assets/factory-quality-source3-clean-v4.webp", chapter: "Quality" },
  ];

  const qs = (selector, parent = document) => parent?.querySelector(selector);
  const qsa = (selector, parent = document) => parent ? [...parent.querySelectorAll(selector)] : [];

  function refreshIcons() {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    }[character]));
  }

  function normalizeImage(image) {
    if (typeof image === "string") return { src: image, alt: "Product image" };
    return { src: image?.src || "", alt: image?.alt || "Product image" };
  }

  function getSeries(id) {
    const resolvedId = legacySeriesAliases[id] || id;
    return seriesIndex[resolvedId] || null;
  }

  function normalizeSpecs(series) {
    return (series?.specs || []).map((spec) => {
      if (Array.isArray(spec)) return { label: spec[0], value: spec[1] };
      return { label: spec?.label || "Specification", value: spec?.value || "Confirm by model" };
    });
  }

  function categoryForSeries(series) {
    return productData.categories.find((category) => category.id === series?.category) || null;
  }

  function renderSeriesFeatureStory(series) {
    const featureTiles = (series?.featureTiles || []).map((tile, tileIndex) => `
      <figure class="series-feature-tile series-feature-tile--${tileIndex + 1}${tileIndex > 0 ? " series-feature-tile--compact" : ""}${tile.variant ? ` series-feature-tile--${escapeHtml(tile.variant)}` : ""}">
        <img src="${escapeHtml(tile.src)}" alt="${escapeHtml(tile.alt)}" loading="lazy" />
        <figcaption><span>${escapeHtml(tile.label)}</span><strong>${escapeHtml(tile.title)}</strong><small>${escapeHtml(tile.caption)}</small>${tile.note ? `<small class="series-feature-note">${escapeHtml(tile.note)}</small>` : ""}</figcaption>
      </figure>`).join("");
    if (!featureTiles) return "";
    return `
      <div class="series-feature-story" aria-labelledby="${escapeHtml(series.id)}-feature-title">
        <div class="series-feature-copy">
          <div><span class="series-feature-kicker">01RC range / in use</span><h3 id="${escapeHtml(series.id)}-feature-title">Designed around real storage routines.</h3></div>
          <p>See how the catalog-led range brings together matching lids, practical sizes and smooth stainless bodies for daily prep, chilled storage and carrying. Final seal and care requirements are confirmed by model.</p>
        </div>
        <div class="series-feature-grid">${featureTiles}</div>
      </div>`;
  }

  function renderSeriesCard(series, category, index) {
    const images = (series.images || []).map(normalizeImage).filter((image) => image.src);
    const firstImage = images[0] || { src: "", alt: series.title };
    const panelGallery = series.panelGallery === true;
    const panelModels = panelGallery ? (series.panelModels || []).filter((model) => model?.code && model?.image) : [];
    const firstPanelModel = panelModels[0] || null;
    const catalogSeries = !panelGallery && Array.isArray(series.catalogModels) && series.catalogModels.length > 0;
    const facts = series.cardFacts?.length
      ? series.cardFacts
      : normalizeSpecs(series).slice(0, 3).map((spec) => spec.value);
    const thumbs = images.map((image, imageIndex) => `
      <button class="series-thumb${panelGallery ? " series-thumb--panel" : ""}${imageIndex === 0 ? " is-active" : ""}" type="button" data-series-thumb="${imageIndex}" aria-label="Show ${escapeHtml(image.alt)}" aria-pressed="${imageIndex === 0 ? "true" : "false"}">
        <img src="${escapeHtml(image.src)}" alt="" loading="lazy" />
      </button>`).join("");
    const specs = normalizeSpecs(series).map((spec) => `
      <div class="series-spec" data-spec-label="${escapeHtml(spec.label)}"><span class="series-spec-label">${escapeHtml(spec.label)}</span><strong class="series-spec-value">${escapeHtml(spec.value)}</strong></div>`).join("");

    const featured = index === 0 && category.id === "storage";
    const catalogModels = Array.isArray(series.catalogModels)
      ? series.catalogModels.filter((model) => model?.image && model?.code)
      : [];
    const catalogMarkup = catalogSeries ? `
        <section class="series-catalog-section" aria-labelledby="${escapeHtml(series.id)}-catalog-title">
          <div class="series-catalog-heading">
            <div>
              <h3 id="${escapeHtml(series.id)}-catalog-title">${escapeHtml(series.catalogTitle || series.title)}</h3>
            </div>
          </div>
          <div class="series-catalog-grid">
            ${catalogModels.map((model, modelIndex) => `
              <button class="catalog-model" type="button" data-catalog-index="${modelIndex}" aria-label="View ${escapeHtml(model.code)} product details">
                <span class="catalog-model-materials">${(model.materials || []).map((material) => `<span>${escapeHtml(material)}</span>`).join("")}</span>
                <span class="catalog-model-image-wrap"><img class="catalog-model-image" src="${escapeHtml(model.image)}" alt="${escapeHtml(model.alt || model.code)}" loading="lazy" /></span>
                <span class="catalog-model-rule" aria-hidden="true"></span>
                <span class="catalog-model-copy"><strong>${escapeHtml(model.code)}${model.variant ? `<small class="catalog-model-variant">${escapeHtml(model.variant)}</small>` : ""}</strong>${(Array.isArray(model.details) && model.details.length ? model.details : [{ capacity: model.capacity || "Capacity by model", size: model.size || "Confirm by model" }]).map((detail) => `<span class="catalog-model-detail"><span>${escapeHtml(detail.capacity || "Capacity by model")}</span><span>Size: ${escapeHtml(detail.size || "Confirm by model")}</span></span>`).join("")}</span>
              </button>`).join("")}
          </div>
          <div class="series-catalog-footer">
            <span>${catalogModels.length} catalog model${catalogModels.length === 1 ? "" : "s"} / complete PDF specifications / OEM-ready formats</span>
            <button class="series-card-link product-open" type="button">View full series <i data-lucide="arrow-up-right" aria-hidden="true"></i></button>
          </div>
        </section>` : "";
    const panelSelectionMarkup = panelGallery && firstPanelModel ? `
             <div class="series-selected-model" data-series-selected-model>
               <div class="series-selected-model-heading"><span>Selected model</span><strong data-selected-model-code>${escapeHtml(firstPanelModel.code)}</strong></div>
               <div class="series-selected-model-facts">
                 <div><span>Capacity</span><strong data-selected-model-capacity>${escapeHtml(firstPanelModel.capacity || "Confirm by model")}</strong></div>
                 <div><span>Size</span><strong data-selected-model-size>${escapeHtml(firstPanelModel.size || "Confirm by model")}</strong></div>
                 <div><span>Material options</span><strong data-selected-model-materials>${escapeHtml((firstPanelModel.materials || []).join(" / ") || "Confirm by model")}</strong></div>
               </div>
             </div>` : "";
    return `
        <article class="product-card product-series-card${featured ? " product-series-card--featured" : ""}${catalogSeries ? " product-series-card--catalog" : ""}${panelGallery ? " product-series-card--panel" : ""}${series.setPanel ? " product-series-card--set-panel" : ""}${series.panelSeries && !series.setPanel ? " product-series-card--catalog-panel" : ""}" data-product-category="${escapeHtml(category.id)}" data-product-id="${escapeHtml(series.id)}" data-product-series="${escapeHtml(series.id)}">
        ${catalogMarkup || `
          <div class="series-gallery${panelGallery ? " series-gallery--panel" : ""}" aria-label="${escapeHtml(series.title)} product images">
            <div class="series-gallery-main">
              <img class="series-main-image${panelGallery ? " series-main-image--panel" : ""}" data-series-main-image src="${escapeHtml(firstImage.src)}" alt="${escapeHtml(firstImage.alt)}" loading="lazy" />
              <span class="series-gallery-label">${String(index + 1).padStart(2, "0")} / ${escapeHtml(category.shortLabel)}</span>
              <button class="round-button series-gallery-open product-open" type="button" aria-label="View ${escapeHtml(series.title)}" title="View series"><i data-lucide="arrow-up-right" aria-hidden="true"></i></button>
            </div>
            <div class="series-thumbs">${thumbs}</div>
          </div>
          <div class="series-content">
            <div class="series-kicker"><span>${escapeHtml(category.shortLabel)}</span>${panelGallery ? "" : `<span>${escapeHtml(series.eyebrow)}</span>`}</div>
            <h3>${escapeHtml(series.title)}</h3>
            <p>${escapeHtml(series.description)}</p>
            <div class="series-highlight"><strong>${escapeHtml(series.highlight || "OEM options available")}</strong></div>
            ${panelSelectionMarkup}
            <div class="series-spec-list" aria-label="${escapeHtml(series.title)} specifications">${specs}</div>
            <div class="series-card-footer"><span class="series-card-note">${facts.map((fact) => escapeHtml(fact)).join(" / ")}</span><button class="series-card-link product-open" type="button">View series <i data-lucide="arrow-up-right" aria-hidden="true"></i></button></div>
          </div>`}
      </article>`;
  }

  function renderProductGrid() {
    const grid = qs("#product-grid");
    if (!grid) return;

    const featureSlot = qs("#storage-feature-story-slot");
    const storageCategory = productData.categories.find((category) => category.id === "storage");
    const storageSeries = storageCategory?.series?.find((series) => series.featureTiles?.length);
    if (featureSlot) {
      featureSlot.innerHTML = storageSeries ? renderSeriesFeatureStory(storageSeries) : "";
      featureSlot.hidden = !storageSeries;
    }

    const markup = productData.categories.map((category) => `
      <div class="product-category-heading" data-product-category="${escapeHtml(category.id)}" data-product-category-heading>
        <div class="product-category-heading-copy"><h3>${escapeHtml(category.label)}</h3><p>${escapeHtml(category.description)}</p></div>
      </div>
      ${category.series.map((series, index) => renderSeriesCard(series, category, index)).join("")}`).join("");

    grid.innerHTML = markup;
    grid.dataset.productRendered = "true";
    refreshIcons();
  }

  function setModal(modal, open) {
    if (!modal) return;
    modal.classList.toggle("is-open", open);
    modal.setAttribute("aria-hidden", String(!open));
    if (open) {
      state.activeModal = modal;
      document.body.classList.add("modal-open");
      qs("button[data-close-modal]", modal)?.focus();
    } else if (state.activeModal === modal) {
      state.activeModal = null;
      state.activeSeries = null;
      state.activeImageIndex = 0;
      document.body.classList.remove("modal-open");
    }
  }

  function ensureModalThumbs() {
    const modal = qs("#product-modal");
    if (!modal) return null;
    let thumbs = qs("#product-modal-thumbs", modal) || qs("[data-product-modal-thumbs]", modal);
    if (!thumbs) {
      const media = qs(".product-modal-media", modal);
      if (!media) return null;
      thumbs = document.createElement("div");
      thumbs.id = "product-modal-thumbs";
      thumbs.className = "product-modal-thumbs";
      thumbs.setAttribute("role", "listbox");
      thumbs.setAttribute("aria-label", "Product images");
      media.appendChild(thumbs);
    }
    return thumbs;
  }

  function selectProductImage(index) {
    const series = state.activeSeries;
    const images = (series?.images || []).map(normalizeImage).filter((image) => image.src);
    if (!images.length) return;
    const safeIndex = (index + images.length) % images.length;
    const image = images[safeIndex];
    const mainImage = qs("#product-modal-image");
    if (mainImage) {
      mainImage.src = image.src;
      mainImage.alt = image.alt || series.title;
    }
    qsa("[data-modal-image-index]", qs("#product-modal")).forEach((button) => {
      const active = Number(button.dataset.modalImageIndex) === safeIndex;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.setAttribute("aria-pressed", String(active));
    });
    state.activeImageIndex = safeIndex;
  }

  function renderProductModalGallery(series) {
    const thumbs = ensureModalThumbs();
    if (!thumbs) return;
    const images = (series.images || []).map(normalizeImage).filter((image) => image.src);
    thumbs.innerHTML = images.map((image, index) => `
      <button class="product-modal-thumb${index === 0 ? " is-active" : ""}" type="button" data-modal-image-index="${index}" role="option" aria-selected="${index === 0 ? "true" : "false"}" aria-pressed="${index === 0 ? "true" : "false"}" aria-label="Show ${escapeHtml(image.alt)}">
        <img src="${escapeHtml(image.src)}" alt="" loading="lazy" />
      </button>`).join("");
    qsa("[data-modal-image-index]", thumbs).forEach((button) => button.addEventListener("click", () => selectProductImage(Number(button.dataset.modalImageIndex))));
    selectProductImage(0);
  }

  function openProduct(id, imageIndex = 0) {
    const series = getSeries(id);
    if (!series) return;
    const category = categoryForSeries(series);
    state.activeSeries = series;
    state.activeImageIndex = 0;

    const kicker = qs("#product-modal-kicker");
    if (kicker) kicker.textContent = series.eyebrow || category?.label || "Product range";
    const categoryTarget = qs("#product-modal-category");
    if (categoryTarget) categoryTarget.textContent = category?.label || "Product range";
    const title = qs("#product-modal-title");
    if (title) title.textContent = series.title;
    const description = qs("#product-modal-description");
    if (description) description.textContent = series.description;
    const highlight = qs("#product-modal-highlight");
    if (highlight) highlight.textContent = series.highlight || "";

    const specsTarget = qs("#product-modal-specs");
    if (specsTarget) {
      specsTarget.innerHTML = normalizeSpecs(series).map((spec) => `<div class="modal-spec"><span>${escapeHtml(spec.label)}</span><strong>${escapeHtml(spec.value)}</strong></div>`).join("");
    }
    const image = qs("#product-modal-image");
    const firstImage = (series.images || []).map(normalizeImage).find((item) => item.src);
    if (image && firstImage) {
      image.src = firstImage.src;
      image.alt = firstImage.alt || series.title;
    }
    renderProductModalGallery(series);
    const requestedImageIndex = Number(imageIndex);
    if (Number.isFinite(requestedImageIndex) && requestedImageIndex > 0) selectProductImage(requestedImageIndex);
    setModal(qs("#product-modal"), true);
    refreshIcons();
  }

  function openGallery(source) {
    const item = source?.dataset?.gallerySrc ? source : source?.querySelector("[data-gallery-src]");
    if (!item?.dataset?.gallerySrc) return;
    const image = qs("#gallery-modal-image");
    const media = qs(".gallery-modal-media");
    if (media && !qs(".gallery-modal-watermark", media)) {
      ["center", "top", "bottom"].forEach((position) => {
        const watermark = document.createElement("span");
        watermark.className = `gallery-modal-watermark gallery-modal-watermark--${position}`;
        watermark.textContent = "Chaozhou Laotesi";
        media.appendChild(watermark);
      });
    }
    if (image) {
      image.src = item.dataset.gallerySrc;
      image.alt = item.dataset.galleryTitle || "Factory photo";
    }
    const title = qs("#gallery-modal-title");
    if (title) title.textContent = item.dataset.galleryTitle || "Factory photo";
    const description = qs("#gallery-modal-description");
    if (description) description.textContent = item.dataset.galleryCaption || "";
    setModal(qs("#gallery-modal"), true);
  }

  function renderReelFrame(index) {
    state.reelIndex = ((index % reelFrames.length) + reelFrames.length) % reelFrames.length;
    const frame = reelFrames[state.reelIndex];
    const image = qs("#reel-frame");
    if (image) {
      image.src = frame.src;
      image.alt = `${frame.chapter} factory walkthrough frame`;
      image.hidden = false;
    }
    const chapter = qs("#reel-chapter");
    if (chapter) chapter.textContent = frame.chapter;
    qsa("[data-reel-index]").forEach((button) => button.classList.toggle("is-active", Number(button.dataset.reelIndex) === state.reelIndex));
    qsa("[data-reel-mode]").forEach((button) => button.classList.remove("is-active"));
  }

  function setReelMode(mode) {
    const nextMode = mode === "still" ? "still" : "video";
    state.reelMode = nextMode;
    const stage = qs("#reel-stage");
    const video = qs("#reel-video");
    const frame = qs("#reel-frame");
    const controls = qs("#photo-reel-controls");
    const kicker = qs("#reel-stage-kicker");
    const chapter = qs("#reel-chapter");
    const status = qs("#reel-video-status");
    const videoMode = nextMode === "video";

    if (videoMode) {
      stage?.classList.add("reel-stage--video");
      stage?.setAttribute("data-reel-mode", "video");
      if (video) video.hidden = false;
      if (frame) frame.hidden = true;
      if (controls) controls.hidden = true;
      if (kicker) kicker.textContent = "EDITED WORKSHOP CLIP";
      if (chapter) chapter.textContent = "Workshop video";
      qsa("[data-reel-mode]").forEach((button) => button.classList.add("is-active"));
      qsa("[data-reel-index]").forEach((button) => button.classList.remove("is-active"));
    } else {
      stage?.classList.remove("reel-stage--video");
      stage?.setAttribute("data-reel-mode", "still");
      video?.pause();
      if (video) video.hidden = true;
      if (frame) frame.hidden = false;
      if (controls) controls.hidden = false;
      if (kicker) kicker.textContent = "FACTORY PHOTO REEL";
      renderReelFrame(state.reelIndex);
    }
    if (status && videoMode) status.textContent = "";
    refreshIcons();
  }

  function updateReelProgress() {
    const percent = Math.min(100, (state.reelElapsed / 72) * 100);
    const fill = qs("#reel-track-fill");
    if (fill) fill.style.width = `${percent}%`;
    const time = qs("#reel-time");
    if (time) time.textContent = `Still ${state.reelIndex + 1} / ${reelFrames.length}`;
  }

  function setReelPlaying(playing) {
    const button = qs("#reel-play");
    if (state.reelTimer) window.clearInterval(state.reelTimer);
    state.reelTimer = null;
    if (button) {
      button.innerHTML = `<i data-lucide="${playing ? "pause" : "play"}" aria-hidden="true"></i>`;
      button.setAttribute("aria-label", playing ? "Pause photo reel" : "Play photo reel");
    }
    if (playing) {
      state.reelTimer = window.setInterval(() => {
        state.reelElapsed += 1;
        if (state.reelElapsed % 18 === 0) renderReelFrame((state.reelIndex + 1) % reelFrames.length);
        if (state.reelElapsed >= 72) {
          state.reelElapsed = 0;
          renderReelFrame(0);
          setReelPlaying(false);
        }
        updateReelProgress();
      }, 1000);
    }
    refreshIcons();
  }

  function playReelVideo() {
    const video = qs("#reel-video");
    if (!video) return;
    const attempt = video.play();
    // Muted autoplay is normally allowed, but keep the native controls as a
    // fallback when a browser or user setting blocks it.
    attempt?.catch(() => {});
  }

  function openReel() {
    state.reelElapsed = 0;
    state.reelIndex = 0;
    setReelMode("video");
    const video = qs("#reel-video");
    if (video) {
      video.pause();
      try { video.currentTime = 0; } catch (error) { /* metadata may not be ready yet */ }
    }
    setModal(qs("#reel-modal"), true);
    playReelVideo();
  }

  function updateSeriesSelection(card, index) {
    if (!card) return;
    const cardId = card.dataset.productId || card.dataset.productSeries;
    const series = getSeries(cardId);
    const models = series?.panelModels || [];
    const model = models[index];
    card.dataset.activeImageIndex = String(index);
    if (!model) return;
    const selected = qs("[data-series-selected-model]", card);
    if (!selected) return;
    const code = qs("[data-selected-model-code]", selected);
    const capacity = qs("[data-selected-model-capacity]", selected);
    const size = qs("[data-selected-model-size]", selected);
    const materials = qs("[data-selected-model-materials]", selected);
    if (code) code.textContent = model.code || "Confirm by model";
    if (capacity) capacity.textContent = model.capacity || "Confirm by model";
    if (size) size.textContent = model.size || "Confirm by model";
    if (materials) materials.textContent = (model.materials || []).join(" / ") || "Confirm by model";
  }

  function stopReel() {
    setReelPlaying(false);
    const video = qs("#reel-video");
    if (video) {
      video.pause();
      try { video.currentTime = 0; } catch (error) { /* metadata may be unavailable */ }
    }
  }

  function applyProductFilter(filter) {
    const normalized = filter || "all";
    const featureSlot = qs("#storage-feature-story-slot");
    if (featureSlot) {
      const showFeature = normalized === "all" || normalized === "storage";
      featureSlot.hidden = !showFeature;
      featureSlot.setAttribute("aria-hidden", String(!showFeature));
    }
    qsa("[data-product-category]", qs("#product-grid")).forEach((item) => {
      const visible = normalized === "all" || item.dataset.productCategory === normalized;
      item.classList.toggle("is-hidden", !visible);
      item.hidden = !visible;
      item.style.display = visible ? "" : "none";
    });
    const cookwareScene = qs("#cookware-scene-panel");
    if (cookwareScene) {
      const visible = normalized === "all" || normalized === "cookware";
      cookwareScene.hidden = !visible;
      cookwareScene.style.display = visible ? "" : "none";
    }
    const status = qs("#product-range-status");
    if (status) {
      const category = productData.categories.find((item) => item.id === normalized);
      status.textContent = normalized === "all"
        ? "All four ranges / catalog-led series"
        : `${category?.label || "Product range"} / catalog-led series`;
    }
  }

  function setupFilters() {
    const productButtons = qsa("[data-product-filter]");
    const knownCategories = new Set(productData.categories.map((category) => category.id));
    productButtons.forEach((button) => {
      const filter = button.dataset.productFilter;
      if (filter !== "all" && !knownCategories.has(filter)) {
        // Remove stale prototype filters (for example the former OEM tab)
        // when the four-category catalog is rendered.
        button.hidden = true;
        button.classList.add("is-hidden");
        button.setAttribute("aria-hidden", "true");
        button.tabIndex = -1;
        button.style.display = "none";
      }
      button.addEventListener("click", () => {
        const selectedFilter = button.dataset.productFilter || "all";
        productButtons.forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-selected", String(active));
        });
        applyProductFilter(selectedFilter);
      });
    });

    const activeButton = productButtons.find((button) => !button.hidden && button.classList.contains("is-active"))
      || productButtons.find((button) => !button.hidden && button.dataset.productFilter === "storage")
      || productButtons.find((button) => !button.hidden);
    if (activeButton) {
      productButtons.forEach((button) => {
        const active = button === activeButton;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      });
      applyProductFilter(activeButton.dataset.productFilter || "all");
    } else {
      applyProductFilter("all");
    }

    qsa("[data-gallery-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.galleryFilter;
        qsa("[data-gallery-filter]").forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-selected", String(active));
        });
        qsa("[data-gallery-category]").forEach((item) => {
          const visible = filter === "all" || item.dataset.galleryCategory === filter;
          item.classList.toggle("is-hidden", !visible);
          item.hidden = !visible;
          item.style.display = visible ? "" : "none";
        });
      });
    });
  }

  function setupNavigation() {
    const header = qs("#site-header");
    const nav = qs("#main-nav");
    const menu = qs("#menu-toggle");
    const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 20);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    menu?.addEventListener("click", () => {
      const open = nav?.classList.toggle("is-open") || false;
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.setAttribute("title", open ? "Close menu" : "Open menu");
      menu.innerHTML = `<i data-lucide="${open ? "x" : "menu"}" aria-hidden="true"></i>`;
      refreshIcons();
    });
    qsa(".main-nav a").forEach((link) => link.addEventListener("click", () => {
      nav?.classList.remove("is-open");
      if (menu) {
        menu.setAttribute("aria-expanded", "false");
        menu.setAttribute("aria-label", "Open menu");
        menu.setAttribute("title", "Open menu");
        menu.innerHTML = '<i data-lucide="menu" aria-hidden="true"></i>';
      }
      refreshIcons();
    }));
  }

  function setupModals() {
    const productGrid = qs("#product-grid");
    productGrid?.addEventListener("click", (event) => {
      const thumb = event.target.closest("[data-series-thumb]");
      if (thumb) {
        event.preventDefault();
        event.stopPropagation();
        const card = thumb.closest("[data-product-id], [data-product-series]");
        const cardId = card?.dataset.productId || card?.dataset.productSeries;
        const image = card ? (getSeries(cardId)?.images || []).map(normalizeImage)[Number(thumb.dataset.seriesThumb)] : null;
        const mainImage = qs("[data-series-main-image]", card);
        if (image && mainImage) {
          const imageIndex = Number(thumb.dataset.seriesThumb);
          mainImage.src = image.src;
          mainImage.alt = image.alt;
          if (card) card.dataset.activeImageIndex = String(imageIndex);
          qsa("[data-series-thumb]", card).forEach((item) => {
            const active = item === thumb;
            item.classList.toggle("is-active", active);
            item.setAttribute("aria-pressed", String(active));
          });
          updateSeriesSelection(card, imageIndex);
        }
        return;
      }
      const catalogModel = event.target.closest("[data-catalog-index]");
      if (catalogModel) {
        event.preventDefault();
        const card = catalogModel.closest("[data-product-id], [data-product-series]");
        const cardId = card?.dataset.productId || card?.dataset.productSeries;
        openProduct(cardId, Number(catalogModel.dataset.catalogIndex));
        return;
      }
      const opener = event.target.closest(".product-open");
      const card = event.target.closest("[data-product-id], [data-product-series]");
      if (opener || card) {
        event.preventDefault();
        const targetId = card?.dataset.productId || card?.dataset.productSeries || opener?.dataset.productId || opener?.dataset.productSeries;
        const selectedIndex = Number(card?.dataset.activeImageIndex || 0);
        openProduct(targetId, Number.isFinite(selectedIndex) ? selectedIndex : 0);
      }
    });

    // Fallback for legacy/static cards outside the dynamically rendered grid.
    qsa(".product-card[data-product-id]").forEach((card) => {
      if (card.closest("#product-grid")) return;
      card.addEventListener("click", (event) => {
        if (!event.target.closest("button") || event.target.closest(".product-open")) openProduct(card.dataset.productId);
      });
    });

    qsa(".gallery-button").forEach((button) => button.addEventListener("click", () => openGallery(button)));
    qsa("[data-close-modal]").forEach((element) => element.addEventListener("click", () => {
      const modal = element.closest(".modal");
      if (modal?.id === "reel-modal") stopReel();
      setModal(modal, false);
    }));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && state.activeModal) {
        if (state.activeModal.id === "reel-modal") stopReel();
        setModal(state.activeModal, false);
        return;
      }
      if (state.activeModal?.id === "product-modal" && state.activeSeries) {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          selectProductImage(state.activeImageIndex + 1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          selectProductImage(state.activeImageIndex - 1);
        }
      }
    });
  }

  function setupReel() {
    qs("#open-reel")?.addEventListener("click", openReel);
    qs("#open-reel-card")?.addEventListener("click", openReel);
    qs("#reel-play")?.addEventListener("click", () => setReelPlaying(!state.reelTimer));
    qsa("[data-reel-mode]").forEach((button) => button.addEventListener("click", () => {
      setReelMode("video");
      const video = qs("#reel-video");
      if (video) {
        video.pause();
        try { video.currentTime = 0; } catch (error) { /* metadata may be unavailable */ }
      }
      playReelVideo();
    }));
    qsa("[data-reel-index]").forEach((button) => button.addEventListener("click", () => {
      setReelMode("still");
      renderReelFrame(Number(button.dataset.reelIndex));
      state.reelElapsed = state.reelIndex * 18;
      updateReelProgress();
    }));
    const video = qs("#reel-video");
    video?.addEventListener("error", () => {
      const status = qs("#reel-video-status");
      if (status) status.textContent = "Workshop video unavailable. Showing factory photo stills.";
      setReelMode("still");
    });
    video?.addEventListener("loadeddata", () => {
      const status = qs("#reel-video-status");
      if (status) status.textContent = "";
      if (state.reelMode === "video" && qs("#reel-modal")?.classList.contains("is-open")) playReelVideo();
    });
  }

  function setupForm() {
    const form = qs("#quote-form");
    const success = qs("#form-success");
    if (!form) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      form.reset();
      refreshIcons();
    });
    const fileInput = qs("input[type=file]", form);
    fileInput?.addEventListener("change", () => {
      const placeholder = qs(".file-placeholder span:last-child", form);
      if (placeholder) placeholder.textContent = fileInput.files?.[0]?.name || "Attach a drawing, logo or reference photo";
    });
  }

  // Keep the catalog available for lightweight integrations and QA without
  // making the rest of the page depend on a module loader.
  window.LAOTESI_PRODUCT_DATA = productData;
  window.LAOTESI_OPEN_PRODUCT = openProduct;

  document.addEventListener("DOMContentLoaded", () => {
    renderProductGrid();
    setupNavigation();
    setupFilters();
    setupModals();
    setupReel();
    setupForm();
    refreshIcons();
  });
})();
