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

const SUPABASE_LIBRARY_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
const loadedScriptPromises = new Map();
let supabaseClientPromise = null;
let supabaseClient = null;

function getSupabaseConfig() {
  return window.BRIGHTCODE_SUPABASE ?? {
    url: '',
    anonKey: '',
  };
}

function isSupabaseReady() {
  const config = getSupabaseConfig();
  const hasRealUrl = typeof config.url === 'string' && /^https?:\/\//i.test(config.url);
  const hasRealKey = typeof config.anonKey === 'string' && !config.anonKey.includes('YOUR_');
  return Boolean(hasRealUrl && hasRealKey);
}

function loadScriptOnce(src) {
  if (loadedScriptPromises.has(src)) {
    return loadedScriptPromises.get(src);
  }

  const promise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);

    if (existingScript) {
      if (window.supabase) {
        resolve();
        return;
      }

      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
    document.head.appendChild(script);
  });

  loadedScriptPromises.set(src, promise);
  return promise;
}

async function getSupabaseClient() {
  if (!isSupabaseReady()) {
    return null;
  }

  if (supabaseClient) {
    return supabaseClient;
  }

  if (!supabaseClientPromise) {
    supabaseClientPromise = (async () => {
      if (!window.supabase) {
        await loadScriptOnce(SUPABASE_LIBRARY_URL);
      }

      const config = getSupabaseConfig();
      supabaseClient = window.supabase.createClient(config.url, config.anonKey);
      return supabaseClient;
    })();
  }

  return supabaseClientPromise;
}

function buildAbsoluteUrl(page) {
  return new URL(page, window.location.href).href;
}

function setStatusMessage(element, message, tone = 'info') {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.hidden = !message;
  element.classList.remove('is-error', 'is-success');

  if (tone === 'error') {
    element.classList.add('is-error');
  }

  if (tone === 'success') {
    element.classList.add('is-success');
  }
}

function formatDateTime(value) {
  if (!value) {
    return 'Date to be announced';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatLabel(value) {
  if (!value) {
    return 'Not set';
  }

  return value
    .toString()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getProfileName(user) {
  return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')?.[0] || 'member';
}

function getPageContainerMessage(pageTitle) {
  return `Set up Supabase credentials to enable ${pageTitle.toLowerCase()}.`;
}

async function handleGoogleSignIn(client, redirectTo, statusElement) {
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    setStatusMessage(statusElement, error.message, 'error');
  }
}

async function initLoginPage() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  if (!loginForm && !signupForm) {
    return;
  }

  const statusElement = document.getElementById('loginStatus');
  const signupStatusElement = document.getElementById('signupStatus');
  const googleButton = document.getElementById('googleLoginBtn');
  const signupGoogleButton = document.getElementById('googleSignupBtn');
  const submitButton = loginForm?.querySelector('button[type="submit"]');
  const signupSubmitButton = signupForm?.querySelector('button[type="submit"]');
  const loginPanel = document.getElementById('loginPanel');
  const signupPanel = document.getElementById('signupPanel');
  const showLoginPanelBtn = document.getElementById('showLoginPanel');
  const showSignupPanelBtn = document.getElementById('showSignupPanel');
  const openSignupLink = document.getElementById('openSignupLink');
  const openLoginLink = document.getElementById('openLoginLink');
  const client = await getSupabaseClient();

  const setAuthMode = (mode) => {
    const isSignup = mode === 'signup';

    if (loginPanel) {
      loginPanel.hidden = isSignup;
    }

    if (signupPanel) {
      signupPanel.hidden = !isSignup;
    }

    if (showLoginPanelBtn) {
      showLoginPanelBtn.classList.toggle('is-active', !isSignup);
      showLoginPanelBtn.setAttribute('aria-selected', String(!isSignup));
    }

    if (showSignupPanelBtn) {
      showSignupPanelBtn.classList.toggle('is-active', isSignup);
      showSignupPanelBtn.setAttribute('aria-selected', String(isSignup));
    }

    const nextHash = isSignup ? '#signup' : '#login';
    if (window.location.hash !== nextHash) {
      history.replaceState(null, '', nextHash);
    }
  };

  const initialMode = window.location.hash === '#signup' ? 'signup' : 'login';
  setAuthMode(initialMode);

  if (showLoginPanelBtn) {
    showLoginPanelBtn.addEventListener('click', () => setAuthMode('login'));
  }

  if (showSignupPanelBtn) {
    showSignupPanelBtn.addEventListener('click', () => setAuthMode('signup'));
  }

  if (openSignupLink) {
    openSignupLink.addEventListener('click', (event) => {
      event.preventDefault();
      setAuthMode('signup');
    });
  }

  if (openLoginLink) {
    openLoginLink.addEventListener('click', (event) => {
      event.preventDefault();
      setAuthMode('login');
    });
  }

  if (!client) {
    setStatusMessage(statusElement, getPageContainerMessage('login'), 'error');
    if (googleButton) googleButton.disabled = true;
    if (signupGoogleButton) signupGoogleButton.disabled = true;
    if (submitButton) submitButton.disabled = true;
    if (signupSubmitButton) signupSubmitButton.disabled = true;
    if (signupStatusElement) {
      setStatusMessage(signupStatusElement, getPageContainerMessage('signup'), 'error');
    }
    return;
  }

  const { data: sessionData } = await client.auth.getSession();
  if (sessionData?.session) {
    window.location.replace('dashboard.html');
    return;
  }

  if (googleButton) {
    googleButton.addEventListener('click', async () => {
      setStatusMessage(statusElement, 'Redirecting to Google...', 'info');
      await handleGoogleSignIn(client, buildAbsoluteUrl('dashboard.html'), statusElement);
    });
  }

  if (signupGoogleButton) {
    signupGoogleButton.addEventListener('click', async () => {
      if (signupStatusElement) {
        setStatusMessage(signupStatusElement, 'Redirecting to Google...', 'info');
      }
      await handleGoogleSignIn(client, buildAbsoluteUrl('dashboard.html'), signupStatusElement);
    });
  }

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      setStatusMessage(statusElement, 'Enter your email and password to continue.', 'error');
      return;
    }

    setStatusMessage(statusElement, 'Signing you in...');
    const { error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatusMessage(statusElement, error.message, 'error');
      return;
    }

    window.location.href = 'dashboard.html';
  });

  signupForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fullName = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (!fullName || !email || !password) {
      setStatusMessage(signupStatusElement, 'Please fill out your name, email, and password.', 'error');
      return;
    }

    setStatusMessage(signupStatusElement, 'Creating your account...');
    const { error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: buildAbsoluteUrl('dashboard.html'),
      },
    });

    if (error) {
      setStatusMessage(signupStatusElement, error.message, 'error');
      return;
    }

    setStatusMessage(signupStatusElement, 'Check your email to finish creating your member account.', 'success');
    setAuthMode('login');
  });
}

function renderLessonRow(lesson) {
  const item = document.createElement('article');
  item.className = 'lesson-item';

  const info = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = lesson.lesson_title || 'Untitled lesson';
  const meta = document.createElement('p');
  meta.textContent = `${formatDateTime(lesson.starts_at)} · ${formatLabel(lesson.progress_state || lesson.lesson_state)}`;

  info.append(title, meta);

  const action = document.createElement('div');
  action.className = 'lesson-action';

  if (lesson.zoom_url) {
    const link = document.createElement('a');
    link.className = 'btn btn-outline lesson-link';
    link.href = lesson.zoom_url;
    link.target = '_blank';
    link.rel = 'noreferrer noopener';
    link.textContent = 'Open Zoom';
    action.appendChild(link);
  } else {
    const text = document.createElement('span');
    text.className = 'status-badge is-muted';
    text.textContent = 'No link yet';
    action.appendChild(text);
  }

  item.append(info, action);
  return item;
}

async function initDashboardPage() {
  const dashboardRoot = document.getElementById('memberDashboard');
  if (!dashboardRoot) {
    return;
  }

  const client = await getSupabaseClient();
  const statusElement = document.getElementById('dashboardStatus');
  const signOutButton = document.getElementById('signOutButton');
  const memberGreeting = document.getElementById('memberGreeting');
  const memberEmail = document.getElementById('memberEmail');
  const nextLessonTitle = document.getElementById('nextLessonTitle');
  const nextLessonTime = document.getElementById('nextLessonTime');
  const nextLessonSummary = document.getElementById('nextLessonSummary');
  const nextLessonLink = document.getElementById('nextLessonLink');
  const nextLessonEmpty = document.getElementById('nextLessonEmpty');
  const lessonStatusBadge = document.getElementById('lessonStatusBadge');
  const lessonTracker = document.getElementById('lessonTracker');
  const lessonList = document.getElementById('lessonList');

  if (!client) {
    setStatusMessage(statusElement, getPageContainerMessage('dashboard'), 'error');
    dashboardRoot.dataset.authState = 'unconfigured';
    if (signOutButton) {
      signOutButton.disabled = true;
    }
    return;
  }

  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) {
    setStatusMessage(statusElement, sessionError.message, 'error');
    return;
  }

  const session = sessionData?.session;
  if (!session) {
    dashboardRoot.dataset.authState = 'guest';
    setStatusMessage(statusElement, 'Sign in to view your lessons, trackers, and Zoom links.', 'error');
    if (signOutButton) {
      signOutButton.hidden = true;
    }
    if (memberGreeting) {
      memberGreeting.textContent = 'Member dashboard';
    }
    if (memberEmail) {
      memberEmail.textContent = 'Log in to see your personal lesson schedule.';
    }
    if (lessonTracker) {
      lessonTracker.textContent = 'No tracker data is available until you sign in.';
    }
    if (lessonList) {
      lessonList.innerHTML = '';
    }
    if (nextLessonTitle) {
      nextLessonTitle.textContent = 'No lesson selected';
    }
    if (nextLessonTime) {
      nextLessonTime.textContent = 'Your next Zoom lesson will appear here after sign in.';
    }
    if (nextLessonLink) {
      nextLessonLink.hidden = true;
    }
    if (nextLessonEmpty) {
      nextLessonEmpty.hidden = false;
    }
    return;
  }

  dashboardRoot.dataset.authState = 'authenticated';
  setStatusMessage(statusElement, '', 'info');
  if (signOutButton) {
    signOutButton.hidden = false;
  }

  if (memberGreeting) {
    memberGreeting.textContent = `Welcome back, ${getProfileName(session.user)}`;
  }

  if (memberEmail) {
    memberEmail.textContent = session.user.email;
  }

  if (signOutButton) {
    signOutButton.addEventListener('click', async () => {
      signOutButton.disabled = true;
      await client.auth.signOut();
      window.location.href = 'login.html';
    });
  }

  const { data: lessons, error: lessonsError } = await client
    .from('member_dashboard_view')
    .select('member_id, full_name, lesson_id, lesson_title, starts_at, zoom_url, lesson_state, progress_state, tracker_notes')
    .eq('member_id', session.user.id)
    .order('starts_at', { ascending: true });

  if (lessonsError) {
    setStatusMessage(statusElement, lessonsError.message, 'error');
    return;
  }

  const safeLessons = lessons ?? [];

  if (lessonTracker) {
    lessonTracker.textContent = safeLessons.length
      ? `${safeLessons.filter((lesson) => lesson.progress_state === 'complete').length} of ${safeLessons.length} lessons marked complete.`
      : 'No lessons are assigned yet.';
  }

  if (lessonList) {
    lessonList.innerHTML = '';

    if (!safeLessons.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No link provided yet. Check back later!';
      lessonList.appendChild(empty);
    } else {
      safeLessons.forEach((lesson) => lessonList.appendChild(renderLessonRow(lesson)));
    }
  }

  const nextLesson = safeLessons[0];
  if (nextLessonTitle) {
    nextLessonTitle.textContent = nextLesson?.lesson_title || 'No lesson selected yet';
  }

  if (nextLessonSummary) {
    nextLessonSummary.textContent = nextLesson?.tracker_notes || 'Your next lesson will appear here.';
  }

  if (lessonStatusBadge) {
    lessonStatusBadge.textContent = nextLesson ? formatLabel(nextLesson.lesson_state) : 'No lesson yet';
    lessonStatusBadge.classList.toggle('is-muted', !nextLesson);
  }

  if (nextLessonTime) {
    nextLessonTime.textContent = nextLesson
      ? `${formatDateTime(nextLesson.starts_at)} · ${formatLabel(nextLesson.lesson_state)}`
      : 'Your next Zoom lesson will appear here once a link is assigned.';
  }

  if (nextLessonLink) {
    if (nextLesson?.zoom_url) {
      nextLessonLink.hidden = false;
      nextLessonLink.href = nextLesson.zoom_url;
      nextLessonLink.textContent = 'Join next Zoom lesson';
    } else {
      nextLessonLink.hidden = true;
    }
  }

  if (nextLessonEmpty) {
    nextLessonEmpty.hidden = Boolean(nextLesson?.zoom_url);
  }
}

async function initAuthExperience() {
  const currentPage = getCurrentPage();

  if (currentPage === 'login.html') {
    await initLoginPage();
    return;
  }

  if (currentPage === 'dashboard.html') {
    await initDashboardPage();
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
