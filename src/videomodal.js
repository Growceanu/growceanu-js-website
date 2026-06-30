(() => {
  const modal   = document.getElementById('video-modal');
  if (!modal) return;

  const mount   = document.getElementById('wistia-mount');
  const titleEl = document.querySelector('.video-modal-title .campaign-box-time-days');
  const closeEls = Array.from(modal.querySelectorAll('[data-video-close]'));
  const docEl = document.documentElement;
  const body = document.body;
  const triggerSelector = '[data-video-trigger]';
  const triggerBoundAttr = 'data-vm-bound';
  const isValidVideoId = (id) => /^[A-Za-z0-9_-]{3,80}$/.test(id);
  const handleKeydown = (e) => {
    if (e.key === 'Escape') closeModal();
  };

  let lastFocus = null;
  let savedScrollY = 0;
  let currentVideo = null; // wistia player instance
  const loadedMedias = new Set();
  const modalSpeedMs = (() => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--vm-speed').trim();
    if (!raw) return 400;
    if (raw.endsWith('ms')) return parseFloat(raw);
    if (raw.endsWith('s')) return parseFloat(raw) * 1000;
    const num = parseFloat(raw);
    return Number.isFinite(num) ? num : 400;
  })();

  window._wq = window._wq || [];

  function loadScriptOnce(src, id) {
    return new Promise((resolve, reject) => {
      if (id && document.getElementById(id)) return resolve();
      const s = document.createElement('script');
      if (id) s.id = id;
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load script: ' + src));
      document.head.appendChild(s);
    });
  }

  function loadWistiaCoreOnce() {
    return loadScriptOnce('https://fast.wistia.com/assets/external/E-v1.js', 'wistia-external-e-v1');
  }

  function loadWistiaMediaOnce(videoId) {
    if (loadedMedias.has(videoId)) return Promise.resolve();
    loadedMedias.add(videoId);
    return loadScriptOnce(`https://fast.wistia.com/embed/medias/${encodeURIComponent(videoId)}.jsonp`);
  }

  function buildEmbed(videoId) {
    // Recommended async embed markup (div only; scripts handled by loader)
    // "videoFoam=false" because we control sizing via container; you can set true if you want Wistia responsiveness.
    const div = document.createElement('div');
    div.className = `wistia_embed wistia_async_${videoId}`;
    div.style.width = '100%';
    div.style.height = '100%';
    div.setAttribute('data-wistia-id', videoId);
    return div;
  }

  function openModal({ videoId, title }) {
    savedScrollY = window.pageYOffset || docEl.scrollTop || 0;

    if (!isValidVideoId(videoId)) {
      console.warn('Blocked invalid video id');
      return;
    }

    lastFocus = document.activeElement;
    modal.classList.remove('is-playing');
    modal.classList.remove('is-closing');

    if (titleEl) titleEl.textContent = title || '';

    body.style.position = 'fixed';
    body.style.top = `-${savedScrollY}px`;
    body.style.width = '100%';
    
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    docEl.classList.add('vm-lock');
    body.classList.add('vm-lock');

    // Ensure scripts ready, then mount embed
    loadWistiaCoreOnce()
      .then(() => loadWistiaMediaOnce(videoId))
      .then(() => {
        // Clear any existing embed
        mount.innerHTML = '';
        currentVideo = null;

        // Configure Wistia (NO autoplay)
        window._wq.push({
          id: videoId,
          options: {
            autoPlay: false
          },
          onReady: function(video) {
            currentVideo = video;

            // Ensure paused on open (paranoid-safe)
            try { video.pause(); } catch(e) {}
            
            // Ensure starts NOT playing
            modal.classList.remove('is-playing');

            // When user hits play hide CTA
            video.bind('play', function() {
              modal.classList.add('is-playing');
            });

            // When paused show CTA again
            video.bind('pause', function() {
              modal.classList.remove('is-playing');
            });

            // When video ends show CTA again
            video.bind('end', function() {
              modal.classList.remove('is-playing');
            });
          }
        });

        // Insert embed markup
        mount.appendChild(buildEmbed(videoId));
      })
      .catch((err) => console.warn(err));

    // focus close
    /*const closeBtn = modal.querySelector('.video-modal-close');
    if (closeBtn) closeBtn.focus();*/

    document.addEventListener('keydown', handleKeydown);
  }

  function closeModal() {
    if (!modal.classList.contains('is-open') && !modal.classList.contains('is-closing')) return;
    modal.classList.remove('is-playing');

    modal.classList.remove('is-open');
    modal.classList.add('is-closing');
    modal.setAttribute('aria-hidden', 'true');
    docEl.classList.remove('vm-lock');
    body.classList.remove('vm-lock');
    body.style.position = '';
    body.style.top = '';
    body.style.width = '';
    window.scrollTo(0, savedScrollY);
    document.removeEventListener('keydown', handleKeydown);

    // Stop & cleanup
    if (currentVideo) {
      try { currentVideo.pause(); } catch(e) {}
      currentVideo = null;
    }
    mount.innerHTML = '';

    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    lastFocus = null;

    // Allow CSS fade-out to finish before fully resetting state
    setTimeout(() => {
      modal.classList.remove('is-closing');
    }, modalSpeedMs);
  }

  function handleTriggerClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const t = e.currentTarget;
    const videoId = t.getAttribute('data-video-id');
    const title = t.getAttribute('data-title') || '';
    if (!videoId) {
      console.warn('Missing data-video-id:', t);
      return;
    }
    openModal({ videoId, title });
  }

  function bindTriggers(scope = document) {
    scope.querySelectorAll(triggerSelector).forEach((t) => {
      if (t.getAttribute(triggerBoundAttr) === '1') return;
      const videoId = t.getAttribute('data-video-id');
      if (!videoId || !isValidVideoId(videoId)) return;
      t.setAttribute(triggerBoundAttr, '1');
      t.style.cursor = 'pointer';
      t.addEventListener('click', handleTriggerClick);
    });
  }

  // Close handlers
  closeEls.forEach(el => el.addEventListener('click', closeModal));

  // Trigger handlers
  bindTriggers();

  // Optional API
  window.VideoPopup = { open: openModal, close: closeModal, init: bindTriggers };
})();
