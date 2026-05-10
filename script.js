/* ===== SHARED HEADER ===== */
async function loadSharedHeader() {
  const headerMount = document.getElementById('site-header');
  if (!headerMount) {
    initNavbarScroll();
    initHamburgerMenu();
    setActiveNavLink(document);
    return;
  }

  try {
    const response = await fetch('header.html', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    headerMount.innerHTML = await response.text();
    setActiveNavLink(headerMount);
  } catch (error) {
    console.warn('Could not load header.html. Run the site via a local web server.', error);
  }

  initNavbarScroll();
  initHamburgerMenu();
}

async function loadSharedFooter() {
  const footerMount = document.getElementById('site-footer');
  if (!footerMount) {
    return;
  }

  try {
    const response = await fetch('footer.html', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    footerMount.innerHTML = await response.text();
  } catch (error) {
    console.warn('Could not load footer.html. Run the site via a local web server.', error);
  }
}

function getCurrentPage() {
  const path = window.location.pathname;
  const fileName = path.split('/').pop();
  return fileName || 'index.html';
}

function setActiveNavLink(root = document) {
  const currentPage = getCurrentPage();
  const links = root.querySelectorAll('.nav-links a, .mobile-menu a');

  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || link.classList.contains('nav-cta')) {
      return;
    }

    link.classList.toggle('active', href === currentPage);
  });
}

/* ===== NAVBAR SCROLL ===== */
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) {
    return;
  }

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };

  onScroll();
  window.addEventListener('scroll', onScroll);
}

/* ===== HAMBURGER MENU ===== */
function initHamburgerMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!hamburger || !mobileMenu) {
    return;
  }

  const closeMenu = () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  };

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
}

/* ===== FADE-IN ON SCROLL ===== */
function initFadeInOnScroll() {
  const fadeEls = document.querySelectorAll('.fade-in');
  if (!fadeEls.length) {
    return;
  }

  if (!('IntersectionObserver' in window)) {
    fadeEls.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const siblings = Array.from(entry.target.parentElement.querySelectorAll('.fade-in'));
        const siblingIndex = siblings.indexOf(entry.target);

        // Stagger children in the same parent container slightly.
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, 80 * siblingIndex);

        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  fadeEls.forEach((el) => observer.observe(el));
}

/* ===== CONTACT FORM ===== */
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  if (!contactForm || !formSuccess) {
    return;
  }

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!firstName || !lastName || !email || !message) {
      showFormError(contactForm, 'Please fill in all required fields.');
      return;
    }

    if (!isValidEmail(email)) {
      showFormError(contactForm, 'Please enter a valid email address.');
      return;
    }

    // Simulate form submission.
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    setTimeout(() => {
      contactForm.style.display = 'none';
      formSuccess.style.display = 'block';
    }, 900);
  });
}

function showFormError(formEl, msg) {
  let errEl = document.getElementById('formError');
  if (!errEl) {
    errEl = document.createElement('p');
    errEl.id = 'formError';
    errEl.style.cssText = 'color:#EF4444; font-size:0.88rem; margin-bottom:16px; font-weight:500;';
    formEl.prepend(errEl);
  }

  errEl.textContent = msg;
}

/* ===== NEWSLETTER FORM ===== */
function initNewsletterForm() {
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterMsg = document.getElementById('newsletterMsg');

  if (!newsletterForm || !newsletterMsg) {
    return;
  }

  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('newsletterEmail');

    if (!isValidEmail(emailInput.value.trim())) {
      emailInput.style.borderColor = '#EF4444';
      emailInput.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.12)';
      return;
    }

    emailInput.style.borderColor = '';
    emailInput.style.boxShadow = '';
    newsletterForm.style.display = 'none';
    newsletterMsg.style.display = 'block';
  });
}

/* ===== HELPERS ===== */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const THEME_STORAGE_KEY = 'brightcode-theme';

function getSavedTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null;
}

function applySavedTheme() {
  const savedTheme = getSavedTheme();

  if (!savedTheme) {
    document.documentElement.removeAttribute('data-theme');
    return;
  }

  document.documentElement.setAttribute('data-theme', savedTheme);
}

function getActiveTheme() {
  const manualTheme = document.documentElement.getAttribute('data-theme');
  if (manualTheme === 'light' || manualTheme === 'dark') {
    return manualTheme;
  }

  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

function setManualTheme(theme) {
  if (theme !== 'light' && theme !== 'dark') {
    return;
  }

  localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.documentElement.setAttribute('data-theme', theme);
}

function updateThemeToggleButton() {
  const toggleBtn = document.getElementById('themeToggle');
  if (!toggleBtn) {
    return;
  }

  const activeTheme = getActiveTheme();
  const isDarkMode = activeTheme === 'dark';

  toggleBtn.textContent = isDarkMode ? '🌙' : '☀️';
  toggleBtn.setAttribute('aria-label', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
  toggleBtn.title = isDarkMode ? 'Switch to light mode' : 'Switch to dark mode';
}

function initThemeToggle() {
  if (document.getElementById('themeToggle')) {
    updateThemeToggleButton();
    return;
  }

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'themeToggle';
  toggleBtn.className = 'theme-toggle';
  toggleBtn.type = 'button';

  toggleBtn.addEventListener('click', () => {
    const nextTheme = getActiveTheme() === 'dark' ? 'light' : 'dark';
    setManualTheme(nextTheme);
    updateThemeToggleButton();
  });

  document.body.appendChild(toggleBtn);
  updateThemeToggleButton();
}

function initThemeAutoSync() {
  applySavedTheme();

  if (!window.matchMedia) {
    initThemeToggle();
    return;
  }

  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const onThemeChange = () => {
    if (!getSavedTheme()) {
      updateThemeToggleButton();
    }
  };

  initThemeToggle();
  updateThemeToggleButton();

  if (typeof darkModeQuery.addEventListener === 'function') {
    darkModeQuery.addEventListener('change', onThemeChange);
    return;
  }

  if (typeof darkModeQuery.addListener === 'function') {
    darkModeQuery.addListener(onThemeChange);
  }
}

async function initSite() {
  await loadSharedHeader();
  await loadSharedFooter();
  initThemeAutoSync();
  initFadeInOnScroll();
  initContactForm();
  initNewsletterForm();
}

initSite();
