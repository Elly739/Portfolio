// Portfolio JavaScript
document.addEventListener('DOMContentLoaded', () => {
  const revealFallbackTimer = setTimeout(() => {
    document.querySelectorAll('[data-reveal]').forEach(item => item.classList.add('is-visible'));
  }, 400);

  const typedTextElement = document.querySelector('.typed-text');
  if (typedTextElement) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const phrases = ['Software Engineer', 'Innovator', 'Full-Stack Developer', 'Problem Solver'];

    if (prefersReducedMotion) {
      typedTextElement.textContent = phrases[0];
      clearTimeout(revealFallbackTimer);
      document.querySelectorAll('[data-reveal]').forEach(item => item.classList.add('is-visible'));
    } else {
      let phraseIndex = 0;
      let charIndex = 0;
      let isDeleting = false;

      if (!typedTextElement.dataset.typewriterInitialized) {
        typedTextElement.dataset.typewriterInitialized = 'true';

        function tick() {
          const currentPhrase = phrases[phraseIndex];
          const content = typedTextElement.textContent;

          if (isDeleting) {
            charIndex = Math.max(0, charIndex - 1);
          } else {
            charIndex = Math.min(currentPhrase.length, charIndex + 1);
          }
          typedTextElement.textContent = currentPhrase.substring(0, charIndex);

          let speed;
          if (!isDeleting && charIndex === currentPhrase.length) {
            speed = 2000;
            isDeleting = true;
          } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            speed = 500;
          } else {
            speed = isDeleting ? 50 : 100;
          }

          window.setTimeout(tick, speed);
        }

        tick();
      }
    }
  }

  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  const themeToggle = document.getElementById('themeToggle');
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'light') {
    document.body.classList.add('light-mode');
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fas fa-sun" aria-hidden="true"></i>';
      themeToggle.setAttribute('aria-pressed', 'true');
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      const isLight = document.body.classList.contains('light-mode');
      themeToggle.innerHTML = isLight ? '<i class="fas fa-sun" aria-hidden="true"></i>' : '<i class="fas fa-moon" aria-hidden="true"></i>';
      themeToggle.setAttribute('aria-pressed', String(isLight));
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
  }

  const navToggle = document.getElementById('navToggle');
  const header = document.querySelector('.site-header');
  const navLinks = document.querySelectorAll('.nav-link');
  if (navToggle && header) {
    navToggle.addEventListener('click', () => {
      const isOpen = header.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        header.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const headerHeight = document.querySelector('header').offsetHeight;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;
          window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
      }
    });
  });

  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    const toggleBackToTop = () => {
      if (window.scrollY > 400) {
        backToTop.classList.add('is-visible');
      } else {
        backToTop.classList.remove('is-visible');
      }
    };
    toggleBackToTop();
    window.addEventListener('scroll', toggleBackToTop);
  }

  const prefersReducedMotionForReveal = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('[data-reveal]');
  if (revealItems.length) {
    if (prefersReducedMotionForReveal) {
      revealItems.forEach(item => item.classList.add('is-visible'));
      clearTimeout(revealFallbackTimer);
    } else if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });

      revealItems.forEach(item => revealObserver.observe(item));

      window.addEventListener('load', () => {
        clearTimeout(revealFallbackTimer);
        revealItems.forEach(item => {
          const rect = item.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            item.classList.add('is-visible');
            revealObserver.unobserve(item);
          }
        });
      });
    } else {
      revealItems.forEach(item => item.classList.add('is-visible'));
      clearTimeout(revealFallbackTimer);
    }
  }

  const filterButtons = document.querySelectorAll('.filter-chip');
  const projectCards = document.querySelectorAll('.project-card');
  if (filterButtons.length && projectCards.length) {
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        const filter = this.getAttribute('data-filter');
        filterButtons.forEach(btn => {
          btn.classList.remove('is-active');
          btn.setAttribute('aria-pressed', 'false');
        });
        this.classList.add('is-active');
        this.setAttribute('aria-pressed', 'true');

        projectCards.forEach(card => {
          const category = card.getAttribute('data-category');
          card.style.display = (filter === 'all' || category === filter) ? '' : 'none';
        });
      });
    });
  }

  const modalTriggers = document.querySelectorAll('[data-modal-open]');
  const modalCloses = document.querySelectorAll('[data-modal-close]');
  let lastFocusedElement = null;

  const openModal = function(modal) {
    if (!modal) return;
    lastFocusedElement = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    const focusTarget = modal.querySelector('[data-modal-close]') || modal.querySelector('.modal-content');
    if (focusTarget) focusTarget.focus();
  };

  const closeModal = function(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (lastFocusedElement) lastFocusedElement.focus();
  };

  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', function() {
      const modalId = this.getAttribute('data-modal-open');
      const modal = document.getElementById('modal-' + modalId);
      openModal(modal);
    });
  });

  modalCloses.forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      closeModal(this.closest('.modal'));
    });
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(event) {
      if (event.target === modal) closeModal(modal);
    });

    modal.addEventListener('keydown', function(event) {
      if (event.key !== 'Tab') return;
      const focusable = modal.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      document.querySelectorAll('.modal.is-open').forEach(closeModal);
    }
  });

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const status = document.getElementById('formStatus');
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const subject = document.getElementById('subject').value.trim();
      const message = document.getElementById('message').value.trim();
      const body = encodeURIComponent(
        'From: ' + name + ' <' + email + '>\n\n' +
        message
      );
      const mailto = 'mailto:iamellyokello@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + body;
      if (status) status.textContent = 'Opening your email client…';
      const link = document.createElement('a');
      link.href = mailto;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      contactForm.reset();
    });
  }

  clearTimeout(revealFallbackTimer);
  document.querySelectorAll('[data-reveal]').forEach(item => item.classList.add('is-visible'));
});

console.log('Portfolio Loaded!');
