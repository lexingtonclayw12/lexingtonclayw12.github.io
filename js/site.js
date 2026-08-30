(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer  = window.matchMedia('(pointer: fine)').matches;
  var canMotion    = finePointer && !reduceMotion;

  /* ---------- Headline: fire the line reveal on load ---------- */
  var headline = document.querySelector('.hl');
  if (headline) {
    requestAnimationFrame(function () {
      setTimeout(function () { headline.classList.add('lit'); }, 100);
    });
  }

  /* ---------- Nav + scroll progress + hero parallax ---------- */
  var nav = document.getElementById('nav');
  var progressBar = document.getElementById('progress');
  var heroInner = document.getElementById('heroInner');
  var scrollTicking = false;

  var navSolid = false;
  function onScroll() {
    var wantSolid = window.scrollY > 24;
    if (wantSolid !== navSolid) {          // only touch the DOM on an actual change
      navSolid = wantSolid;
      nav.classList.toggle('nav-solid', wantSolid);
    }

    var max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';

    // Hero content drifts up and dissolves as you leave it
    if (heroInner && !reduceMotion) {
      var y = window.scrollY;
      var vh = window.innerHeight;
      if (y < vh) {
        // Hold full opacity through the first quarter, then dissolve as the hero exits
        var faded = Math.max(0, y - vh * 0.25) / (vh * 0.7);
        heroInner.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0)';
        heroInner.style.opacity = String(Math.max(0, 1 - faded));
      }
    }
    scrollTicking = false;
  }

  window.addEventListener('scroll', function () {
    if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- Cursor orb + layered parallax ---------- */
  var orb = document.getElementById('orb');
  var layers = Array.prototype.slice.call(document.querySelectorAll('.plx'));
  var pointerX = 0, pointerY = 0, easedX = 0, easedY = 0, parallaxRaf = null;

  function stepParallax() {
    parallaxRaf = null;
    easedX += (pointerX - easedX) * 0.09;
    easedY += (pointerY - easedY) * 0.09;

    layers.forEach(function (layer) {
      var depth = parseFloat(layer.dataset.depth) || 0;
      layer.style.transform =
        'translate3d(' + (easedX * depth).toFixed(2) + 'px,' + (easedY * depth).toFixed(2) + 'px,0)';
    });

    if (Math.abs(pointerX - easedX) > 0.0008 || Math.abs(pointerY - easedY) > 0.0008) {
      parallaxRaf = requestAnimationFrame(stepParallax);
    }
  }

  if (canMotion) {
    window.addEventListener('pointermove', function (e) {
      pointerX = (e.clientX / window.innerWidth) - 0.5;
      pointerY = (e.clientY / window.innerHeight) - 0.5;

      orb.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
      orb.style.opacity = '1';

      if (!parallaxRaf) parallaxRaf = requestAnimationFrame(stepParallax);
    }, { passive: true });

    document.addEventListener('mouseleave', function () { orb.style.opacity = '0'; });
  }

  /* ---------- Magnetic buttons ---------- */
  if (canMotion) {
    Array.prototype.forEach.call(document.querySelectorAll('.magnetic'), function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - r.left - r.width / 2;
        var dy = e.clientY - r.top - r.height / 2;
        btn.style.setProperty('--tx', (dx * 0.2).toFixed(1) + 'px');
        btn.style.setProperty('--ty', (dy * 0.36).toFixed(1) + 'px');
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.setProperty('--tx', '0px');
        btn.style.setProperty('--ty', '0px');
      });
    });
  }

  /* ---------- Idle ambient animations when their section is off screen ----------
     CSS animations keep compositing even when scrolled out of view, so the
     aurora blobs and scan beam were burning frames the whole way down. */
  (function pauseOffscreenAmbient() {
    if (reduceMotion) return;
    var ambient = document.querySelectorAll('.aurora, .scanline, .ring-spin, .marquee-track');
    if (!('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
      });
    }, { rootMargin: '120px' });

    Array.prototype.forEach.call(ambient, function (el) { io.observe(el); });
  })();

  /* ---------- Hero particle constellation ---------- */
  (function particleField() {
    var canvas = document.getElementById('particles');
    if (!canvas || reduceMotion) return;

    var ctx = canvas.getContext('2d', { alpha: true });
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var TINTS = ['0,242,254', '79,172,254', '123,92,255'];
    var pts = [], W = 0, H = 0;
    var boxLeft = 0, boxDocTop = 0;          // cached geometry, never read during scroll
    var localX = -9999, localY = -9999;
    var visible = true, raf = null;

    function build() {
      var rect = canvas.getBoundingClientRect();
      boxLeft = rect.left;
      boxDocTop = rect.top + window.scrollY;
      W = rect.width; H = rect.height;
      if (!W || !H) return;

      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.min(88, Math.max(24, Math.round(W / 18)));
      pts = [];
      for (var i = 0; i < count; i++) {
        pts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          r: Math.random() * 1.5 + 0.6,
          t: TINTS[i % TINTS.length]
        });
      }
    }

    var LINK2 = 21000;   // squared link radius
    var LINK  = 145;     // its square root, for cheap axis rejection
    var CURSOR2 = 34000;

    // Links are bucketed by opacity so the whole field costs a handful of
    // stroke() calls per frame instead of one per line.
    var BUCKETS = 5;
    var buckets = [];

    function draw() {
      raf = null;
      ctx.clearRect(0, 0, W, H);

      for (var b = 0; b < BUCKETS; b++) buckets[b] = null;

      var i, j, p, q;

      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        p.x += p.vx; p.y += p.vy;

        if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;
      }

      for (i = 0; i < pts.length; i++) {
        p = pts[i];

        for (j = i + 1; j < pts.length; j++) {
          q = pts[j];
          var dx = p.x - q.x;
          if (dx > LINK || dx < -LINK) continue;      // reject on one axis first
          var dy = p.y - q.y;
          if (dy > LINK || dy < -LINK) continue;

          var d2 = dx * dx + dy * dy;
          if (d2 >= LINK2) continue;

          var slot = (1 - d2 / LINK2) * BUCKETS | 0;
          if (slot >= BUCKETS) slot = BUCKETS - 1;
          if (!buckets[slot]) buckets[slot] = new Path2D();
          buckets[slot].moveTo(p.x, p.y);
          buckets[slot].lineTo(q.x, q.y);
        }
      }

      ctx.lineWidth = 1;
      for (i = 0; i < BUCKETS; i++) {
        if (!buckets[i]) continue;
        ctx.strokeStyle = 'rgba(120,190,254,' + (0.035 + i * 0.035).toFixed(3) + ')';
        ctx.stroke(buckets[i]);
      }

      // Cursor web + nodes
      var cursorPath = null;
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        var mdx = p.x - localX, mdy = p.y - localY;
        var md2 = mdx * mdx + mdy * mdy;
        var near = md2 < CURSOR2;

        if (near) {
          if (!cursorPath) cursorPath = new Path2D();
          cursorPath.moveTo(p.x, p.y);
          cursorPath.lineTo(localX, localY);
        }

        ctx.fillStyle = 'rgba(' + p.t + ',' + (near ? 0.95 : 0.5) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, near ? p.r * 1.7 : p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (cursorPath) {
        ctx.strokeStyle = 'rgba(0,242,254,.3)';
        ctx.stroke(cursorPath);
      }

      if (visible) raf = requestAnimationFrame(draw);
    }

    function start() { if (!raf && visible) raf = requestAnimationFrame(draw); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    build();
    start();

    window.addEventListener('resize', function () { build(); }, { passive: true });

    if (finePointer) {
      // Derived from cached geometry + scrollY, so no layout is read while scrolling
      window.addEventListener('pointermove', function (e) {
        localX = e.clientX - boxLeft;
        localY = e.clientY + window.scrollY - boxDocTop;
      }, { passive: true });
    }

    // Stop drawing when the hero scrolls away or the tab is hidden
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      visible ? start() : stop();
    }, { threshold: 0 }).observe(canvas);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); } else { visible = true; start(); }
    });
  })();

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var mobileMenu = document.getElementById('mobileMenu');
  var menuIcon = document.getElementById('menuIcon');
  var OPEN_ICON = '<path d="M4 7h16M4 12h16M4 17h16"/>';
  var CLOSE_ICON = '<path d="M6 6l12 12M18 6L6 18"/>';

  function setMenu(open) {
    mobileMenu.classList.toggle('hidden', !open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuIcon.innerHTML = open ? CLOSE_ICON : OPEN_ICON;
  }
  menuBtn.addEventListener('click', function () {
    setMenu(mobileMenu.classList.contains('hidden'));
  });
  Array.prototype.forEach.call(document.querySelectorAll('.mob-link'), function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  /* ---------- Reveal on scroll ---------- */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (el) {
    revealObserver.observe(el);
  });

  /* ---------- Counters ---------- */
  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    var duration = 1500;
    var start = performance.now();
    function frame(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counterObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  Array.prototype.forEach.call(document.querySelectorAll('.counter'), function (el) {
    counterObserver.observe(el);
  });

  /* ---------- Metric dials ---------- */
  var CIRC = 2 * Math.PI * 52;
  var dialObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var pct = parseFloat(entry.target.dataset.pct) / 100;
      entry.target.style.strokeDashoffset = String(CIRC * (1 - pct));
      dialObserver.unobserve(entry.target);
    });
  }, { threshold: 0.5 });
  Array.prototype.forEach.call(document.querySelectorAll('.dial circle.value'), function (c) {
    c.setAttribute('stroke-dasharray', CIRC.toFixed(1));
    c.style.strokeDashoffset = CIRC.toFixed(1);
    dialObserver.observe(c);
  });

  /* ---------- Case study tabs ---------- */
  var tabButtons = Array.prototype.slice.call(document.querySelectorAll('.tab-btn'));
  var indicator = document.getElementById('tabIndicator');

  function moveIndicator(btn) {
    indicator.style.width = btn.offsetWidth + 'px';
    indicator.style.transform = 'translateX(' + btn.offsetLeft + 'px)';
  }

  function selectTab(name) {
    tabButtons.forEach(function (btn) {
      var active = btn.dataset.tab === name;
      btn.setAttribute('aria-selected', String(active));
      btn.classList.toggle('text-[#04070A]', active);
      btn.classList.toggle('text-white/55', !active);
      if (active) moveIndicator(btn);
    });
    document.getElementById('panel-before').classList.toggle('active', name === 'before');
    document.getElementById('panel-after').classList.toggle('active', name === 'after');
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { selectTab(btn.dataset.tab); });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        var next = btn.dataset.tab === 'before' ? 'after' : 'before';
        selectTab(next);
        document.getElementById('tab-' + next).focus();
      }
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-goto]'), function (btn) {
    btn.addEventListener('click', function () {
      selectTab(btn.dataset.goto);
      document.getElementById('work').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Initial + responsive indicator placement
  function syncIndicator() {
    var active = document.querySelector('.tab-btn[aria-selected="true"]');
    if (active) moveIndicator(active);
  }
  window.addEventListener('resize', syncIndicator);
  window.addEventListener('load', syncIndicator);
  syncIndicator();
  // Fonts can shift button widths after load
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncIndicator);

  /* ---------- Cursor spotlight on cards ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.spotlight'), function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Analytics -------------------------------------------------
     Pushes to dataLayer so whichever tag manager or GA4 property gets wired
     up in the head will pick these up without touching this file again. Safe
     no-op until one is installed. See README for the two placeholders. */
  window.dataLayer = window.dataLayer || [];
  function track(event, detail) {
    window.dataLayer.push(Object.assign({ event: event }, detail || {}));
    if (typeof window.gtag === 'function') window.gtag('event', event, detail || {});
  }

  // Every call/text tap is a lead. These were completely unmeasured before.
  Array.prototype.forEach.call(document.querySelectorAll('a[href^="tel:"]'), function (a) {
    a.addEventListener('click', function () {
      track('lead_call', { location: a.dataset.loc || 'unknown' });
    });
  });

  /* ---------- Sticky mobile call bar ------------------------------------
     Appears once the hero CTA has scrolled out of reach, so a phone visitor
     always has Call and Get Preview within thumb range. */
  (function callBar() {
    var bar = document.getElementById('callbar');
    if (!bar) return;
    document.body.classList.add('has-callbar');

    var trigger = document.querySelector('[data-callbar-after]') || document.querySelector('h1');
    var barVisible = false;
    function sync() {
      var past = trigger ? trigger.getBoundingClientRect().bottom < 0 : window.scrollY > 400;
      // Hide again over the contact form — the real form is already on screen.
      var contact = document.getElementById('contact');
      if (contact) {
        var r = contact.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.75 && r.bottom > 0) past = false;
      }
      if (past !== barVisible) { barVisible = past; bar.classList.toggle('up', past); }
    }
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    sync();
  })();

  /* ---------- Inquiry form ---------- */
  var form = document.getElementById('inquiryForm');
  var successState = document.getElementById('successState');
  var submitBtn = document.getElementById('submitBtn');
  var btnLabel = document.getElementById('btnLabel');
  var formError = document.getElementById('formError');

  if (form) {

  // Web3Forms relays submissions to the studio inbox. This key is public by
  // design — it identifies the form, it is not a secret. Spam is filtered by
  // the honeypot field above.
  var WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
  var WEB3FORMS_KEY = '1bfe32b4-c393-4831-afe8-4cc6ec627ad7';

  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  function showErr(el, msg) {
    el.classList.add('err');
    var box = document.querySelector('[data-err-for="' + el.id + '"]');
    if (box) { box.textContent = msg; box.classList.add('show'); }
  }
  function clearErr(el) {
    el.classList.remove('err');
    var box = document.querySelector('[data-err-for="' + el.id + '"]');
    if (box) box.classList.remove('show');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Three easy fields, and contact can be EITHER email or phone. The old
    // form demanded five including a free-text essay, which is a lot to ask
    // for something advertised as free.
    var firstBad = null;
    ['name', 'business'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (!el.value.trim()) { showErr(el, 'This one we do need.'); if (!firstBad) firstBad = el; }
      else clearErr(el);
    });

    var emailEl = document.getElementById('email');
    var phoneEl = document.getElementById('phone');
    var email = emailEl ? emailEl.value.trim() : '';
    var phone = phoneEl ? phoneEl.value.trim() : '';

    if (!email && !phone) {
      showErr(emailEl, 'An email or a phone number — either is fine.');
      if (!firstBad) firstBad = emailEl;
    } else if (email && !isValidEmail(email)) {
      showErr(emailEl, 'That address looks incomplete.');
      if (!firstBad) firstBad = emailEl;
    } else {
      clearErr(emailEl);
    }

    if (firstBad) { firstBad.focus(); return; }

    // Sending state
    formError.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.style.opacity = '.72';
    btnLabel.textContent = 'Sending…';

    var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    var botcheck = document.getElementById('botcheck');

    // Which page produced the lead. Without this there is no way to tell
    // whether the church page or an area page is doing any work.
    var source = form.dataset.source || document.title;

    fetch(WEB3FORMS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: 'New inquiry (' + source + ') — ' + val('business'),
        from_name: 'Wright Click Studios website',
        name: val('name'),
        business: val('business'),
        email: email || '(not given)',
        phone: phone || '(not given)',
        business_type: val('type') || '(not given)',
        message: val('message') || '(none given)',
        current_website: val('current') || '(none given)',
        page_source: source,
        landing_path: location.pathname,
        botcheck: botcheck && botcheck.checked ? 'true' : ''
      })
    })
      .then(function (res) { return res.json().catch(function () { return { success: res.ok }; }); })
      .then(function (data) {
        if (!data.success) throw new Error(data.message || 'Submission rejected');
        form.classList.add('hidden');
        successState.classList.remove('hidden');
        successState.setAttribute('tabindex', '-1');
        successState.focus();
        track('lead_form', { page_source: source, business_type: val('type') || 'unspecified' });
      })
      .catch(function () {
        // Never show a success state we cannot stand behind.
        formError.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.style.opacity = '';
        btnLabel.textContent = 'Try Again';
      });
  });

  // Clear error styling as the user types
  Array.prototype.forEach.call(form.querySelectorAll('.field'), function (el) {
    el.addEventListener('input', function () { clearErr(el); });
    el.addEventListener('change', function () { clearErr(el); });
  });

  var resetBtn = document.getElementById('resetForm');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      form.reset();
      formError.classList.add('hidden');
      form.classList.remove('hidden');
      successState.classList.add('hidden');
      submitBtn.disabled = false;
      submitBtn.style.opacity = '';
      btnLabel.textContent = 'Claim My Free Design Preview';
    });
  }
  } /* end if (form) */
})();
