/* Digital Business Grgic — interactions */

/* 0. Always start at the top on (re)load — runs before paint to avoid jump */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.addEventListener('beforeunload', () => window.scrollTo(0, 0));

(function () {
  'use strict';

  /* 0a. Trigger hero entrance sequence after first paint */
  const fireLoaded = () => {
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => document.body.classList.add('is-loaded'));
    });
  };
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    fireLoaded();
  } else {
    window.addEventListener('DOMContentLoaded', fireLoaded);
  }

  /* 1. Sticky nav background on scroll */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* 2. Scroll reveal */
  const reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-revealed'));
  }

  /* 3. Year stamp */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* 4. Service drawer — touch / keyboard fallback (hover handled by CSS) */
  const services = document.querySelectorAll('.service');
  const isTouch = window.matchMedia('(hover: none)').matches;

  const closeAll = (except) => {
    services.forEach((s) => {
      if (s !== except) {
        s.classList.remove('is-open');
        s.setAttribute('aria-expanded', 'false');
      }
    });
  };

  services.forEach((service) => {
    const row = service.querySelector('.service__row');

    // Click to toggle (works on both touch and mouse for accessibility)
    row.addEventListener('click', (e) => {
      // On non-touch, hover already shows it — clicks just lock/unlock open state
      const wasOpen = service.classList.contains('is-open');
      closeAll(service);
      service.classList.toggle('is-open', !wasOpen);
      service.setAttribute('aria-expanded', String(!wasOpen));
    });

    // Keyboard (Enter / Space)
    service.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        row.click();
      }
    });
  });

  // Click outside on touch devices closes any open drawer
  if (isTouch) {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.service')) closeAll(null);
    });
  }

  /* 5. Approach — scroll-pinned carousel */
  const pin = document.querySelector('.approach--pin');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isNarrow = window.matchMedia('(max-width: 900px)').matches;

  if (pin && !reduceMotion && !isNarrow) {
    const wrap = pin.querySelector('.approach__pin-wrap');
    const stage = pin.querySelector('.approach__pin-stage');
    const cards = Array.from(pin.querySelectorAll('.approach__card'));
    const dots = Array.from(pin.querySelectorAll('.approach__timeline li'));
    const total = cards.length;
    let lastActive = 0;
    let ticking = false;

    const setActive = (idx) => {
      if (idx === lastActive) return;
      cards.forEach((c, i) => {
        c.classList.toggle('is-active', i === idx);
        c.classList.toggle('is-out', i < idx);
      });
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
      // Last card is the CTA — toggle the full-bleed glow on the stage
      stage.classList.toggle('is-cta-active', idx === total - 1);
      lastActive = idx;
    };

    const update = () => {
      ticking = false;
      const rect = wrap.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      // progress 0..1 across the pinned region
      const raw = scrollable > 0 ? -rect.top / scrollable : 0;
      const progress = Math.max(0, Math.min(1, raw));

      stage.style.setProperty('--progress', progress.toFixed(4));

      const idx = Math.max(0, Math.min(total - 1, Math.floor(progress * total)));
      setActive(idx);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();

    // Click a timeline dot to jump to that step
    dots.forEach((d, i) => {
      d.addEventListener('click', () => {
        const rect = wrap.getBoundingClientRect();
        const scrollable = rect.height - window.innerHeight;
        // Land in the middle of the target step's slot
        const targetProgress = (i + 0.5) / total;
        const targetY = window.scrollY + rect.top + targetProgress * scrollable;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      });
    });
  }
/* 6. Contact form + booking calendar */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    /* --- Booking calendar (mini) --- */
    const bookToggle = document.getElementById('cf-book');
    const calRoot = document.getElementById('cf-calendar');
    const calMonthLabel = document.getElementById('cf-cal-month');
    const calGrid = document.getElementById('cf-cal-grid');
    const slotsBox = document.getElementById('cf-slots');
    const slotsDayLabel = document.getElementById('cf-slots-day');
    const dateInput = document.getElementById('cf-booking-date');
    const timeInput = document.getElementById('cf-booking-time');
    const submitLabel = document.getElementById('cf-submit-label');
    const calNavs = document.querySelectorAll('.cf-cal-nav');
    const slotBtns = document.querySelectorAll('.cf-slot');

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const today = new Date(); today.setHours(0,0,0,0);
    let viewYear = today.getFullYear();
    let viewMonth = today.getMonth();
    let selectedDate = null; // ISO yyyy-mm-dd
    let selectedTime = null;

    const pad = (n) => String(n).padStart(2, '0');
    const isoOf = (y, m, d) => y + '-' + pad(m + 1) + '-' + pad(d);

    const updateSubmitLabel = () => {
      if (bookToggle && bookToggle.checked && selectedDate && selectedTime) {
        submitLabel.textContent = 'Send & book call';
      } else {
        submitLabel.textContent = 'Send message';
      }
    };

    const renderCalendar = () => {
      calMonthLabel.textContent = monthNames[viewMonth] + ' ' + viewYear;
      calGrid.innerHTML = '';

      // Find weekday of the 1st (Mon=0..Sun=6)
      const first = new Date(viewYear, viewMonth, 1);
      let lead = (first.getDay() + 6) % 7;
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

      const frag = document.createDocumentFragment();
      for (let i = 0; i < lead; i++) {
        const empty = document.createElement('span');
        empty.className = 'cf-day is-empty';
        frag.appendChild(empty);
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(viewYear, viewMonth, d);
        const iso = isoOf(viewYear, viewMonth, d);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cf-day';
        btn.textContent = d;
        btn.setAttribute('data-iso', iso);

        const dow = date.getDay();
        const isPast = date < today;
        const isWeekend = dow === 0 || dow === 6;
        if (isPast || isWeekend) btn.disabled = true;
        if (date.getTime() === today.getTime()) btn.classList.add('is-today');
        if (selectedDate === iso) btn.classList.add('is-selected');

        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          selectedDate = iso;
          dateInput.value = iso;
          slotsDayLabel.textContent = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
          slotsBox.hidden = false;
          calGrid.querySelectorAll('.cf-day').forEach((b) => b.classList.remove('is-selected'));
          btn.classList.add('is-selected');
          updateSubmitLabel();
        });

        frag.appendChild(btn);
      }
      calGrid.appendChild(frag);
    };

    if (bookToggle) {
      bookToggle.addEventListener('change', () => {
        calRoot.hidden = !bookToggle.checked;
        if (bookToggle.checked) renderCalendar();
        updateSubmitLabel();
      });
    }

    calNavs.forEach((nav) => {
      nav.addEventListener('click', () => {
        const dir = parseInt(nav.dataset.dir, 10);
        viewMonth += dir;
        if (viewMonth > 11) { viewMonth = 0; viewYear++; }
        if (viewMonth < 0) { viewMonth = 11; viewYear--; }
        renderCalendar();
      });
    });

    slotBtns.forEach((s) => {
      s.addEventListener('click', () => {
        if (!selectedDate) return;
        slotBtns.forEach((b) => b.classList.remove('is-selected'));
        s.classList.add('is-selected');
        selectedTime = s.dataset.time;
        timeInput.value = selectedTime;
        updateSubmitLabel();
      });
    });

    /* --- Submit (mailto handoff) --- */
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(contactForm);
      const name = String(fd.get('name') || '').trim();
      const email = String(fd.get('email') || '').trim();
      const company = String(fd.get('company') || '').trim();
      const service = String(fd.get('service') || '').trim();
      const budget = String(fd.get('budget') || '').trim();
      const message = String(fd.get('message') || '').trim();
      const wantsBook = !!(bookToggle && bookToggle.checked);
      const bDate = String(fd.get('booking_date') || '').trim();
      const bTime = String(fd.get('booking_time') || '').trim();

      if (wantsBook && (!bDate || !bTime)) {
        alert('Please pick a date and time for your call, or turn off the booking option.');
        return;
      }

      const subjectBase = wantsBook ? 'Discovery call request' : 'Project inquiry';
      const subject = encodeURIComponent(subjectBase + (name ? ' — ' + name : ''));
      const lines = [
        'Name: ' + name,
        'Email: ' + email,
        company ? 'Company: ' + company : null,
        service ? 'Service: ' + service : null,
        budget ? 'Budget: ' + budget : null,
        wantsBook ? 'Booking: ' + bDate + ' at ' + bTime + ' (CET)' : null,
        '',
        message,
      ].filter(Boolean);

      window.location.href =
        'mailto:contact@digital-business-mg.com?subject=' + subject + '&body=' + encodeURIComponent(lines.join('\n'));
    });
  }
})();
