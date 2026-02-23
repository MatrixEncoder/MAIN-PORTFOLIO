/* =============================================
   PORTFOLIO JAVASCRIPT
   - Lenis smooth scroll
   - GSAP + ScrollTrigger (using .from() so content
     is always visible if JS fails)
   - Custom cursor
   - Nav active state
   ============================================= */

// ======== SMOOTH SCROLL (Lenis) ========
let lenis;
try {
  lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.85,
    touchMultiplier: 2,
  });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
} catch (e) {
  // Lenis unavailable — fall back to native scroll
  lenis = null;
}

// ======== GSAP SETUP ========
try {
  gsap.registerPlugin(ScrollTrigger);

  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  // ---- HERO SECTION — animate FROM hidden ----
  // Only targeting elements that actually exist now
  const heroTl = gsap.timeline({ delay: 0.2 });
  heroTl
    .from('.name-line', { opacity: 0, y: 30, stagger: 0.2, duration: 1.2, ease: 'power4.out' })
    .from('.hero-tagline', { opacity: 0, scaleX: 0, duration: 1, ease: 'power3.out' }, '-=0.6')
    .from('.hero-learn-more, .hero-scroll-hint', { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out' }, '-=0.4');

  // ---- SPLINE PERFORMANCE OPTIMIZATION ----
  // Pause/Hide Spline when scrolled past hero to save GPU.
  // We skip this logic and remove Spline entirely ONLY if it's a touch device in narrow mobile view.
  const splineViewer = document.querySelector('.hero-spline');
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Use matchMedia to perfectly align JS layout logic with the CSS media queries.
  // This prevents accidental removal when users request "Desktop View" on their phones.
  const isNarrowMobileView = window.matchMedia('(max-width: 768px)').matches;

  if (splineViewer && (!isTouch || !isNarrowMobileView)) {
    // Desktop View, Tablet View, or Desktop PC: Keep Spline, just pause off-screen
    ScrollTrigger.create({
      trigger: '.section-hero',
      start: 'bottom top',
      onEnter: () => {
        splineViewer.style.visibility = 'hidden';
        splineViewer.style.pointerEvents = 'none';
      },
      onLeaveBack: () => {
        splineViewer.style.visibility = 'visible';
        splineViewer.style.pointerEvents = 'auto';
      }
    });

    // Ensure Spline is visible at JS runtime if it was kept
    splineViewer.style.display = 'block';

  } else if (splineViewer && isTouch && isNarrowMobileView) {
    // Narrow Mobile View on Phone: Force direct removal/hiding for absolute performance
    splineViewer.remove();
  }

  // ---- CONSOLIDATED BATCHED REVEALS (Primary Animation Logic) ----
  // We rely on ONE batch for everything marked with .reveal-up
  ScrollTrigger.batch('.reveal-up', {
    onEnter: (elements) => {
      gsap.from(elements, {
        opacity: 0,
        y: 40,
        stagger: 0.15,
        duration: 0.8,
        ease: 'power2.out',
        overwrite: true
      });
    },
    start: 'top 94%',
    once: true
  });

  // ---- SECTION HEADINGS — word split (Kept separate for visual style) ----
  document.querySelectorAll('.section-heading').forEach((el) => {
    const html = el.innerHTML;
    const parts = html.split(/(<[^>]+>|\s+)/g);
    el.innerHTML = parts.map((p) => {
      if (p.match(/^<[^>]+>$/)) return p;
      if (!p.trim()) return p;
      return `<span style="display:inline-block; overflow:hidden; vertical-align:bottom;">` +
        `<span class="word-inner" style="display:inline-block;">${p}</span></span>`;
    }).join('');

    gsap.from(el.querySelectorAll('.word-inner'), {
      y: '105%', opacity: 0, stagger: 0.05, duration: 0.7, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 94%', once: true }
    });
  });

  // ---- ORB PARALLAX ----
  document.querySelectorAll('.orb').forEach((orb) => {
    gsap.to(orb, {
      y: '-20%', ease: 'none',
      scrollTrigger: { trigger: '.section-hero', start: 'top top', end: 'bottom top', scrub: 0.5 }
    });
  });

  // ---- SAFETY BACKUP REVEAL ----
  // In case GSAP fails to trigger, we reveal everything after 3 seconds
  gsap.delayedCall(3, () => {
    gsap.set('.reveal-up, .word-inner, .skill-category, .project-card, .exp-card', { opacity: 1, y: 0, visibility: 'visible' });
    console.log('Safety reveal backup triggered.');
  });

} catch (e) {
  // GSAP unavailable — all content remains fully visible (no hidden state set)
  console.warn('GSAP not available, animations disabled:', e.message);
}

// ======== CUSTOM CURSOR ========
const cursor = document.getElementById('cursor');
const cursorFollow = document.getElementById('cursorFollower');

if (cursor && cursorFollow) {
  // Set initial centering offsets independently of x/y
  gsap.set([cursor, cursorFollow], { xPercent: -50, yPercent: -50 });

  const xSet = gsap.quickSetter(cursor, "x", "px");
  const ySet = gsap.quickSetter(cursor, "y", "px");
  const xFollowSet = gsap.quickSetter(cursorFollow, "x", "px");
  const yFollowSet = gsap.quickSetter(cursorFollow, "y", "px");

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let followX = mouseX;
  let followY = mouseY;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Move the dot IMMEDIATELY on mousemove for zero-lag feeling
    xSet(mouseX);
    ySet(mouseY);
  });

  // Snappier interpolation (0.35 for a tighter trail)
  gsap.ticker.add(() => {
    const dt = 1.0 - Math.pow(1.0 - 0.35, gsap.ticker.deltaRatio());

    followX += (mouseX - followX) * dt;
    followY += (mouseY - followY) * dt;

    xFollowSet(followX);
    yFollowSet(followY);
  });

  document.querySelectorAll('a, button, [data-cursor="link"]').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      gsap.to(cursor, { width: 14, height: 14, backgroundColor: '#fff', duration: 0.3 });
      gsap.to(cursorFollow, { width: 52, height: 52, duration: 0.3 });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(cursor, { width: 8, height: 8, backgroundColor: '#E1381A', duration: 0.3 });
      gsap.to(cursorFollow, { width: 32, height: 32, duration: 0.3 });
    });
  });
}

// ======== NAV: SCROLL STATE + ACTIVE LINK ========
const nav = document.getElementById('nav');
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');

function setActiveNav(id) {
  navLinks.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
  });
}

// Use IntersectionObserver (works without GSAP)
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) setActiveNav(entry.target.id);
  });
}, { threshold: 0.4 });
sections.forEach((s) => observer.observe(s));

window.addEventListener('scroll', () => {
  nav.classList.toggle('nav-scrolled', window.scrollY > 80);
}, { passive: true });

// ======== SMOOTH ANCHOR LINKS ========
document.querySelectorAll('a[href^="#"], .btn[href^="#"]').forEach((el) => {
  el.addEventListener('click', (e) => {
    const href = el.getAttribute('href');
    const target = href && document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    if (lenis) {
      lenis.scrollTo(target, { offset: -80, duration: 1.6 });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ======== GLASS CARD TILT ========
document.querySelectorAll('.glass-card, .skill-category').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const rx = ((e.clientY - r.top - r.height / 2) / (r.height / 2)) * -4;
    const ry = ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 4;
    card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

// ======== SCROLL PROGRESS BAR ========
const bar = document.createElement('div');
bar.id = 'scroll-progress';
bar.style.cssText = 'position:fixed;top:0;left:0;height:2px;width:0;z-index:9998;background:linear-gradient(to right,#E1381A,#ff6b47);pointer-events:none;transition:width 0.05s linear;';
document.body.appendChild(bar);

window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
}, { passive: true });

// ======== CONTACT FORM SUBMISSION ========
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('.btn-send');
    const originalText = btn.innerHTML;

    // Simple visual feedback
    btn.innerHTML = '<span>Sending...</span>';
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.7';

    const formData = new FormData(contactForm);
    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: json
    })
      .then(async (response) => {
        let json = await response.json();
        if (response.status == 200) {
          btn.innerHTML = '<span>Message Sent!</span>';
          btn.style.background = '#28a745';
          contactForm.reset();
        } else {
          console.log(response);
          btn.innerHTML = '<span>Error! Try again.</span>';
          btn.style.background = '#dc3545';
        }
      })
      .catch(error => {
        console.log(error);
        btn.innerHTML = '<span>Error! Try again.</span>';
        btn.style.background = '#dc3545';
      })
      .then(() => {
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.style.pointerEvents = 'all';
          btn.style.opacity = '1';
        }, 3000);
      });
  });
}

// ======== MOBILE MENU LOGIC ========
const menuToggle = document.getElementById('menuToggle');
const menuClose = document.getElementById('menuClose');
const mobileMenu = document.getElementById('mobileMenu');
const mobileLinks = document.querySelectorAll('.mobile-link');

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', () => {
    document.body.classList.toggle('menu-open');
    mobileMenu.classList.toggle('active');
  });

  if (menuClose) {
    menuClose.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
      mobileMenu.classList.remove('active');
    });
  }

  mobileLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Only auto-close the menu if it's an internal # anchor link
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        document.body.classList.remove('menu-open');
        mobileMenu.classList.remove('active');
      }
    });
  });
}

// ======== TOUCH DEVICE DETECTION ========
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (isTouchDevice) {
  document.body.classList.add('touch-device');
}

