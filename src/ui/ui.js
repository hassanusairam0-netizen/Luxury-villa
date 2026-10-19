import { gsap } from 'gsap';
import { ROOMS, OUTDOOR, ARRIVAL, PASSAGES } from '../world/plan.js';

// DOM overlay: loader, hero, chapter card, location indicator, room selector
// and finale. The 3D side tells the UI where the camera is; the UI never
// guesses from scroll alone.

const $ = (s) => document.querySelector(s);
const pad = (n) => String(n).padStart(2, '0');

const CORRIDOR = {
  ...PASSAGES[0],
  quote: 'A quiet passage of art, light and olive garden.',
  notes: ['Full-height glazing', 'Walled north garden'],
};

export class UI {
  constructor({ onNavigate, reducedMotion, navTargets }) {
    this.onNavigate = onNavigate;
    this.reduced = reducedMotion;
    this.current = null;
    this.panelOpen = false;
    this.navTargets = navTargets; // id -> progress (0..1)
    this.el = {
      loader: $('#loader'), fill: $('#loader-fill'), ltext: $('#loader-text'), lpct: $('#loader-pct'),
      hero: $('#hero'), cue: $('#scroll-cue'), chapter: $('#chapter'),
      chNum: $('#ch-num'), chName: $('#ch-name'), chQuote: $('#ch-quote'), chNotes: $('#ch-notes'),
      locator: $('#locator'), locNum: $('#loc-num'), locTotal: $('#loc-total'), locRoom: $('#loc-room'), locFill: $('#loc-fill'), ticks: $('#loc-ticks'),
      finale: $('#finale'), footer: $('#footer'), restart: $('#restart-btn'),
      panel: $('#rooms-panel'), list: $('#rooms-list'), explore: $('#explore-btn'), veilB: document.querySelector('.veil--bottom'),
    };
    this.el.locTotal.textContent = '10';
    this.buildTicks();
    this.buildPanel();
    this.buildScreenReaderOutline();
    this.el.restart.addEventListener('click', () => this.onNavigate('restart'));
    this.mobile = window.matchMedia('(max-width: 820px)');
  }

  // ------------------------------------------------------------- loader
  setLoading(pct, text) {
    this.el.fill.style.width = `${Math.round(pct * 100)}%`;
    this.el.lpct.textContent = `${Math.round(pct * 100)}%`;
    if (text) this.el.ltext.textContent = text;
  }

  hideLoader() {
    gsap.to(this.el.loader, { autoAlpha: 0, duration: this.reduced ? 0.01 : 1.4, ease: 'power2.inOut', delay: 0.2 });
    if (!this.reduced) {
      gsap.from([this.el.hero.children, this.el.cue], { y: 24, autoAlpha: 0, duration: 1.6, stagger: 0.12, ease: 'power3.out', delay: 0.7 });
      gsap.from('.top > *', { y: -12, autoAlpha: 0, duration: 1.2, stagger: 0.08, ease: 'power3.out', delay: 0.9 });
    }
  }

  showError(msg) {
    this.el.ltext.textContent = msg;
    this.el.lpct.textContent = '';
  }

  // -------------------------------------------------------- locator ticks
  buildTicks() {
    const items = [...ROOMS, OUTDOOR];
    for (const r of items) {
      const li = document.createElement('li');
      li.style.top = `${this.navTargets[r.id] * 100}%`;
      li.dataset.id = r.id;
      const b = document.createElement('button');
      b.setAttribute('aria-label', `Go to ${r.name}`);
      b.addEventListener('click', () => this.onNavigate(r.id));
      const tip = document.createElement('span');
      tip.className = 'tip';
      tip.textContent = r.name;
      li.append(b, tip);
      this.el.ticks.append(li);
    }
  }

  // --------------------------------------------------------- room panel
  buildPanel() {
    const items = [...ROOMS, OUTDOOR];
    for (const r of items) {
      const li = document.createElement('li');
      li.dataset.id = r.id;
      const b = document.createElement('button');
      b.innerHTML = `<span class="rooms__num">${pad(r.num)}</span><span class="rooms__name">${r.name}</span><span class="rooms__here">You are here</span>`;
      b.addEventListener('click', () => {
        this.closePanel();
        this.onNavigate(r.id);
      });
      li.append(b);
      this.el.list.append(li);
    }
    this.el.explore.addEventListener('click', () => (this.panelOpen ? this.closePanel() : this.openPanel()));
    this.el.panel.querySelectorAll('[data-close]').forEach((n) => n.addEventListener('click', () => this.closePanel()));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.panelOpen) this.closePanel();
      if (e.key === 'Tab' && this.panelOpen) this.trapFocus(e);
    });
  }

  trapFocus(e) {
    const f = [...this.el.panel.querySelectorAll('button')];
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  openPanel() {
    this.panelOpen = true;
    this.lastFocus = document.activeElement;
    this.el.panel.hidden = false;
    this.el.explore.setAttribute('aria-expanded', 'true');
    this.onPanel?.(true);
    const d = this.reduced ? 0.01 : 0.7;
    gsap.fromTo(this.el.panel.querySelector('.rooms__scrim'), { opacity: 0 }, { opacity: 1, duration: d });
    gsap.fromTo(this.el.panel.querySelector('.rooms__sheet'), { xPercent: 100 }, { xPercent: 0, duration: d, ease: 'power3.out' });
    if (!this.reduced) gsap.fromTo(this.el.list.children, { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, stagger: 0.04, delay: 0.15, ease: 'power3.out' });
    setTimeout(() => this.el.panel.querySelector('.rooms__list li.is-current button, .rooms__list button')?.focus(), this.reduced ? 0 : 300);
  }

  closePanel() {
    if (!this.panelOpen) return;
    this.panelOpen = false;
    this.el.explore.setAttribute('aria-expanded', 'false');
    this.onPanel?.(false);
    const d = this.reduced ? 0.01 : 0.5;
    gsap.to(this.el.panel.querySelector('.rooms__scrim'), { opacity: 0, duration: d });
    gsap.to(this.el.panel.querySelector('.rooms__sheet'), {
      xPercent: 100, duration: d, ease: 'power3.in',
      onComplete: () => { this.el.panel.hidden = true; },
    });
    this.lastFocus?.focus?.();
  }

  buildScreenReaderOutline() {
    const ol = document.getElementById('sr-chapters');
    for (const r of [ARRIVAL, ...ROOMS, OUTDOOR]) {
      const li = document.createElement('li');
      li.textContent = `${r.name}. ${r.quote} ${r.notes.join(', ')}.`;
      ol.append(li);
    }
  }

  // --------------------------------------------------------- per frame
  update({ progress, state, hero, finale }) {
    const e = this.el;
    // Hero and cue fade as the journey begins.
    e.hero.style.opacity = hero;
    e.hero.style.transform = `translateY(${(1 - hero) * -30}px)`;
    e.cue.style.opacity = hero;
    // Finale + footer.
    e.finale.style.opacity = finale;
    e.finale.style.visibility = finale > 0.01 ? 'visible' : 'hidden';
    e.finale.style.transform = `translate(-50%, calc(-50% + ${(1 - finale) * 24}px))`;
    const foot = Math.max(0, Math.min(1, (finale - 0.5) * 2));
    e.footer.style.opacity = foot;
    e.footer.style.visibility = foot > 0.01 ? 'visible' : 'hidden';
    // Locator.
    const loc = Math.max(0, Math.min(1, (1 - hero) * 1.4)) * (1 - finale);
    e.locator.style.opacity = loc;
    e.locator.classList.toggle('is-visible', loc > 0.5);
    if (this.mobile.matches) e.locFill.style.transform = `scaleX(${progress})`;
    else e.locFill.style.transform = `scaleY(${progress})`;
    for (const li of e.ticks.children) li.classList.toggle('is-passed', this.navTargets[li.dataset.id] <= progress + 0.0005);
    if (state !== this.current) this.setState(state);
    // Chapter card yields to hero/finale.
    const cardVis = (1 - hero) * (1 - finale);
    e.chapter.style.visibility = cardVis > 0.01 ? 'visible' : 'hidden';
    e.chapter.parentElement && (e.chapter.style.filter = '');
    this.cardVis = cardVis;
    if (this.cardTween === null || !this.cardTween?.isActive()) e.chapter.style.opacity = this.cardShown ? cardVis : 0;
  }

  describe(state) {
    if (state === 'corridor') return { num: null, name: CORRIDOR.name, quote: CORRIDOR.quote, notes: CORRIDOR.notes, loc: '—' };
    if (state === 'arrival') return { num: null, name: ARRIVAL.name, quote: ARRIVAL.quote, notes: ARRIVAL.notes, loc: '00' };
    if (state === 'outdoor') return { num: 10, name: OUTDOOR.name, quote: OUTDOOR.quote, notes: OUTDOOR.notes, loc: '10' };
    const r = ROOMS.find((x) => x.id === state);
    if (r) return { num: r.num, name: r.name, quote: r.quote, notes: r.notes, loc: pad(r.num) };
    return null;
  }

  setState(state) {
    this.current = state;
    const d = this.describe(state);
    const e = this.el;
    // Highlight the current room in the selector + ticks.
    for (const li of e.list.children) li.classList.toggle('is-current', li.dataset.id === state);
    for (const li of e.ticks.children) li.classList.toggle('is-active', li.dataset.id === state);
    if (!d) {
      this.cardShown = false;
      return;
    }
    // Locator: subtle cross-fade of number and room name.
    const swapLoc = () => {
      e.locNum.textContent = d.loc;
      e.locRoom.textContent = d.name;
    };
    if (this.reduced) swapLoc();
    else {
      gsap.killTweensOf([e.locNum, e.locRoom]);
      gsap.to([e.locNum, e.locRoom], {
        autoAlpha: 0, y: -6, duration: 0.25, ease: 'power2.in',
        onComplete: () => {
          swapLoc();
          gsap.fromTo([e.locNum, e.locRoom], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.06, ease: 'power3.out' });
        },
      });
    }
    // Chapter card: out, swap, in (line-by-line).
    const fill = () => {
      e.chNum.textContent = d.num ? `${pad(d.num)} —` : '';
      e.chName.textContent = d.name;
      e.chQuote.innerHTML = `<span class="line"><span>${d.quote}</span></span>`;
      e.chNotes.innerHTML = d.notes.map((n) => `<span>${n}</span>`).join('');
    };
    this.cardShown = true;
    if (this.cardTween) this.cardTween.kill();
    if (this.reduced) {
      fill();
      e.chapter.style.opacity = this.cardVis ?? 1;
      this.cardTween = null;
      return;
    }
    const tl = gsap.timeline();
    tl.to(e.chapter, { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in' });
    tl.add(fill);
    tl.set(e.chapter, { y: 14 });
    tl.to(e.chapter, { opacity: () => this.cardVis ?? 1, y: 0, duration: 0.9, ease: 'power3.out' });
    tl.from(e.chapter.querySelectorAll('.chapter__kicker, .line > span, .chapter__notes span'), { yPercent: 60, opacity: 0, duration: 0.9, stagger: 0.07, ease: 'power3.out' }, '<');
    this.cardTween = tl;
  }
}
