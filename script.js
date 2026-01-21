// script.js
document.addEventListener('DOMContentLoaded', function () {
  // Smooth scroll for internal anchors
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  /* Reveal on scroll */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { root: null, threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* Animated counters */
  const animateNumber = (el, target) => {
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.floor(progress * (target - start) + start);
      el.textContent = value;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    };
    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.metric-number').forEach(n => {
          const target = parseInt(n.getAttribute('data-target') || '0', 10);
          animateNumber(n, target);
        });
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.metrics').forEach(el => counterObserver.observe(el));

  /* Carousel (testimonials) */
  document.querySelectorAll('.carousel').forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    const items = Array.from(track.querySelectorAll('.carousel-item'));
    let index = 0;
    const show = (i) => {
      items.forEach((it, idx) => it.classList.toggle('active', idx === i));
    };
    show(index);

    const next = () => { index = (index + 1) % items.length; show(index); };
    const prev = () => { index = (index - 1 + items.length) % items.length; show(index); };

    const nextBtn = carousel.querySelector('.carousel-control.next');
    const prevBtn = carousel.querySelector('.carousel-control.prev');
    if (nextBtn) nextBtn.addEventListener('click', next);
    if (prevBtn) prevBtn.addEventListener('click', prev);

    let timer = setInterval(next, 5000);
    carousel.addEventListener('mouseenter', () => clearInterval(timer));
    carousel.addEventListener('mouseleave', () => { timer = setInterval(next, 5000); });
  });

  /* Modal contact + sticky CTA */
  const modal = document.getElementById('contact-modal');
  const sticky = document.getElementById('sticky-contact');
  const openModal = () => {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    modal.style.display = 'block';
    const firstInput = modal.querySelector('input, textarea, button');
    if (firstInput) firstInput.focus();
  };
  const closeModal = () => {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
  };
  if (sticky) sticky.addEventListener('click', openModal);
  if (modal) {
    modal.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  }

  /* Dark mode toggle */
  const themeToggle = document.getElementById('theme-toggle');
  const root = document.documentElement;
  const setTheme = (t) => {
    // small transition helper: apply class to animate properties
    root.classList.add('theme-transition');
    if (t === 'dark') {
      root.setAttribute('data-theme', 'dark');
      if (themeToggle) themeToggle.textContent = '☼';
    } else {
      root.removeAttribute('data-theme');
      if (themeToggle) themeToggle.textContent = '☾';
    }
    window.setTimeout(() => root.classList.remove('theme-transition'), 360);
  };
  const saved = localStorage.getItem('theme');
  if (saved) setTheme(saved);
  else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
  if (themeToggle) themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
  });

  /* Helper: simple validation and feedback */
  const isValidEmail = (em) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
  const showFeedback = (input, msg) => {
    let fb = input.nextElementSibling;
    if (!fb || !fb.classList || !fb.classList.contains('form-feedback')) {
      fb = document.createElement('div');
      fb.className = 'form-feedback';
      input.parentNode.insertBefore(fb, input.nextSibling);
    }
    fb.textContent = msg;
    fb.style.display = 'block';
    input.classList.add('input-error');
  };
  const clearFeedback = (input) => {
    const fb = input.nextElementSibling;
    if (fb && fb.classList && fb.classList.contains('form-feedback')) fb.style.display = 'none';
    input.classList.remove('input-error');
  };
  const validateForm = (form) => {
    let ok = true;
    form.querySelectorAll('input[required], textarea[required]').forEach(inp => {
      clearFeedback(inp);
      if (!inp.value || inp.value.trim() === '') { showFeedback(inp, 'Ce champ est requis'); ok = false; }
      else if (inp.type === 'email' && !isValidEmail(inp.value)) { showFeedback(inp, 'Adresse email invalide'); ok = false; }
    });
    return ok;
  };

  /* Contact forms handling (all forms with .contact-form) with validation + visual feedback */
  document.querySelectorAll('form.contact-form').forEach(formEl => {
    // clear feedback on input
    formEl.querySelectorAll('input, textarea').forEach(inp => inp.addEventListener('input', () => clearFeedback(inp)));

    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(formEl)) {
        formEl.classList.add('shake');
        setTimeout(() => formEl.classList.remove('shake'), 700);
        return;
      }

      const button = formEl.querySelector('button[type="submit"]') || formEl.querySelector('button');
      const originalText = button ? button.textContent : null;
      if (button) { button.textContent = 'Envoi en cours...'; button.disabled = true; }

      fetch(formEl.action, { method: 'POST', body: new FormData(formEl), headers: { 'Accept': 'application/json' } })
        .then(function (response) {
          if (response.ok) {
            const successEl = formEl.querySelector('.form-feedback.success');
            alert('Merci ! Votre message a été envoyé. Je vous répondrai sous 48h.');
            formEl.reset();
            closeModal();
          } else {
            alert('Erreur lors de l\'envoi. Réessayez ou contactez via WhatsApp.');
          }
        })
        .catch(function () {
          alert('Erreur réseau. Essayez WhatsApp.');
        })
        .finally(function () {
          if (button) { button.textContent = originalText; button.disabled = false; }
        });
    });
  });

  /* Lazy-load images and background images */
  document.querySelectorAll('img').forEach(img => { try { img.loading = 'lazy'; } catch (e) {} });
  const bgObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const src = el.getAttribute('data-bg');
        if (src) {
          el.style.backgroundImage = `url('${src}')`;
          el.classList.add('bg-loaded');
        }
        obs.unobserve(el);
      }
    });
  }, { root: null, threshold: 0.05 });
  document.querySelectorAll('[data-bg]').forEach(el => bgObserver.observe(el));

});