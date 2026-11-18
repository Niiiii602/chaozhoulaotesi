/* MayLendy / Three.js r160. Real photographs, WebGL depth and soft focus.
 * No reconstructed product geometry or remote requests. The HTML links remain
 * the baseline if JS, WebGL or a texture cannot load (including file://).
 */
(() => {
  'use strict';
  function init() {
    const root = document.querySelector('.showcase-dual[data-showcase]');
    if (!root || root.showcaseState) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const records = Array.isArray(window.MAYLENDY_SHOWCASE_PRODUCTS) ? window.MAYLENDY_SHOWCASE_PRODUCTS : [];
    const pause = root.querySelector('[data-showcase-pause]');
    const announcement = root.querySelector('[data-showcase-announcement]');
    const spacing = 3.8;
    const lanes = [...root.querySelectorAll('[data-showcase-lane]')].map((element, index) => {
      const fallback = element.querySelector('[data-showcase-fallback]');
      const links = [...fallback.querySelectorAll('[data-product-id]')];
      // HTML also supplies metadata when the optional offline bundle is absent.
      const items = links.map(link => records.find(item => item.id === link.dataset.productId) || {
        id: link.dataset.productId, name: link.textContent.trim(), subtitle: '', href: link.getAttribute('href')
      });
      return {
        element, fallback, links, items, id: element.dataset.showcaseLane,
        direction: Number(element.dataset.direction) < 0 ? -1 : 1,
        viewport: element.querySelector('[data-showcase-viewport]'),
        mode: 'loading', renderer: null, groups: [], textures: [], visible: true,
        activeIndex: 0, travel: 0, target: null, autoAnchor: 0, elapsed: -index * .65,
        sceneWidth: 11, frames: 0, dirty: true, down: null, hoverIndex: -1
      };
    });
    if (!lanes.length) return;
    let frame = 0, lastTime = 0, userPaused = false, hovered = false, focused = false, playOverride = false;
    const mod = (value, count) => ((value % count) + count) % count;
    const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
    const smooth = value => { const t = clamp(value); return t * t * t * (t * (t * 6 - 15) + 10); };
    const pausedByInteraction = () => !playOverride && (hovered || focused);
    const automatic = lane => lane.mode === 'webgl' && lane.items.length > 1 && lane.visible && !reduced.matches && !userPaused && !pausedByInteraction() && !lane.down;
    const wrap = (value, count) => mod(value + count * spacing / 2, count * spacing) - count * spacing / 2;
    const icon = play => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="${play ? 'm8 5 11 7-11 7Z' : 'M9 5v14M15 5v14'}"/></svg>`;

    function syncRoot() {
      const modes = lanes.map(lane => lane.mode);
      root.dataset.renderer = modes.every(mode => mode === 'webgl') ? 'webgl' : modes.includes('loading') ? 'loading' : modes.includes('webgl') ? 'mixed' : 'fallback';
      const hasWebgl = modes.includes('webgl');
      pause.hidden = false;
      pause.disabled = !hasWebgl || reduced.matches;
      const stopped = userPaused || reduced.matches || !hasWebgl;
      pause.setAttribute('aria-pressed', String(stopped));
      pause.setAttribute('aria-label', reduced.matches ? 'Automatic motion is off for reduced motion' : !hasWebgl ? 'Automatic motion unavailable; use gallery arrows' : userPaused ? 'Resume both product galleries' : 'Pause both product galleries');
      pause.querySelector('[data-showcase-pause-icon]').innerHTML = icon(stopped);
      pause.querySelector('[data-showcase-pause-label]').textContent = reduced.matches ? 'Motion off' : !hasWebgl ? 'Motion off' : userPaused ? 'Resume motion' : 'Pause motion';
      root.querySelector('[data-showcase-hint]').textContent = reduced.matches ? 'Use arrows to explore' : hasWebgl ? 'Drag to explore each collection' : modes.includes('loading') ? 'Loading product galleries…' : 'Swipe or use arrows to explore';
    }
    function label(lane, index, announce = false) {
      if (!lane.items.length) return;
      lane.activeIndex = mod(index, lane.items.length);
      const item = lane.items[lane.activeIndex];
      lane.element.querySelector('[data-showcase-number]').textContent = String(lane.activeIndex + 1).padStart(2, '0');
      lane.element.querySelector('[data-showcase-title]').textContent = item.name;
      lane.element.querySelector('[data-showcase-subtitle]').textContent = item.subtitle;
      lane.element.querySelector('[data-showcase-link]').href = item.href;
      lane.links.forEach((link, i) => {
        if (i === lane.activeIndex) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
      if (announce) announcement.textContent = `${item.name}. ${lane.activeIndex + 1} of ${lane.items.length}.`;
    }
    function schedule() {
      if (!frame && !document.hidden && lanes.some(lane => lane.mode === 'webgl' && lane.visible && (lane.dirty || lane.target !== null || automatic(lane)))) frame = requestAnimationFrame(render);
    }
    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0; lastTime = 0;
    }
    function dirtyAll() { lanes.forEach(lane => { lane.dirty = true; }); schedule(); }
    function resetAutomatic(lane) { lane.autoAnchor = lane.travel; lane.elapsed = 0; }
    function navigate(lane, delta) {
      if (lane.items.length < 2) return;
      playOverride = false;
      if (lane.mode !== 'webgl') {
        label(lane, lane.activeIndex + delta, true);
        const tile = lane.links[lane.activeIndex];
        lane.fallback.scrollTo({ left: tile.offsetLeft - lane.fallback.offsetLeft - (lane.fallback.clientWidth - tile.offsetWidth) / 2, behavior: reduced.matches ? 'instant' : 'smooth' });
        return;
      }
      const reference = lane.target === null ? lane.travel : lane.target;
      lane.target = (Math.round(reference / spacing) - delta) * spacing;
      label(lane, Math.round(-lane.target / spacing), true);
      if (reduced.matches) { lane.travel = lane.target; lane.target = null; resetAutomatic(lane); }
      lane.dirty = true; schedule();
    }
    function togglePause() {
      if (pause.disabled) return;
      userPaused = !userPaused; playOverride = !userPaused;
      syncRoot(); dirtyAll();
    }
    pause.addEventListener('click', togglePause);
    root.addEventListener('focusin', () => { focused = true; playOverride = false; dirtyAll(); });
    root.addEventListener('focusout', event => {
      if (!root.contains(event.relatedTarget)) { focused = false; lastTime = 0; schedule(); }
    });
    root.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') { hovered = true; playOverride = false; dirtyAll(); }
    });
    root.addEventListener('pointerleave', () => {
      hovered = false; lanes.forEach(lane => { lane.hoverIndex = -1; lane.dirty = true; }); lastTime = 0; schedule();
    });

    function dispose(lane) {
      if (lane.renderer) { lane.renderer.domElement.remove(); lane.renderer.dispose(); lane.renderer = null; }
      lane.groups.forEach(group => group.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); }));
      lane.textures.forEach(texture => texture.dispose());
      lane.groups.length = 0; lane.textures.length = 0;
    }
    function fallback(lane, reason) {
      lane.mode = 'fallback'; lane.element.dataset.renderer = 'fallback';
      if (reason) lane.element.dataset.fallbackReason = reason;
      lane.element.removeAttribute('aria-busy');
      lane.fallback.removeAttribute('aria-hidden');
      lane.links.forEach(link => link.removeAttribute('tabindex'));
      lane.viewport.removeAttribute('tabindex'); lane.viewport.style.cursor = '';
      lane.target = null; lane.down = null;
      dispose(lane); syncRoot();
      // Center the same selection when a live WebGL context is lost.
      const tile = lane.links[lane.activeIndex];
      if (tile) lane.fallback.scrollLeft = tile.offsetLeft - lane.fallback.offsetLeft - (lane.fallback.clientWidth - tile.offsetWidth) / 2;
    }
    function resize(lane) {
      if (!lane.renderer) return;
      const { width, height } = lane.viewport.getBoundingClientRect();
      if (!width || !height) return;
      lane.sceneWidth = Math.max(7.25, Math.min(12, width / height * 3.4));
      lane.camera.left = -lane.sceneWidth / 2; lane.camera.right = lane.sceneWidth / 2;
      lane.camera.updateProjectionMatrix();
      lane.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
      lane.renderer.setSize(width, height, false);
      lane.dirty = true; schedule();
    }
    function hitAt(lane, event) {
      if (lane.mode !== 'webgl') return null;
      const rect = lane.viewport.getBoundingClientRect();
      lane.raycaster.setFromCamera({ x: (event.clientX - rect.left) / rect.width * 2 - 1, y: 1 - (event.clientY - rect.top) / rect.height * 2 }, lane.camera);
      const hit = lane.raycaster.intersectObjects(lane.groups.map(group => group.userData.product), false).find(entry => {
        const group = lane.groups[entry.object.userData.index];
        return entry.object.material.opacity + group.userData.soft.material.opacity > .12;
      });
      return hit || null;
    }
    lanes.forEach(lane => {
      lane.element.dataset.renderer = 'loading'; lane.element.setAttribute('aria-busy', 'true');
      lane.element.querySelector('.showcase-dual-controls').hidden = false;
      ['prev', 'next'].forEach((name, index) => {
        const button = lane.element.querySelector(`[data-showcase-${name}]`);
        button.disabled = lane.items.length < 2;
        button.addEventListener('click', () => navigate(lane, index ? 1 : -1));
      });
      lane.viewport.addEventListener('keydown', event => {
        if (event.target !== lane.viewport) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault(); navigate(lane, event.key === 'ArrowRight' ? 1 : -1);
        } else if (event.key === ' ') { event.preventDefault(); togglePause(); }
        else if (event.key === 'Enter' && lane.items.length) { event.preventDefault(); location.href = lane.items[lane.activeIndex].href; }
      });
      lane.fallback.addEventListener('scroll', () => {
        if (lane.mode === 'webgl' || !lane.links.length) return;
        const center = lane.fallback.getBoundingClientRect().left + lane.fallback.clientWidth / 2;
        let best = Infinity, nearest = 0;
        lane.links.forEach((link, index) => { const rect = link.getBoundingClientRect(); const distance = Math.abs(rect.left + rect.width / 2 - center); if (distance < best) { best = distance; nearest = index; } });
        label(lane, nearest);
      }, { passive: true });
      lane.viewport.addEventListener('pointerdown', event => {
        if (lane.mode !== 'webgl' || (event.pointerType === 'mouse' && event.button !== 0)) return;
        playOverride = false;
        lane.down = { x: event.clientX, y: event.clientY, travel: lane.travel, id: event.pointerId, drag: false };
        lane.target = null;
        lane.viewport.setPointerCapture?.(event.pointerId);
        lane.dirty = true; schedule();
      });
      lane.viewport.addEventListener('pointermove', event => {
        if (lane.mode !== 'webgl') return;
        if (lane.down && lane.down.id === event.pointerId) {
          const dx = event.clientX - lane.down.x, dy = event.clientY - lane.down.y;
          if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) lane.down.drag = true;
          if (lane.down.drag) {
            lane.travel = lane.down.travel + dx / lane.viewport.clientWidth * lane.sceneWidth;
            lane.viewport.style.cursor = 'grabbing'; lane.dirty = true; schedule();
          }
        } else if (event.pointerType === 'mouse') {
          const hit = hitAt(lane, event), index = hit ? hit.object.userData.index : -1;
          if (index !== lane.hoverIndex) { lane.hoverIndex = index; lane.dirty = true; schedule(); }
          lane.viewport.style.cursor = hit ? 'pointer' : 'grab';
        }
      });
      function finishGesture(event, cancelled = false) {
        if (!lane.down || lane.down.id !== event.pointerId) return;
        const down = lane.down; lane.down = null;
        if (lane.viewport.hasPointerCapture?.(event.pointerId)) lane.viewport.releasePointerCapture(event.pointerId);
        if (down.drag || cancelled) {
          lane.target = Math.round(lane.travel / spacing) * spacing;
          if (reduced.matches) { lane.travel = lane.target; lane.target = null; resetAutomatic(lane); }
          if (down.drag) label(lane, Math.round(-(lane.target ?? lane.travel) / spacing), true);
        } else if (Math.abs(event.clientY - down.y) < 8) {
          const hit = hitAt(lane, event);
          if (hit) location.href = lane.items[hit.object.userData.index].href;
        }
        lane.viewport.style.cursor = 'grab'; lane.dirty = true; schedule();
      }
      lane.viewport.addEventListener('pointerup', event => finishGesture(event));
      lane.viewport.addEventListener('pointercancel', event => finishGesture(event, true));
      lane.viewport.addEventListener('lostpointercapture', event => finishGesture(event, true));
      label(lane, 0);
    });

    function position(lane) {
      let closest = Infinity, nearest = 0;
      lane.groups.forEach((group, index) => {
        const x = wrap(index * spacing + lane.travel, lane.items.length), distance = Math.abs(x);
        if (distance < closest) { closest = distance; nearest = index; }
        const focus = 1 - smooth(distance / (spacing * .9));
        const edge = 1 - smooth((distance - lane.sceneWidth / 2 + .3) / 2.2);
        const scale = .69 + focus * .37;
        group.position.set(x, -.04 + focus * .06, -1.3 + focus * 1.6);
        group.scale.setScalar(scale);
        group.rotation.y = reduced.matches ? 0 : -clamp(x / spacing, -1, 1) * .12;
        const { product, soft, shadow, light } = group.userData;
        product.material.opacity = edge * (.3 + .7 * focus) * focus;
        soft.material.opacity = edge * (.3 + .7 * focus) * (1 - focus);
        shadow.material.opacity = edge * (.07 + .12 * focus);
        light.material.opacity = edge * focus * .34;
        // The sole lift response is direct pointer feedback; no idle bobbing.
        product.position.y = soft.position.y = !reduced.matches && lane.hoverIndex === index ? .035 : 0;
      });
      if (lane.target === null && nearest !== lane.activeIndex) label(lane, nearest);
      lane.scene.updateMatrixWorld(true);
    }
    function render(time) {
      frame = 0;
      if (document.hidden) { lastTime = 0; return; }
      const dt = lastTime ? Math.min((time - lastTime) / 1000, .06) : 0;
      lastTime = time;
      lanes.forEach(lane => {
        if (lane.mode !== 'webgl' || !lane.visible) return;
        let changed = lane.dirty;
        if (lane.target !== null) {
          lane.travel += (lane.target - lane.travel) * (reduced.matches ? 1 : 1 - Math.exp(-dt * 11));
          if (Math.abs(lane.target - lane.travel) < .002) { lane.travel = lane.target; lane.target = null; resetAutomatic(lane); }
          changed = true;
        } else if (automatic(lane)) {
          lane.elapsed += dt;
          // A brief 0.6-second hold and 1.8-second transition keep the first
          // product change visible quickly. Opposite signs preserve direction.
          const progress = clamp((lane.elapsed - .6) / 1.8);
          const next = lane.autoAnchor + lane.direction * spacing * smooth(progress);
          changed ||= next !== lane.travel;
          lane.travel = next;
          if (progress >= 1) resetAutomatic(lane);
        }
        if (changed) {
          position(lane);
          try { lane.renderer.render(lane.scene, lane.camera); lane.frames++; lane.dirty = false; }
          catch (error) { fallback(lane, error.name || 'RenderError'); }
        }
      });
      schedule();
      if (!frame) lastTime = 0;
    }

    // Conservative, opt-in white matting: flood only the exterior near-white
    // background. Existing alpha and enclosed steel highlights are preserved.
    // A one-pixel silhouette guard protects pale product edges. Unknown photos
    // default to preserve; this must never become a blanket white-color key.
    async function productTexture(item) {
      const photo = new Image(); photo.src = item.texture; await photo.decode();
      const scale = Math.min(1, 800 / Math.max(photo.width, photo.height));
      const w = Math.max(1, Math.round(photo.width * scale)), h = Math.max(1, Math.round(photo.height * scale));
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(photo, 0, 0, w, h);
      const image = context.getImageData(0, 0, w, h), pixels = image.data;
      if (item.matte === 'edge-white') {
        const visited = new Uint8Array(w * h), exterior = new Uint8Array(w * h), queue = new Int32Array(w * h);
        let head = 0, tail = 0;
        const push = p => {
          if (visited[p]) return;
          visited[p] = 1;
          const j = p * 4, low = Math.min(pixels[j], pixels[j + 1], pixels[j + 2]), high = Math.max(pixels[j], pixels[j + 1], pixels[j + 2]);
          if (pixels[j + 3] < 16 || (low >= 245 && high - low <= 12)) { exterior[p] = 1; queue[tail++] = p; }
        };
        for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
        for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
        while (head < tail) {
          const p = queue[head++], x = p % w, y = Math.floor(p / w);
          if (x) push(p - 1); if (x < w - 1) push(p + 1); if (y) push(p - w); if (y < h - 1) push(p + w);
        }
        // All-white or badly classified sources are safer left intact.
        if (tail < w * h * .98) {
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const p = y * w + x;
            if (!exterior[p]) continue;
            const guarded = (x && !exterior[p - 1]) || (x < w - 1 && !exterior[p + 1]) || (y && !exterior[p - w]) || (y < h - 1 && !exterior[p + w]);
            if (!guarded) pixels[p * 4 + 3] = 0;
          }
        }
      }
      let left = w, top = h, right = -1, bottom = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (pixels[(y * w + x) * 4 + 3] > 20) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
      }
      if (right < left) throw new Error('EmptyProductTexture');
      context.putImageData(image, 0, 0);
      const padding = 12, cropped = document.createElement('canvas');
      cropped.width = right - left + 1 + padding * 2; cropped.height = bottom - top + 1 + padding * 2;
      cropped.getContext('2d').drawImage(canvas, left, top, right - left + 1, bottom - top + 1, padding, padding, right - left + 1, bottom - top + 1);
      const blurred = document.createElement('canvas'); blurred.width = cropped.width; blurred.height = cropped.height;
      const blurContext = blurred.getContext('2d'); blurContext.filter = 'blur(4px)'; blurContext.drawImage(cropped, 0, 0);
      const texture = new THREE.CanvasTexture(cropped), soft = new THREE.CanvasTexture(blurred);
      [texture, soft].forEach(map => { map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 2; });
      return { texture, soft, ratio: cropped.width / cropped.height };
    }
    function atmosphereTexture(light = false) {
      const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 128;
      const context = canvas.getContext('2d');
      context.scale(1, .5);
      const gradient = context.createRadialGradient(128, 128, 4, 128, 128, 124);
      gradient.addColorStop(0, light ? 'rgba(255,255,255,1)' : 'rgba(45,53,58,.65)');
      gradient.addColorStop(.45, light ? 'rgba(255,255,255,.7)' : 'rgba(45,53,58,.22)');
      gradient.addColorStop(1, light ? 'rgba(255,255,255,0)' : 'rgba(45,53,58,0)');
      context.fillStyle = gradient; context.fillRect(0, 0, 256, 256);
      const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
    }
    async function initialize(lane) {
      if (!window.THREE || !lane.items.length || lane.items.some(item => !item.texture)) { fallback(lane, 'AssetsUnavailable'); return; }
      try {
        lane.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
        lane.renderer.setClearColor(0xffffff, 0); lane.renderer.outputColorSpace = THREE.SRGBColorSpace;
        lane.renderer.domElement.className = 'showcase-dual-canvas'; lane.renderer.domElement.setAttribute('aria-hidden', 'true');
        lane.renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); fallback(lane, 'ContextLost'); });
        lane.scene = new THREE.Scene(); lane.camera = new THREE.OrthographicCamera(-5.5, 5.5, 1.7, -1.7, .1, 30); lane.camera.position.set(0, 0, 10);
        lane.raycaster = new THREE.Raycaster();
        const results = await Promise.allSettled(lane.items.map(productTexture));
        results.forEach(result => { if (result.status === 'fulfilled') lane.textures.push(result.value.texture, result.value.soft); });
        if (!lane.renderer || results.some(result => result.status === 'rejected')) { fallback(lane, 'TextureUnavailable'); return; }
        const shadowMap = atmosphereTexture(), lightMap = atmosphereTexture(true); lane.textures.push(shadowMap, lightMap);
        results.forEach((result, index) => {
          const entry = result.value, group = new THREE.Group();
          const width = Math.min(4.25, 2.72 * entry.ratio), height = width / entry.ratio;
          const plane = (w, h, map) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
          const product = plane(width, height, entry.texture), soft = plane(width, height, entry.soft);
          product.userData.index = index; product.position.z = .04;
          const shadow = plane(Math.min(4.7, width * 1.18), .46, shadowMap); shadow.position.set(0, -height / 2 - .03, -.15);
          const light = plane(5.2, 3.0, lightMap); light.position.z = -.3;
          group.add(light, shadow, soft, product); group.userData = { product, soft, shadow, light };
          lane.scene.add(group); lane.groups.push(group);
        });
        lane.travel = -lane.activeIndex * spacing; resetAutomatic(lane);
        lane.elapsed = lane.direction < 0 ? -.15 : 0;
        lane.viewport.append(lane.renderer.domElement); lane.viewport.tabIndex = 0;
        lane.mode = 'webgl'; lane.element.dataset.renderer = 'webgl'; lane.element.removeAttribute('aria-busy');
        lane.fallback.setAttribute('aria-hidden', 'true'); lane.links.forEach(link => link.tabIndex = -1);
        syncRoot(); resize(lane); schedule();
      } catch (error) { fallback(lane, error.name || 'WebGLUnavailable'); }
    }
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(entries => entries.forEach(entry => { const lane = lanes.find(item => item.viewport === entry.target); if (lane) resize(lane); }));
      lanes.forEach(lane => observer.observe(lane.viewport));
    } else addEventListener('resize', () => lanes.forEach(resize));
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => { const lane = lanes.find(item => item.element === entry.target); if (lane) { lane.visible = entry.isIntersecting; lane.dirty = true; } });
        if (!lanes.some(lane => lane.visible)) stop(); else { lastTime = 0; schedule(); }
      }, { threshold: .01 });
      lanes.forEach(lane => observer.observe(lane.element));
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else dirtyAll(); });
    const reduceChange = () => {
      playOverride = false;
      lanes.forEach(lane => {
        if (reduced.matches) { lane.travel = Math.round(lane.travel / spacing) * spacing; lane.target = null; resetAutomatic(lane); }
      });
      syncRoot(); dirtyAll();
    };
    if (reduced.addEventListener) reduced.addEventListener('change', reduceChange); else reduced.addListener(reduceChange);
    addEventListener('pagehide', stop); addEventListener('pageshow', dirtyAll);
    root.showcaseState = () => ({
      renderer: root.dataset.renderer, productCount: lanes.reduce((sum, lane) => sum + lane.items.length, 0),
      userPaused, hovered, focused, reducedMotion: reduced.matches, visible: lanes.some(lane => lane.visible),
      rendering: !!frame, frames: lanes.reduce((sum, lane) => sum + lane.frames, 0),
      lanes: lanes.map(lane => ({
        id: lane.id, renderer: lane.mode, direction: lane.direction, travel: lane.travel,
        activeIndex: lane.activeIndex, count: lane.items.length, frames: lane.frames, visible: lane.visible,
        positions: lane.groups.map(group => group.position.x), depths: lane.groups.map(group => group.position.z),
        scales: lane.groups.map(group => group.scale.x)
      }))
    });
    syncRoot(); lanes.forEach(initialize);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
