/* Elevate to Love — client router & views. Zero dependencies. */
(function () {
  const app = document.getElementById('app');
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

  function backLink() { return `<a class="back" onclick="go('home')">← Return home</a>`; }
  function head(eyebrow, title, lede) {
    return `<div class="section-head"><div class="eyebrow">${eyebrow}</div><h2>${title}</h2>${lede ? `<p class="lede muted" style="font-style:italic">${lede}</p>` : ''}</div>`;
  }

  /* Daily Tao — deterministic by day of year */
  function todaysTao() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const day = Math.floor((now - start) / 86400000);
    const t = SD.tao[day % SD.tao.length];
    return { t, dateStr: now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) };
  }

  const views = {
    home() {
      const { t } = todaysTao();
      const cards = [
        ['tao', 'Daily Practice', 'Daily Tao Te Ching', 'A verse from the Tao and a meditation suggestion — fresh each day, to open your morning inward.'],
        ['life', 'Teachings', 'Elevate Your Life to Love', 'The neuroscience and soul of transformation, with assignments to lay down new pathways of love.'],
        ['body', 'Teachings', 'Elevate Your Body to Love', 'Your body as sacred messenger — teachings across the 21 systems, each with a practice.'],
        ['retreat', 'For Retreat-Goers', 'After the Retreat', 'Integration teachings and assignments to protect the opening once you return home.'],
        ['facilitator', 'Certification', 'Body Cards Facilitator Program', 'A paid four-month path to certified facilitator status, with a downloadable manual.'],
        ['lessons', 'For Facilitators', '20-Class Lesson Plan', 'A ready-to-teach, swipeable reference guide — six teachings per class, twenty classes.'],
        ['about', 'Meet Susan', 'About Susan Drury', 'Thirty-plus years of healing work, and the conviction that nothing is beyond healing.'],
        ['faq', 'Questions', 'FAQ', 'Equally informative, spiritual, and grounding — the questions members most often ask.']
      ].map(([r, tag, tt, d]) => `
        <div class="card" onclick="go('${r}')">
          <span class="tag">${tag}</span><h3>${tt}</h3><p>${d}</p>
          <span class="go">Enter →</span>
        </div>`).join('');

      return `
      <section class="hero"><div class="wrap">
        <div class="sun"></div>
        <div class="eyebrow">A Membership Community with Susan Drury</div>
        <h1>Elevate to Love</h1>
        <p class="lede">Weekly gatherings toward healing, embodiment, and presence — coming to know your body from a spiritual perspective. You are welcome here exactly as you are.</p>
        <div class="mt2"><a class="btn btn-gold" onclick="go('tao')">Begin with today's teaching</a>
          <a class="btn btn-ghost" onclick="go('facilitator')">Explore certification</a></div>
      </div></section>

      <section class="block"><div class="wrap">
        <div class="tao-panel">
          <div class="chapter">Today · Tao Te Ching · Chapter ${t.n}</div>
          <h2>${esc(t.title)}</h2>
          <div class="tao-verse">${esc(t.verse)}</div>
          <h4>Meditation suggestion</h4><p>${esc(t.meditation)}</p>
          <a class="btn btn-ghost" style="margin-top:20px;border-color:var(--gold);color:var(--gold)" onclick="go('tao')">Open the daily practice</a>
        </div>
      </div></section>

      <section class="block alt"><div class="wrap">
        ${head('Your Membership', 'Everything within your practice')}
        <div class="grid">${cards}</div>
      </div></section>

      <section class="block"><div class="narrow center">
        <div class="pill">Weekly · Online · Together</div>
        <h2 class="mt2">This is not about achieving a perfect peace.</h2>
        <p>It is about developing a conscious, loving relationship with all of yourself — in a safe and sacred home, in good company. The insight becomes embodied. The inspiration becomes your orientation.</p>
        <div class="mt2"><a class="btn btn-gold" onclick="go('faq')">See how it works</a></div>
      </div></section>`;
    },

    tao() {
      const { t, dateStr } = todaysTao();
      const others = SD.tao.filter(x => x.n !== t.n).map(x => `
        <details class="acc"><summary>Chapter ${x.n} — ${esc(x.title)}<span class="theme">Tao</span></summary>
          <div class="body"><div class="tao-verse" style="color:var(--ink);font-size:1.25rem">${esc(x.verse)}</div>
          <h4>Meditation</h4><p>${esc(x.meditation)}</p></div></details>`).join('');
      return `<section class="block"><div class="narrow">
        ${head('Daily Practice', 'Daily Tao Te Ching', dateStr)}
        <div class="tao-panel">
          <div class="chapter">Today · Chapter ${t.n}</div><h2>${esc(t.title)}</h2>
          <div class="tao-verse">${esc(t.verse)}</div>
          <h4>Meditation suggestion</h4><p>${esc(t.meditation)}</p>
        </div>
        <h3 class="mt2" style="text-align:center;color:var(--gold-deep)">The wider well</h3>
        <p class="center muted">Return to any verse that calls more insistently. We are like onions with many layers.</p>
        ${others}${backLink()}
      </div></section>`;
    },

    life() { return teachingPage('Elevate Your Life to Love', 'Teachings & Assignments',
      'Understanding our human wiring — so we can consciously, lovingly, lay down new pathways.', SD.elevateLife); },

    body() { return teachingPage('Elevate Your Body to Love', 'Teachings & Assignments',
      'Your body isn\'t malfunctioning — it\'s communicating. Each teaching carries a practice.', SD.elevateBody, true); },

    retreat() { return teachingPage('After the Retreat', 'For Retreat-Goers',
      'The real work begins when you come home. Integration is slower than revelation — and just as sacred.', SD.retreat); },

    facilitator() {
      const p = SD.facilitatorProgram;
      const months = p.months.map(m => `
        <div class="teaching">
          <span class="pill">${esc(m.month)}</span>
          <h3 class="mt2">${esc(m.theme)}</h3>
          <p>${esc(m.focus)}</p>
          <div class="assignment"><strong>Teachings for facilitators</strong>
            <ol style="margin:8px 0 0">${m.teachings.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
          </div></div>`).join('');
      return `<section class="block"><div class="narrow">
        ${head('Paid Certification', 'Body Cards Facilitator Program', p.intro)}
        <div class="tier feature mb2">
          <span class="pill">4-Month Certification</span>
          <div class="price mt2">${esc(p.price)}</div>
          <p>Certified facilitator status for The Elevate Your Body To Love card system.</p>
          <a class="btn btn-gold" href="facilitator-manual.html" target="_blank">Download the Facilitator Manual (PDF-ready)</a>
        </div>
        ${months}
        <div class="teaching"><h3>Upon certification</h3>
          <p>You receive certified facilitator status, the downloadable manual above, and full access to the ready-to-teach 20-class lesson plan — six teachings per class — so you can swipe, reference, and present with ease.</p>
          <a class="btn btn-ghost" onclick="go('lessons')">Open the lesson plans →</a></div>
        ${backLink()}
      </div></section>`;
    },

    lessons() {
      const cards = SD.lessons.map((c, i) => `
        <div class="classcard">
          <div class="num">${String(i + 1).padStart(2, '0')}</div>
          <h3>${esc(c.title)}</h3>
          <ol>${c.teachings.map(t => `<li>${esc(t)}</li>`).join('')}</ol>
        </div>`).join('');
      return `<section class="block"><div class="wrap">
        ${head('For Certified Facilitators', 'The 20-Class Lesson Plan',
          'A recommended arc across twenty classes, six teachings each — a swipeable reference guide for teaching with ease.')}
        <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${cards}</div>
        <div class="center">${backLink()}</div>
      </div></section>`;
    },

    about() {
      const paras = SD.about.map(p => `<p>${esc(p)}</p>`).join('');
      return `<section class="block"><div class="narrow">
        ${head('Meet Susan', 'About Susan Drury')}
        <div class="teaching" style="border-left-color:var(--sage)">${paras}</div>
        ${backLink()}
      </div></section>`;
    },

    faq() {
      const items = SD.faq.map(f => `
        <details><summary>${esc(f.q)}</summary><div class="a">${esc(f.a)}</div></details>`).join('');
      return `<section class="block"><div class="narrow faq">
        ${head('Questions', 'Frequently Asked', 'Equally informative, spiritually inspiring, and grounding.')}
        ${items}
        <div class="blessing mt2">May you walk this path with trust in your own
ever-present, inherent wisdom to heal.</div>
        ${backLink()}
      </div></section>`;
    }
  };

  function teachingPage(title, eyebrow, lede, list, isBody) {
    const items = list.map(x => `
      <div class="teaching">
        ${isBody && x.system ? `<span class="pill">${esc(x.system)}</span>` : ''}
        <h3 class="${isBody && x.system ? 'mt2' : ''}">${esc(x.title)}</h3>
        <p>${esc(x.teaching)}</p>
        <div class="assignment"><strong>Assignment · </strong>${esc(x.assignment)}</div>
      </div>`).join('');
    return `<section class="block"><div class="narrow">
      ${head(eyebrow, title, lede)}${items}${backLink()}
    </div></section>`;
  }

  window.go = function (route) {
    if (!views[route]) route = 'home';
    if (location.hash !== '#' + route) history.pushState({}, '', '#' + route);
    render(route);
    document.getElementById('navlinks').classList.remove('open');
    document.querySelectorAll('.nav-links a').forEach(a =>
      a.classList.toggle('active', a.getAttribute('onclick') === `go('${route}')`));
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  };

  function render(route) { app.innerHTML = views[route](); }
  window.addEventListener('popstate', () => render((location.hash.slice(1)) || 'home'));

  const initial = location.hash.slice(1);
  window.go(views[initial] ? initial : 'home');
})();
