/* =========================================================
   Keirishan Balachandran — Portfolio scripts
   ========================================================= */

/* ---- Edit these to keep the site current ---- */
const CAREER_START = '2023-08'; // first industry role (YYYY-MM)

(function () {
  document.documentElement.classList.remove('no-js');

  /* ---------- Years of experience (auto) ---------- */
  const [sy, sm] = CAREER_START.split('-').map(Number);
  const now = new Date();
  const months = (now.getFullYear() - sy) * 12 + (now.getMonth() + 1 - sm);
  const years = Math.max(1, Math.floor(months / 12));
  document.querySelectorAll('[data-years]').forEach(el => { el.textContent = years; });

  /* ---------- Exact tenure: "X years Y months", recalculated from today's date ---------- */
  const tenureY = Math.floor(Math.max(0, months) / 12), tenureM = Math.max(0, months) % 12;
  const unit = (n, word) => `<b>${n}</b> ${word}${n === 1 ? '' : 's'}`;
  const tenureHTML = [tenureY && unit(tenureY, 'year'), tenureM && unit(tenureM, 'month')].filter(Boolean).join(' ') || unit(0, 'month');
  document.querySelectorAll('[data-tenure]').forEach(el => { el.innerHTML = tenureHTML; });

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = now.getFullYear(); });

  /* ---------- Education status labels ---------- */
  const STATUS = { 'in-progress': 'In progress', 'completed': 'Completed' };
  document.querySelectorAll('[data-status]').forEach(el => {
    const s = el.dataset.status;
    el.textContent = STATUS[s] || s;
    el.classList.add('status', 'status--' + s);
  });

  /* ---------- Intro: data converges into a network, then the screen splits ---------- */
  const root = document.documentElement;
  const introEl = document.querySelector('.intro');
  let resolveIntro;
  const introDone = new Promise(r => { resolveIntro = r; });
  const enterHero = () => requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('entered')));

  if (introEl && root.classList.contains('intro-on')) {
    runIntro();
  } else {
    if (introEl) introEl.remove();
    enterHero();
    resolveIntro();
  }

  function runIntro() {
    const canvas = introEl.querySelector('.intro__graph');
    const ctx = canvas.getContext('2d');
    const log = introEl.querySelector('.intro__log');
    const bar = introEl.querySelector('.intro__bar');
    const pct = introEl.querySelector('.intro__pct');
    const DURATION = 2000;
    const LOG = [
      [0.04, 'connecting data sources', ''],
      [0.30, 'lakehouse · bronze → silver → gold', ''],
      [0.56, 'models & embeddings ready', ''],
      [0.82, 'agents online', 'ai'],
    ];
    const TEAL = '45, 212, 191', INDIGO = '129, 140, 248';
    let w, h, cx, cy, R, pts = [], links = [], raf, start = performance.now(), logged = 0, leaving = false, readyAt = 0;

    const ease = t => 1 - Math.pow(1 - t, 3);
    const setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2; cy = h / 2;
      R = Math.min(w, h) * (w < 600 ? 0.44 : 0.36);
      const n = w < 600 ? 70 : 120;
      const far = Math.hypot(w, h) * 0.65;
      pts = Array.from({ length: n }, () => {
        const a = Math.random() * Math.PI * 2;
        const ring = [0.8, 1, 1.18][(Math.random() * 3) | 0];
        const r = R * ring * (0.94 + Math.random() * 0.12);
        const sa = a + (Math.random() - 0.5) * 1.2;
        return {
          a, r,
          sx: cx + Math.cos(sa) * far, sy: cy + Math.sin(sa) * far,
          d: Math.random() * 0.35,
          ai: Math.cos(a) > 0,           // right half = AI (indigo), left half = Data (teal)
          size: Math.random() * 1.6 + 1.1,
        };
      });
      links = [];
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const A = pts[i], B = pts[j];
          const dx = Math.cos(A.a) * A.r - Math.cos(B.a) * B.r, dy = Math.sin(A.a) * A.r - Math.sin(B.a) * B.r;
          if (Math.hypot(dx, dy) < R * 0.32) links.push([A, B]);
        }
      }
    };

    const pos = (p, k, spin) => {
      const tx = cx + Math.cos(p.a + spin) * p.r, ty = cy + Math.sin(p.a + spin) * p.r;
      return [p.sx + (tx - p.sx) * k, p.sy + (ty - p.sy) * k];
    };

    const frame = now => {
      const t = now - start;
      const P = Math.min(1, Math.max(0, t / DURATION));
      const spin = t * 0.00008;
      ctx.clearRect(0, 0, w, h);

      const prog = pts.map(p => ease(Math.min(1, Math.max(0, (P - p.d) / 0.62))));
      const xy = pts.map((p, i) => pos(p, prog[i], spin));
      const idx = new Map(pts.map((p, i) => [p, i]));

      // links fade in as both ends arrive
      ctx.lineWidth = 1;
      for (const [A, B] of links) {
        const i = idx.get(A), j = idx.get(B);
        const k = Math.min(prog[i], prog[j]);
        if (k < 0.6) continue;
        const col = A.ai && B.ai ? INDIGO : TEAL;
        ctx.strokeStyle = `rgba(${col}, ${(k - 0.6) / 0.4 * 0.28})`;
        ctx.beginPath(); ctx.moveTo(xy[i][0], xy[i][1]); ctx.lineTo(xy[j][0], xy[j][1]); ctx.stroke();
      }
      // points with motion trails
      pts.forEach((p, i) => {
        const col = p.ai ? INDIGO : TEAL;
        const [x, y] = xy[i];
        if (prog[i] < 1) {
          const [px, py] = pos(p, Math.max(0, prog[i] - 0.08), spin);
          const g = ctx.createLinearGradient(px, py, x, y);
          g.addColorStop(0, `rgba(${col}, 0)`); g.addColorStop(1, `rgba(${col}, 0.55)`);
          ctx.strokeStyle = g; ctx.lineWidth = p.size;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
        }
        ctx.fillStyle = `rgba(${col}, ${0.35 + prog[i] * 0.6})`;
        ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2); ctx.fill();
      });

      // HUD: progress + boot log
      bar.style.setProperty('--ip', P);
      pct.textContent = Math.round(P * 100) + '%';
      while (logged < LOG.length && P >= LOG[logged][0]) {
        const [, msg, kind] = LOG[logged++];
        const li = document.createElement('li');
        if (kind) li.className = kind;
        const a = document.createElement('span'); a.textContent = '› ' + msg;
        const b = document.createElement('span'); b.className = 'ok'; b.textContent = '✓';
        li.append(a, b);
        log.appendChild(li);
      }

      if (P >= 1 && !readyAt) {
        readyAt = now;
        introEl.classList.add('is-ready');
        // leave after the hold AND once the last role has been readable for a moment
        const hold = new Promise(r => setTimeout(r, 1100));
        Promise.all([hold, rolesDone.then(() => new Promise(r => setTimeout(r, 900)))]).then(leave);
      }
      raf = requestAnimationFrame(frame);
    };

    function leave() {
      if (leaving) return;
      leaving = true;
      flyMark();
      introEl.classList.add('is-leaving');
      setTimeout(enterHero, 450);
      setTimeout(() => {
        cancelAnimationFrame(raf);
        root.classList.remove('intro-on');
        introEl.remove();
        resolveIntro();
      }, 1350);
    }

    // The big intro "KB" glides to the nav and shrinks into the logo (FLIP-style).
    function flyMark() {
      const from = introEl.querySelector('.intro__mark');
      const to = document.querySelector('.nav .brand__mark');
      if (!from || !to || !from.animate || !to.getClientRects().length) return;
      const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
      if (!a.width || !b.width) return;
      const ghost = from.cloneNode(true);
      ghost.classList.add('intro__ghost');
      Object.assign(ghost.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
      document.body.appendChild(ghost);
      from.style.visibility = 'hidden';
      to.style.visibility = 'hidden';
      const s = b.width / a.width;
      const target = getComputedStyle(to);
      const anim = ghost.animate([
        { transform: 'translate(0, 0) scale(1)' },
        { transform: `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${s})`,
          backgroundColor: target.backgroundColor, borderColor: target.borderTopColor, boxShadow: 'none' },
      ], { duration: 1000, delay: 120, easing: 'cubic-bezier(.65, 0, .25, 1)', fill: 'forwards' });
      const land = () => { to.style.visibility = ''; ghost.remove(); };
      anim.onfinish = land;
      setTimeout(land, 1600); // safety net
    }

    // Role line types out each focus area in turn, ending on the last one.
    // Speeds are tuned so the whole cycle finishes inside the intro (~3s).
    const typeEl = introEl.querySelector('.intro__type');
    const caretEl = introEl.querySelector('.intro__caret');
    const ROLES = [
      ['Data Science', 't-data'],
      ['AI Engineering', 't-ai'],
      ['Forward Deployed Engineering', 't-both'],
    ];
    const typeRoles = async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      await wait(250);
      for (let r = 0; r < ROLES.length && !leaving; r++) {
        const [text, cls] = ROLES[r];
        typeEl.className = 'intro__type ' + cls;
        caretEl.style.color = cls === 't-ai' ? 'var(--ai)' : 'var(--accent)';
        for (let i = 1; i <= text.length && !leaving; i++) { typeEl.textContent = text.slice(0, i); await wait(22); }
        if (r === ROLES.length - 1) break;            // keep the last role on screen
        await wait(320);
        for (let i = text.length; i >= 0 && !leaving; i--) { typeEl.textContent = text.slice(0, i); await wait(12); }
        await wait(80);
      }
    };
    // rolesDone gates the intro exit; capped at 6s so it can never hang
    var rolesDone = Promise.race([
      typeEl ? typeRoles() : Promise.resolve(),
      new Promise(r => setTimeout(r, 6000)),
    ]);

    setup();
    raf = requestAnimationFrame(frame);
    window.addEventListener('resize', () => { if (!leaving) setup(); });
    // skip: button, any key, or click anywhere
    introEl.querySelector('.intro__skip').addEventListener('click', leave);
    introEl.addEventListener('pointerdown', leave);
    document.addEventListener('keydown', function onKey() { leave(); document.removeEventListener('keydown', onKey); });
  }

  /* ---------- Nav: scrolled state + mobile toggle ---------- */
  const nav = document.querySelector('.nav');
  const onScroll = () => nav && nav.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');
  if (toggle && links) {
    const setOpen = open => {
      links.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('path').setAttribute('d', open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16');
    };
    toggle.addEventListener('click', () => setOpen(!links.classList.contains('is-open')));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  }

  /* ---------- Scroll-spy (home page) ---------- */
  const spyLinks = [...document.querySelectorAll('.nav__links a[href^="#"]')];
  if (spyLinks.length && 'IntersectionObserver' in window) {
    const map = new Map();
    // observe every section; ones without a nav link (e.g. hero, "How I build") clear the highlight
    document.querySelectorAll('main section[id]').forEach(sec => map.set(sec, null));
    spyLinks.forEach(a => {
      const sec = document.querySelector(a.getAttribute('href'));
      if (sec) map.set(sec, a);
    });
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          spyLinks.forEach(l => l.classList.remove('is-active'));
          const link = map.get(entry.target);
          if (link) link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, sec) => spy.observe(sec));
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Split-side entrances: left column slides from left, right from right ---------- */
  if (!reduceMotion) {
    document.querySelectorAll('[data-split]').forEach(grid => {
      const items = [...grid.children].filter(el => el.classList.contains('reveal'));
      const gr = grid.getBoundingClientRect();
      const mid = gr.left + gr.width / 2;
      const lefts = items.map(el => { const r = el.getBoundingClientRect(); return r.left + r.width / 2 < mid; });
      const singleColumn = lefts.every(Boolean) || lefts.every(v => !v);
      items.forEach((el, i) => {
        const isLeft = singleColumn ? i % 2 === 0 : lefts[i];
        el.classList.add(isLeft ? 'from-left' : 'from-right');
      });
    });

    /* Section title block-wipe: wrap title text */
    document.documentElement.classList.add('js-wipe');
    document.querySelectorAll('.section__head .section__title').forEach(t => {
      t.innerHTML = `<span class="st-wrap"><span class="st-text">${t.innerHTML}</span></span>`;
    });
  }

  /* ---------- Reveal on scroll (also opens project split-doors) ---------- */
  const reveals = document.querySelectorAll('.reveal, .project');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Project filters (projects page) ---------- */
  const filters = document.querySelectorAll('.filter');
  if (filters.length) {
    const cards = document.querySelectorAll('[data-category]');
    const archive = document.querySelector('details.archive');
    filters.forEach(btn => btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      filters.forEach(b => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      cards.forEach(card => {
        const cats = card.dataset.category.split(' ');
        card.hidden = !(f === 'all' || cats.includes(f));
      });
      if (archive) {
        if (f === 'earlier') archive.open = true;
        const anyVisible = [...archive.querySelectorAll('[data-category]')].some(c => !c.hidden);
        archive.hidden = !anyVisible;
      }
    }));
  }

  /* ---------- Scroll engine: progress bar, hero parallax, timeline, story ---------- */
  const progressBar = document.querySelector('.scroll-progress');
  const heroText = document.querySelector('.hero__grid > div:first-child');
  const heroPhoto = document.querySelector('.hero__photo');
  const timeline = document.querySelector('[data-timeline]');
  const tlItems = timeline ? [...timeline.querySelectorAll('.tl-item')] : [];
  const story = document.querySelector('[data-story]');
  const storyNodes = story ? [...story.querySelectorAll('.p-node')] : [];
  const storyLinks = story ? [...story.querySelectorAll('.p-link')] : [];
  const stages = story ? [...story.querySelectorAll('.stage')] : [];
  const storyBar = story ? story.querySelector('.story__progress') : null;
  const storyMQ = window.matchMedia('(min-width: 1001px) and (min-height: 700px)');
  let lastStage = -1;

  const setStoryMode = () => {
    if (!story) return;
    const live = storyMQ.matches && !reduceMotion;
    story.classList.toggle('is-live', live);
    lastStage = -1;
  };
  setStoryMode();
  if (storyMQ.addEventListener) storyMQ.addEventListener('change', () => { setStoryMode(); update(); });

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  function update() {
    const y = window.scrollY, vh = window.innerHeight;
    const docH = document.documentElement.scrollHeight - vh;

    if (progressBar) progressBar.style.setProperty('--p', docH > 0 ? clamp(y / docH) : 0);

    if (reduceMotion) return;

    // Hero parallax (wide screens, only while hero is on screen)
    if (heroText && y < vh * 1.2 && window.innerWidth > 860) {
      heroText.style.transform = `translateY(${y * 0.12}px)`;
      heroText.style.opacity = String(1 - clamp(y / (vh * 0.9)) * 0.6);
      if (heroPhoto) heroPhoto.style.transform = `translateY(${y * 0.22}px)`;
    }

    // Timeline fill
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const tp = clamp((vh * 0.65 - r.top) / r.height);
      timeline.style.setProperty('--tp', tp);
      tlItems.forEach(it => it.classList.toggle('is-passed', it.getBoundingClientRect().top + 24 < vh * 0.65));
    }

    // Pinned story
    if (story && story.classList.contains('is-live')) {
      const r = story.getBoundingClientRect();
      const total = r.height - vh;
      const sp = clamp(-r.top / (total || 1));
      if (storyBar) storyBar.style.setProperty('--sp', sp);
      const n = storyNodes.length;
      const idx = Math.min(n - 1, Math.floor(sp * n * 0.999));
      if (idx !== lastStage) {
        storyNodes.forEach((node, i) => {
          node.classList.toggle('is-active', i === idx);
          node.classList.toggle('is-done', i < idx);
        });
        storyLinks.forEach((link, i) => {
          link.classList.toggle('is-filled', i < idx);
          link.classList.toggle('is-flowing', i === idx - 1);
        });
        stages.forEach((s, i) => s.classList.toggle('is-current', i === idx));
        lastStage = idx;
      }
    }
  }

  let ticking = false;
  const onScrollFrame = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(() => { update(); ticking = false; }); }
  };
  window.addEventListener('scroll', onScrollFrame, { passive: true });
  window.addEventListener('resize', onScrollFrame);
  update();

  /* ---------- Count-up numbers ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduceMotion && 'IntersectionObserver' in window) {
    const co = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.textContent, 10) || 0;
        const start = performance.now(), dur = 1200;
        const tick = t => {
          const p = Math.min(1, (t - start) / dur);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        el.textContent = '0';
        requestAnimationFrame(tick);
        co.unobserve(el);
      });
    }, { threshold: 0.6 });
    // wait for the intro so the hero numbers count up where the visitor can see them
    introDone.then(() => setTimeout(() => counters.forEach(el => co.observe(el)), 500));
  }

  /* ---------- Cursor spotlight on cards ---------- */
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.card, .project:not(.project--placeholder), .tl-card, .p-node').forEach(el => {
      el.classList.add('spot');
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Live agent trace (hero) ---------- */
  const log = document.querySelector('.trace__log');
  if (log) {
    const STEPS = [
      ['planner', 'decompose("quarterly churn drivers")', 'ai'],
      ['retriever', 'vector_search → 12 chunks', 'ai'],
      ['sql_agent', 'SELECT … FROM gold.customers', 'data'],
      ['pipeline', 'etl: silver → gold  ✓', 'data'],
      ['analyst', 'fit model · feature importance', 'data'],
      ['evaluator', 'groundedness check  ✓', 'ai'],
      ['responder', 'report ready → api /insights', 'ai'],
    ];
    const MAX = 6;
    const add = ([who, msg, kind]) => {
      const li = document.createElement('li');
      const a = document.createElement('span');
      a.className = 'who' + (kind === 'data' ? ' data' : '');
      a.textContent = who;
      const b = document.createElement('span');
      b.className = 'msg';
      b.textContent = msg;
      li.append(a, b);
      log.appendChild(li);
      while (log.children.length > MAX) log.removeChild(log.firstChild);
    };
    if (reduceMotion) {
      STEPS.slice(0, MAX).forEach(add);
    } else {
      let i = 0, timer = null;
      const run = () => { add(STEPS[i % STEPS.length]); i++; };
      const start = () => { if (!timer) { run(); timer = setInterval(run, 1500); } };
      const stop = () => { clearInterval(timer); timer = null; };
      start();
      document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    }
  }

  /* ---------- Neural / data-graph canvas ---------- */
  document.querySelectorAll('.hero__canvas').forEach(canvas => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const TEAL = '45, 212, 191', INDIGO = '129, 140, 248';
    const LINK = 140;
    let w = 0, h = 0, nodes = [], packets = [], raf = null, visible = true;
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(80, Math.max(24, (w * h) / 15000)));
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 1,
        ai: Math.random() < 0.3,
      }));
      packets = [];
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // move
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      // edges
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(${TEAL}, ${(1 - d / LINK) * 0.16})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        // mouse attraction lines
        const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (md < 180) {
          ctx.strokeStyle = `rgba(${INDIGO}, ${(1 - md / 180) * 0.45})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      // spawn packets along live edges
      if (packets.length < 18 && Math.random() < 0.12) {
        const a = nodes[(Math.random() * nodes.length) | 0];
        const near = nodes.filter(b => b !== a && Math.hypot(a.x - b.x, a.y - b.y) < LINK);
        if (near.length) {
          const b = near[(Math.random() * near.length) | 0];
          packets.push({ a, b, t: 0, s: 0.008 + Math.random() * 0.012, ai: a.ai || b.ai });
        }
      }
      // packets
      packets = packets.filter(p => (p.t += p.s) < 1);
      for (const p of packets) {
        const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
        const col = p.ai ? INDIGO : TEAL;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 8);
        g.addColorStop(0, `rgba(${col}, 0.9)`); g.addColorStop(1, `rgba(${col}, 0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
      }
      // nodes
      for (const n of nodes) {
        ctx.fillStyle = `rgba(${n.ai ? INDIGO : TEAL}, 0.7)`;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
    };

    const loop = () => { draw(); raf = requestAnimationFrame(loop); };
    const play = () => { if (!raf && visible && !document.hidden && !reduceMotion) loop(); };
    const pause = () => { cancelAnimationFrame(raf); raf = null; };

    resize();
    draw();
    play();

    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); draw(); }, 150); });
    const host = canvas.parentElement;
    host.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    host.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? play() : pause(); }).observe(canvas);
    }
  });

  /* ---------- Contact form (Google Apps Script) ---------- */
  const form = document.querySelector('#contact-form');
  if (form && window.fetch) {
    const status = form.querySelector('.form__status');
    const btn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      btn.disabled = true;
      status.className = 'form__status';
      status.textContent = 'Sending…';
      try {
        await fetch(form.action, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(new FormData(form)) });
        form.reset();
        status.classList.add('is-ok');
        status.textContent = 'Thanks! Your message has been sent. I usually reply within 24 hours.';
      } catch (err) {
        status.classList.add('is-err');
        status.textContent = 'Something went wrong. Please email me directly at keirishanb@outlook.com.';
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ---------- Casual source protection ----------
     Deterrent only: blocks right-click and the usual view-source / dev-tools shortcuts.
     Form fields keep their right-click menu so visitors can still paste into the contact form. */
  const isField = el => el && el.closest && el.closest('input, textarea, select, [contenteditable]');
  document.addEventListener('contextmenu', e => { if (!isField(e.target)) e.preventDefault(); });
  document.addEventListener('keydown', e => {
    // physical key (e.code) so Option/Alt combos on Mac still match
    const k = e.key === 'F12' ? 'f12' : (e.code || '').replace(/^Key/, '').toLowerCase();
    const mod = e.ctrlKey || e.metaKey;
    const blocked =
      k === 'f12' ||
      (mod && (k === 'u' || k === 's')) ||                                   // view source, save page
      (mod && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) ||        // dev tools (Win/Linux)
      (e.metaKey && e.altKey && (k === 'i' || k === 'j' || k === 'c' || k === 'u')); // dev tools / source (Mac)
    if (blocked) { e.preventDefault(); e.stopPropagation(); }
  }, true);
})();
