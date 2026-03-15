/* ===== NAVBAR SCROLL ===== */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

/* ===== HAMBURGER MENU ===== */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

// Close mobile menu when a link is clicked
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

/* ===== FADE-IN ON SCROLL ===== */
const fadeEls = document.querySelectorAll('.fade-in');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger children in the same parent container slightly
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, 80 * (Array.from(entry.target.parentElement.querySelectorAll('.fade-in')).indexOf(entry.target)));
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

fadeEls.forEach(el => observer.observe(el));

/* ===== CONTACT FORM ===== */
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName  = document.getElementById('lastName').value.trim();
    const email     = document.getElementById('email').value.trim();
    const message   = document.getElementById('message').value.trim();

    if (!firstName || !lastName || !email || !message) {
      showFormError('Please fill in all required fields.');
      return;
    }

    if (!isValidEmail(email)) {
      showFormError('Please enter a valid email address.');
      return;
    }

    // Simulate form submission
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    setTimeout(() => {
      contactForm.style.display = 'none';
      formSuccess.style.display = 'block';
    }, 900);
  });
}

function showFormError(msg) {
  let errEl = document.getElementById('formError');
  if (!errEl) {
    errEl = document.createElement('p');
    errEl.id = 'formError';
    errEl.style.cssText = 'color:#EF4444; font-size:0.88rem; margin-bottom:16px; font-weight:500;';
    contactForm.prepend(errEl);
  }
  errEl.textContent = msg;
}

/* ===== NEWSLETTER FORM ===== */
const newsletterForm = document.getElementById('newsletterForm');
const newsletterMsg  = document.getElementById('newsletterMsg');

if (newsletterForm) {
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
