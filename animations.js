// Motion inspired by miligram.pt: smooth scroll, clip-rotating hero word,
// word-by-word heading reveals, staggered cascades and a pinned story column.
(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ready = () => root.classList.remove('anim-pending');

  if (reduce || !window.gsap || !window.ScrollTrigger) { ready(); return; }
  gsap.registerPlugin(ScrollTrigger);

  // Smooth scrolling
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -80 });
    }));
  }

  // Wrap every word in a mask so it can rise into view
  function splitWords(el) {
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.className = 'wi'; i.textContent = part;
            w.appendChild(i); frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) walk(child);
      });
    };
    walk(el);
    return el.querySelectorAll('.wi');
  }

  // Hero entrance
  const hero = gsap.timeline({ defaults: { ease: 'power3.out' }, onStart: ready });
  hero
    .from('.hero .eyebrow', { y: 16, opacity: 0, duration: 0.6 })
    .from(splitWords(document.querySelector('.hero h1')), { yPercent: 110, duration: 1, stagger: 0.06 }, '-=0.3')
    .from('.hero .rotator', { y: 18, opacity: 0, duration: 0.7 }, '-=0.55')
    .from('.hero .lead', { y: 24, opacity: 0, duration: 0.72 }, '-=0.5')
    .from('.hero-actions .btn', { y: 14, opacity: 0, duration: 0.45, stagger: 0.08 }, '-=0.45')
    .from('.hero-mark', { opacity: 0, y: 30, duration: 1.1, ease: 'power2.out' }, 0.5)
    .from('.hero-mark img', { scale: 0.85, rotate: -8, duration: 1.2, ease: 'power4.out' }, 0.6)
    .from('.stats > div', { y: 20, opacity: 0, duration: 0.5, stagger: 0.07 }, '-=0.6');

  // Rotating word with a clip wipe
  const rot = document.querySelector('.rotate-word');
  if (rot) {
    const words = rot.dataset.words.split('|');
    let n = 0;
    const cycle = () => {
      n = (n + 1) % words.length;
      gsap.timeline()
        .to(rot, { clipPath: 'inset(0 100% 0 0)', duration: 0.5, ease: 'power2.in' })
        .add(() => { rot.textContent = words[n]; })
        .to(rot, { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power2.out' })
        .add(() => gsap.delayedCall(1.8, cycle));
    };
    gsap.set(rot, { clipPath: 'inset(0 0% 0 0)' });
    gsap.delayedCall(2.6, cycle);
  }

  // Count-up stats
  document.querySelectorAll('.stats dt').forEach(dt => {
    const m = dt.textContent.match(/^(\d+)(.*)$/);
    if (!m) return;
    const end = +m[1], suffix = m[2], obj = { v: 0 };
    gsap.to(obj, {
      v: end, duration: 1.8, ease: 'power2.out', delay: 1,
      onUpdate: () => { dt.textContent = Math.round(obj.v) + suffix; }
    });
  });

  // Section headings rise word by word, copy follows
  document.querySelectorAll('main section:not(.hero)').forEach(section => {
    const h2 = section.querySelector('h2');
    if (!h2) return;
    const tl = gsap.timeline({
      scrollTrigger: { trigger: h2, start: 'top 86%', toggleActions: 'play none none reverse' }
    });
    const eyebrow = h2.previousElementSibling;
    if (eyebrow && eyebrow.classList.contains('eyebrow')) tl.from(eyebrow, { y: 12, opacity: 0, duration: 0.5, ease: 'power2.out' });
    tl.from(splitWords(h2), { yPercent: 110, duration: 0.9, stagger: 0.04, ease: 'power3.out' }, '-=0.3');
    const p = h2.nextElementSibling;
    if (p && p.tagName === 'P') tl.from(p, { y: 24, opacity: 0, duration: 0.72, ease: 'power2.out' }, '-=0.52');
  });

  // Staggered cascades for tags, cards and list items
  const cascade = (selector, opts = {}) => document.querySelectorAll(selector).forEach(group => {
    gsap.from(group.children, {
      y: opts.y || 14, opacity: 0, duration: opts.duration || 0.45, stagger: opts.stagger || 0.035, ease: 'power2.out',
      scrollTrigger: { trigger: group, start: 'top 88%', toggleActions: 'play none none reverse' }
    });
  });
  cascade('.brand-grid', { y: 24, duration: 0.6, stagger: 0.04 });
  cascade('.spec-grid');
  cascade('.hosp-grid', { y: 18, stagger: 0.03 });
  cascade('.region-list');
  cascade('.contact-list', { y: 18, stagger: 0.08 });

  // Story: intro stays pinned (CSS sticky), timeline draws and items enter one by one
  gsap.fromTo('.timeline', { '--line': 0 }, {
    '--line': 1, ease: 'none',
    scrollTrigger: { trigger: '.timeline', start: 'top 75%', end: 'bottom 60%', scrub: true }
  });
  document.querySelectorAll('.timeline li').forEach(li => {
    gsap.from(li, {
      x: 30, opacity: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: li, start: 'top 85%', toggleActions: 'play none none reverse' }
    });
  });

  // Founders: photo unveils, each person follows
  gsap.from('.founders-photo img', {
    clipPath: 'inset(100% 0 0 0)', scale: 1.15, duration: 1.3, ease: 'power4.out',
    scrollTrigger: { trigger: '.founders-photo', start: 'top 80%', toggleActions: 'play none none reverse' }
  });
  gsap.from('.person', {
    y: 30, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
    scrollTrigger: { trigger: '.founders-copy', start: 'top 75%', toggleActions: 'play none none reverse' }
  });

  // Gallery and map: image reveal plus gentle parallax inside the frame
  document.querySelectorAll('.gallery figure').forEach((fig, i) => {
    const img = fig.querySelector('img');
    gsap.from(img, {
      clipPath: 'inset(0 0 100% 0)', duration: 1.2, delay: i * 0.12, ease: 'power4.out',
      scrollTrigger: { trigger: fig, start: 'top 85%', toggleActions: 'play none none reverse' }
    });
    gsap.fromTo(img, { scale: 1.12, yPercent: -4 }, {
      scale: 1.12, yPercent: 4, ease: 'none',
      scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
  gsap.from('.enquiry', {
    y: 40, opacity: 0, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.enquiry', start: 'top 85%', toggleActions: 'play none none reverse' }
  });
  gsap.from('.map', {
    y: 40, opacity: 0, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.map', start: 'top 90%', toggleActions: 'play none none reverse' }
  });

  // Images load lazily, so refresh trigger positions once they arrive
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
