(() => {
  if (!document.body.classList.contains("page-products")) return;
  const catalog = window.LAOTESI_PRODUCT_DATA;
  if (!catalog) return;
  const seriesById = new Map(catalog.series.map((series) => [series.id, series]));
  const singleSeries = "storage-featured-2603-single";
  const definitions = [
    { id: "rectangular", seriesId: singleSeries, category: "storage", title: "01RC rectangular containers", description: "A coordinated PP-lid range, from everyday portions to large-capacity storage.", note: "400-6,600 ml / PP lids", indexes: Array.from({ length: 14 }, (_, index) => index), previews: [4, 0, 11] },
    { id: "square", seriesId: singleSeries, category: "storage", title: "01SQ square containers", description: "Compact square formats for organized prep, pantry and foodservice storage.", note: "400 / 1,000 / 4,300 ml", indexes: [14, 15, 16], previews: [15, 14, 16] },
    { id: "divided", seriesId: singleSeries, category: "storage", title: "Divided lunch containers", description: "Two- and three-compartment formats for lunches and portioned meals.", note: "730 / 960 / 1,700 ml", indexes: [17, 18, 19], previews: [17, 18, 19] },
    { id: "sets", seriesId: "storage-catalog-sets", category: "storage", title: "Nestable container sets", description: "Matching container sets that nest completely for compact storage.", note: "Mixed sizes / nestable sets", previews: [1, 6, 10] },
    { id: "silicone-glass", seriesId: "storage-catalog-p11-round", category: "storage", title: "Silicone glass-lid containers", description: "Clear glass lids with silicone surrounds, in rectangular and round formats.", note: "280-2,100 ml / glass & silicone", previews: [1, 5, 6] },
    { id: "silicone", seriesId: "storage-catalog-p10-10rc", category: "storage", title: "10RC silicone-lid containers", description: "Two lid profiles with hanging-hook or heat-protection-tab details.", note: "600 / 900 / 1,200 ml", previews: [1, 3, 5] },
    { id: "alternate-pp", seriesId: "storage-catalog-p11-01-alt", category: "storage", title: "Alternative PP-lid formats", description: "More lid profiles and latch details within the versatile 01 collection.", note: "Rectangular & divided formats", previews: [1, 0, 2] },
    { id: "value", seriesId: "storage-catalog-p12-02", category: "storage", title: "02 series everyday containers", description: "Practical latch-lid containers for retail, promotional and volume programs.", note: "580-1,200 ml / round & rectangular", previews: [1, 3, 2] },
    { id: "tri-ply", seriesId: "cookware-tri-ply", category: "cookware", title: "Tri-ply frying pans & woks", description: "A stainless steel, aluminum and magnetic-base construction for everyday cooking.", note: "2.2 mm tri-ply / 26-32 cm", previews: [0, 1, 2], previewAlts: ["Tri-ply stainless steel frying pan with a glass lid", "Tri-ply stainless steel wok with a wooden handle", "Tri-ply stainless steel frying pan on a cooktop"], previewImages: ["assets/catalog/cookware-shallow-white.webp", "assets/catalog/cookware-wok-white.webp", "assets/catalog/cookware-skillet.webp"] },
    { id: "single-layer", seriesId: "cookware-skillets", category: "cookware", title: "Single-layer stainless cookware", description: "Milk pans, soup pots and steaming formats with configurable handles and shapes.", note: "16-26 cm / 201, 304 or 316", previews: [0, 2, 4] },
    { id: "serving", seriesId: "plates-serving-compartment", category: "plates", title: "Compartment serving plates", description: "Reusable stainless steel serving formats with separate food compartments.", note: "Three compartments / custom layouts", previews: [0, 1, 2] },
    { id: "kettles", seriesId: "kettles-household-range", category: "kettles", title: "Stainless steel kettles", description: "Five capacity options with a whistling lid and an easy-grip handle.", note: "2.5 / 3.5 / 4.5 / 5.5 / 7.5 L", previews: [0, 1, 2] },
  ];
  const modelsFor = (series) => series.panelModels || series.catalogModels || [];
  const correctedStoragePhotos = new Set(["rectangular-12", "rectangular-13", "divided-19", "sets-0", "sets-3", "sets-6", "sets-7"]);
  const catalogPhoto = (collectionId, index) => {
    const key = collectionId + "-" + index;
    return "assets/catalog-white/" + key + (correctedStoragePhotos.has(key) ? "-neutral" : "") + ".webp";
  };
  const collections = definitions.filter((definition) => seriesById.has(definition.seriesId)).map((definition) => {
    const series = seriesById.get(definition.seriesId);
    const models = modelsFor(series);
    const indexes = definition.indexes || (models.length ? models : series.images).map((_, index) => index);
    const previews = definition.previews.filter((index) => indexes.includes(index)).map((index, previewIndex) => ({
      index,
      src: definition.category === "storage" ? catalogPhoto(definition.id, index) : definition.previewImages?.[previewIndex] || series.images[index].src,
      alt: definition.previewAlts?.[previewIndex] || models[index]?.alt || series.images[index].alt || definition.title,
      code: models[index]?.code || definition.title + " image " + (index + 1),
    }));
    return { ...definition, indexes, previews, modelCount: models.length ? indexes.length : null };
  });
  window.LAOTESI_PRODUCT_COLLECTIONS = collections;

  const lidTypes = [
    { id: "integrated-pp", title: "Integrated PP lids", description: "PP lids with integrated clips. Rectangular, square and divided containers, and coordinated sets.", collections: ["rectangular", "square", "divided", "sets"] },
    { id: "silicone-glass", title: "Silicone glass lids", description: "Glass lids with a silicone surround. Rectangular and round formats.", collections: ["silicone-glass"] },
    { id: "pure-silicone", title: "Pure silicone lids", description: "All-silicone lids in hanging-hook and side-tab profiles.", collections: ["silicone"] },
    { id: "detachable-pp", title: "PP lids with detachable clips", description: "PP lids with removable clips. Rectangular, divided and round formats.", collections: ["alternate-pp", "value"] },
  ];
  const normalizeSize = (size) => String(size).replace(/\s*cm\s*$/i, "").trim() + " cm";
  const compactCapacity = (capacity) => {
    const amount = String(capacity).match(/([\d,.]+)\s*ml/i);
    const quantity = String(capacity).match(/\bx\s*(\d+)\s*$/i);
    return amount ? Number(amount[1].replace(/,/g, "")).toLocaleString("en-US") + " ml" + (quantity ? " x " + quantity[1] : "") : capacity;
  };
  const catalogCorrections = {
    "sets-3": { size: "17.5 x 13 x 5.8cm / 29.8 x 21.4 x 7cm", components: { 1: { size: "29.8 x 21.4 x 7cm" } } },
    "sets-1": { capacity: "650 ml + 1,300 ml + largest container capacity to confirm", capacityNote: "Largest container capacity to confirm.", components: { 2: { capacity: "To confirm" } } },
  };
  const storageModels = collections.filter((collection) => collection.category === "storage").flatMap((collection) => {
    const lid = lidTypes.find((type) => type.collections.includes(collection.id));
    return collection.indexes.map((index) => {
      const correction = catalogCorrections[collection.id + "-" + index] || {};
      const source = { ...modelsFor(seriesById.get(collection.seriesId))[index], ...correction };
      const model = { ...source, size: source.size.split(" / ").map(normalizeSize).join(" / "), details: source.details.map((detail, componentIndex) => {
        const corrected = { ...detail, ...correction.components?.[componentIndex] };
        return { capacity: compactCapacity(corrected.capacity), size: normalizeSize(corrected.size) };
      }) };
      return { id: collection.id + "-" + index, collectionId: collection.id, lidType: lid.id, index, model, image: catalogPhoto(collection.id, index) };
    });
  });
  const integratedSingleOrder = new Map([
    "rectangular-0", "rectangular-1", "rectangular-2", "rectangular-3", "rectangular-4", "rectangular-5",
    "square-14", "square-15", "divided-17", "divided-18",
    "rectangular-6", "rectangular-7", "rectangular-8", "rectangular-9", "rectangular-10", "rectangular-11", "rectangular-12", "rectangular-13",
    "divided-19", "square-16",
  ].map((id, index) => [id, index]));
  storageModels.sort((first, second) => (integratedSingleOrder.get(first.id) ?? integratedSingleOrder.size) - (integratedSingleOrder.get(second.id) ?? integratedSingleOrder.size));
  const storageById = new Map(storageModels.map((entry) => [entry.id, entry]));
  const imageSizeGroup = (entry) => entry.collectionId + (entry.model.details[0].size.split(" x ").length === 2 ? "-round" : "-rectangular");
  const imageSpan = (entry) => Math.max(...entry.model.details.map((detail) => {
    const dimensions = detail.size.replace(/ cm$/, "").split(" x ").map(Number);
    return dimensions.length === 2 ? dimensions[0] : Math.max(dimensions[0], dimensions[1]);
  }));
  const largestImageSpans = new Map();
  storageModels.forEach((entry) => {
    const group = imageSizeGroup(entry);
    largestImageSpans.set(group, Math.max(largestImageSpans.get(group) || 0, imageSpan(entry)));
  });
  const imageScaleOverrides = { "square-15": 0.72 };
  storageModels.forEach((entry) => {
    entry.imageScale = imageScaleOverrides[entry.id] ?? (entry.collectionId === "sets" ? 1 : Number(Math.max(0.6, Math.sqrt(imageSpan(entry) / largestImageSpans.get(imageSizeGroup(entry)))).toFixed(3)));
  });
  window.LAOTESI_STORAGE_LIDS = lidTypes;
  window.LAOTESI_STORAGE_MODELS = storageModels;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const icon = (name) => '<i data-lucide="' + name + '" aria-hidden="true"></i>';

  document.addEventListener("DOMContentLoaded", () => {
    const grid = document.querySelector("#product-grid");
    const modal = document.querySelector("#product-modal");
    if (!grid || !modal || !window.LAOTESI_OPEN_PRODUCT) return;
    const search = document.querySelector("#collection-search");
    const searchClear = document.querySelector("#collection-search-clear");
    const empty = document.querySelector("#collection-empty");
    const status = document.querySelector("#collection-status");
    const tabs = [...document.querySelectorAll("[data-collection-filter]")];
    const collectionById = new Map(collections.map((collection) => [collection.id, collection]));
    let activeCategory = "all";
    let activeCollection = null;
    let modalOpener = null;
    const selectedIndexes = new Map(collections.map((collection) => [collection.id, collection.previews[0].index]));
    const categoryLabels = { storage: "Food storage containers", cookware: "Stainless steel cookware", plates: "Serving plates & trays", kettles: "Stainless steel kettles" };

    const renderCard = (collection) => {
      const primary = collection.previews[0];
      const count = collection.modelCount ? collection.modelCount + (collection.id === "sets" ? " set options" : " models") : "OEM collection";
      return '<article class="collection-card" data-collection-id="' + collection.id + '">' +
        '<div class="collection-media"><span class="collection-model-count">' + escapeHtml(count) + '</span><button class="collection-image-button" type="button" data-open-collection="' + collection.id + '" aria-label="View ' + escapeHtml(collection.title) + '"><img data-collection-main src="' + primary.src + '" alt="' + escapeHtml(primary.alt) + '" width="640" height="480" loading="lazy" /><span class="collection-image-arrow">' + icon("arrow-up-right") + '</span></button></div>' +
        '<div class="collection-copy"><h3><button type="button" data-open-collection="' + collection.id + '">' + escapeHtml(collection.title) + '</button></h3><p class="collection-description">' + escapeHtml(collection.description) + '</p><p class="collection-note">' + escapeHtml(collection.note) + '</p></div>' +
        '<div class="collection-card-footer"><div class="collection-previews" role="group" aria-label="' + escapeHtml(collection.title) + ' previews">' + collection.previews.map((preview, index) => '<button class="collection-preview' + (index === 0 ? ' is-active' : '') + '" type="button" data-collection-image="' + preview.index + '" aria-label="Show ' + escapeHtml(preview.code) + '" title="' + escapeHtml(preview.code) + '" aria-pressed="' + (index === 0) + '"><img src="' + preview.src + '" alt="" width="64" height="48" loading="lazy" /></button>').join("") + '</div><button class="collection-details" type="button" data-open-collection="' + collection.id + '">View series ' + icon("arrow-up-right") + '</button></div></article>';
    };
    const renderStorageModel = (entry) => {
      const collection = collectionById.get(entry.collectionId);
      const model = entry.model;
      const format = entry.collectionId === "silicone" ? (model.variant === "Profile A" ? "Hanging-hook lid" : "Side-tab lid") : entry.collectionId === "sets" ? "Nestable container set" : collection.title;
      const heading = entry.collectionId === "sets" ? "h5" : "h4";
      return '<article class="storage-model" data-storage-model="' + entry.id + '" data-collection-id="' + entry.collectionId + '" style="--product-image-scale:' + entry.imageScale + '">' +
        '<div class="collection-media"><button class="collection-image-button" type="button" data-open-collection="' + entry.collectionId + '" data-model-index="' + entry.index + '" aria-label="View ' + escapeHtml(model.code + (model.variant ? " " + model.variant : "") + " " + lidTypes.find((lid) => lid.id === entry.lidType).title) + '"><img src="' + entry.image + '" alt="' + escapeHtml(model.alt) + '" width="640" height="480" loading="lazy" /><span class="collection-image-arrow">' + icon("arrow-up-right") + '</span></button></div>' +
        '<div class="storage-model-copy"><' + heading + '>' + escapeHtml(model.code) + '</' + heading + '><p class="storage-model-format">' + escapeHtml(format) + '</p>' +
        '<table class="storage-model-specs"><caption class="collection-sr-only">' + escapeHtml(model.code) + ' capacities and dimensions</caption><thead><tr><th scope="col">Capacity</th><th scope="col">Dimensions</th></tr></thead><tbody>' + model.details.map((detail) => '<tr><td>' + escapeHtml(detail.capacity) + '</td><td>' + escapeHtml(detail.size) + '</td></tr>').join("") + '</tbody></table>' + (model.capacityNote ? '<p class="storage-capacity-note">' + escapeHtml(model.capacityNote) + '</p>' : '') + '</div>' +
        '<button class="collection-details" type="button" data-open-collection="' + entry.collectionId + '" data-model-index="' + entry.index + '">View details ' + icon("arrow-up-right") + '</button></article>';
    };
    const renderStorageGrid = (entries) => '<div class="storage-model-grid">' + entries.map(renderStorageModel).join("") + '</div>';
    const renderStorage = () => '<nav class="storage-lid-nav" aria-label="Food storage lid types">' + lidTypes.map((lid) => '<a href="#lid-' + lid.id + '" data-lid-link="' + lid.id + '">' + escapeHtml(lid.title) + ' <span>' + storageModels.filter((entry) => entry.lidType === lid.id).length + '</span></a>').join("") + '</nav>' + lidTypes.map((lid) => {
      const entries = storageModels.filter((entry) => entry.lidType === lid.id);
      const singleEntries = entries.filter((entry) => entry.collectionId !== "sets");
      const setEntries = entries.filter((entry) => entry.collectionId === "sets");
      const sets = setEntries.length ? '<section class="storage-set-section" data-storage-sets aria-labelledby="storage-nesting-sets-title"><div class="storage-set-heading"><h4 id="storage-nesting-sets-title">Nestable Container Sets</h4><span data-set-count>' + setEntries.length + ' sets</span></div>' + renderStorageGrid(setEntries) + '</section>' : "";
      return '<section class="storage-lid-section" id="lid-' + lid.id + '" data-lid-type="' + lid.id + '" aria-labelledby="lid-' + lid.id + '-title"><div class="storage-lid-heading"><div><h3 id="lid-' + lid.id + '-title">' + escapeHtml(lid.title) + '</h3><p>' + escapeHtml(lid.description) + '</p></div><span data-lid-count>' + entries.length + ' models &amp; sets</span></div>' + renderStorageGrid(singleEntries) + sets + '</section>';
    }).join("");
    grid.innerHTML = catalog.categories.map((category) => {
      const categoryCollections = collections.filter((collection) => collection.category === category.id);
      return '<section class="collection-section" data-collection-category="' + category.id + '" aria-labelledby="collection-' + category.id + '-title"><div class="collection-section-heading"><h2 id="collection-' + category.id + '-title">' + escapeHtml(categoryLabels[category.id] || category.label) + '</h2><span data-category-count></span></div>' + (category.id === "storage" ? renderStorage() : '<div class="collection-grid">' + categoryCollections.map(renderCard).join("") + '</div>') + '</section>';
    }).join("");

    const setPreview = (card, collection, preview) => {
      const image = card.querySelector("[data-collection-main]");
      image.src = preview.src;
      image.alt = preview.alt;
      selectedIndexes.set(collection.id, preview.index);
      card.querySelectorAll("[data-collection-image]").forEach((button) => {
        const selected = Number(button.dataset.collectionImage) === preview.index;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    };

    const applyFilters = () => {
      const query = search.value.trim().toLowerCase();
      grid.setAttribute("aria-labelledby", "collection-tab-" + activeCategory);
      let count = 0;
      let storageCount = 0;
      const categoryCounts = new Map();
      storageModels.forEach((entry) => {
        const collection = collectionById.get(entry.collectionId);
        const lid = lidTypes.find((type) => type.id === entry.lidType);
        const searchable = [entry.model.code, entry.model.variant, entry.model.capacity, entry.model.size, collection.title, lid.title].join(" ").toLowerCase();
        const visible = (activeCategory === "all" || activeCategory === "storage") && (!query || searchable.includes(query));
        grid.querySelector('[data-storage-model="' + entry.id + '"]').hidden = !visible;
        if (visible) { storageCount += 1; count += 1; }
      });
      categoryCounts.set("storage", storageCount);
      grid.querySelectorAll("[data-storage-sets]").forEach((section) => {
        const visibleCount = [...section.querySelectorAll("[data-storage-model]")].filter((card) => !card.hidden).length;
        section.hidden = visibleCount === 0;
        section.querySelector("[data-set-count]").textContent = visibleCount + (visibleCount === 1 ? " set" : " sets");
      });
      lidTypes.forEach((lid) => {
        const section = grid.querySelector('[data-lid-type="' + lid.id + '"]');
        const visibleCount = [...section.querySelectorAll("[data-storage-model]")].filter((card) => !card.hidden).length;
        section.hidden = visibleCount === 0;
        section.querySelector("[data-lid-count]").textContent = visibleCount + (lid.id === "integrated-pp" ? " models & sets" : " models");
        const link = grid.querySelector('[data-lid-link="' + lid.id + '"]');
        link.hidden = !visibleCount;
        link.querySelector("span").textContent = visibleCount;
      });
      collections.forEach((collection) => {
        if (collection.category === "storage") return;
        const series = seriesById.get(collection.seriesId);
        const models = modelsFor(series);
        const matchingIndex = query ? collection.indexes.find((index) => (models[index]?.code || "").toLowerCase().includes(query)) : undefined;
        const searchable = [collection.title, collection.description, collection.note, ...collection.indexes.map((index) => models[index]?.code || "")].join(" ").toLowerCase();
        const visible = (activeCategory === "all" || collection.category === activeCategory) && (!query || searchable.includes(query));
        const card = grid.querySelector('[data-collection-id="' + collection.id + '"]');
        card.hidden = !visible;
        if (visible) {
          count += 1;
          categoryCounts.set(collection.category, (categoryCounts.get(collection.category) || 0) + 1);
          const matchingPreview = collection.previews.find((preview) => preview.index === matchingIndex);
          if (matchingPreview) setPreview(card, collection, matchingPreview);
          else if (matchingIndex !== undefined) setPreview(card, collection, { index: matchingIndex, src: series.images[matchingIndex].src, alt: models[matchingIndex]?.alt || collection.title });
        }
      });
      grid.querySelectorAll("[data-collection-category]").forEach((section) => {
        const sectionCount = categoryCounts.get(section.dataset.collectionCategory) || 0;
        section.hidden = sectionCount === 0;
        const lidCount = grid.querySelectorAll("[data-lid-type]:not([hidden])").length;
        section.querySelector("[data-category-count]").textContent = section.dataset.collectionCategory === "storage" ? sectionCount + " models & sets / " + lidCount + (lidCount === 1 ? " lid type" : " lid types") : sectionCount + (sectionCount === 1 ? " collection" : " collections");
      });
      status.textContent = query ? count + (count === 1 ? " result" : " results") + ' matching "' + search.value.trim() + '"' : activeCategory === "all" ? storageCount + " storage models & sets, plus " + (count - storageCount) + " cookware, plate and kettle collections" : activeCategory === "storage" ? storageCount + " models & sets across four lid types" : count + (count === 1 ? " collection" : " collections");
      empty.hidden = count > 0;
      searchClear.hidden = !query;
      tabs.forEach((tab) => {
        const active = tab.dataset.collectionFilter === activeCategory;
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        tab.classList.toggle("is-active", active);
      });
      document.querySelectorAll("[data-collection-context]").forEach((section) => {
        section.hidden = Boolean(query) || (activeCategory !== "all" && activeCategory !== section.dataset.collectionContext);
      });
    };

    const syncModal = () => {
      if (!activeCollection || !modal.classList.contains("is-open")) return;
      const collection = activeCollection;
      const series = seriesById.get(collection.seriesId);
      const selected = modal.querySelector('[data-modal-image-index][aria-selected="true"]');
      const modelIndex = Number(selected?.dataset.modalImageIndex || 0);
      const entry = storageById.get(collection.id + "-" + modelIndex);
      const model = entry?.model || modelsFor(series)[modelIndex];
      const lid = entry && lidTypes.find((type) => type.id === entry.lidType);
      modal.querySelector("#product-modal-title").textContent = entry ? model.code + (model.variant ? " / " + model.variant : "") : collection.title;
      modal.querySelector("#product-modal-description").textContent = collection.description;
      modal.querySelector("#product-modal-highlight").textContent = lid?.title || collection.note;
      if (entry) {
        modal.querySelector("#product-modal-image").src = entry.image;
        modal.querySelector("#product-modal-image").alt = model.code + " / " + lid.title;
      }
      const facts = model ? [
        { label: "Model", value: model.code },
        { label: "Capacity", value: model.capacity },
        { label: "Dimensions", value: model.size },
        { label: "Material options", value: model.materials?.join(" / ") || "Confirm by model" },
      ].concat(lid ? [{ label: "Lid type", value: lid.title }] : []).concat(series.specs.filter((fact) => /custom/i.test(fact.label))) : series.specs;
      modal.querySelector("#product-modal-specs").innerHTML = facts.map((fact) => '<div class="modal-spec"><span>' + escapeHtml(fact.label) + '</span><strong>' + escapeHtml(fact.value) + '</strong></div>').join("");
      modal.querySelectorAll("[data-modal-image-index]").forEach((button) => {
        button.hidden = !collection.indexes.includes(Number(button.dataset.modalImageIndex));
        button.setAttribute("role", "option");
        button.removeAttribute("aria-pressed");
        button.tabIndex = Number(button.dataset.modalImageIndex) === modelIndex ? 0 : -1;
        const thumbnail = storageById.get(collection.id + "-" + button.dataset.modalImageIndex);
        if (thumbnail) {
          button.querySelector("img").src = thumbnail.image;
          button.setAttribute("aria-label", "Show " + thumbnail.model.code + (thumbnail.model.variant ? " " + thumbnail.model.variant : ""));
        }
      });
      modal.querySelector("#product-modal-thumbs").setAttribute("role", "listbox");
      modal.querySelector("#product-modal-thumbs").setAttribute("aria-label", collection.title + " models");
    };

    grid.addEventListener("click", (event) => {
      const card = event.target.closest("[data-collection-id]");
      if (!card) return;
      const collection = collectionById.get(card.dataset.collectionId);
      const previewButton = event.target.closest("[data-collection-image]");
      if (previewButton) {
        const preview = collection.previews.find((image) => image.index === Number(previewButton.dataset.collectionImage));
        if (preview) setPreview(card, collection, preview);
        return;
      }
      const opener = event.target.closest("[data-open-collection]");
      if (!opener) return;
      activeCollection = collection;
      modalOpener = opener;
      window.LAOTESI_OPEN_PRODUCT(collection.seriesId, opener.hasAttribute("data-model-index") ? Number(opener.dataset.modelIndex) : selectedIndexes.get(collection.id));
      syncModal();
    });
    modal.querySelector("#product-modal-thumbs").addEventListener("click", syncModal);
    modal.addEventListener("click", (event) => {
      if (event.target.closest("[data-close-modal]") && !event.target.closest("a")) modalOpener?.focus();
    });
    document.addEventListener("keydown", (event) => {
      if (!activeCollection) return;
      if (event.key === "Escape") {
        if (!modal.classList.contains("is-open")) modalOpener?.focus();
        return;
      }
      if (!modal.classList.contains("is-open")) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const selected = modal.querySelector('[data-modal-image-index][aria-selected="true"]');
        const current = Number(selected?.dataset.modalImageIndex || 0);
        if (!activeCollection.indexes.includes(current)) {
          const direction = event.key === "ArrowRight" ? 1 : -1;
          const candidates = activeCollection.indexes;
          const next = direction > 0 ? candidates.find((index) => index >= current) ?? candidates[0] : [...candidates].reverse().find((index) => index <= current) ?? candidates[candidates.length - 1];
          modal.querySelector('[data-modal-image-index="' + next + '"]')?.click();
        }
        syncModal();
      }
      if (event.key === "Tab") {
        const controls = [...modal.querySelectorAll('button:not([hidden]), a[href], input, select, textarea')].filter((element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    });
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => { activeCategory = tab.dataset.collectionFilter; applyFilters(); });
      tab.addEventListener("keydown", (event) => {
        let targetIndex;
        if (event.key === "ArrowRight") targetIndex = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft") targetIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") targetIndex = 0;
        if (event.key === "End") targetIndex = tabs.length - 1;
        if (targetIndex !== undefined) { event.preventDefault(); tabs[targetIndex].click(); tabs[targetIndex].focus(); }
      });
    });
    search.addEventListener("input", applyFilters);
    searchClear.addEventListener("click", () => { search.value = ""; applyFilters(); search.focus(); });
    document.querySelector("#collection-reset").addEventListener("click", () => { search.value = ""; activeCategory = "all"; applyFilters(); search.focus(); });
    applyFilters();
    window.lucide?.createIcons();
  });
})();
