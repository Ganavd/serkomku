// JavaScript untuk Interaktivitas Portofolio Statis

document.addEventListener('DOMContentLoaded', () => {
  // 1. Offcanvas Drawer Navigation & Hamburger Toggle
  const menuToggle = document.getElementById('menuToggle');
  const navDrawer = document.getElementById('navDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawerClose = document.getElementById('drawerClose');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  function openDrawer() {
    if (navDrawer && drawerOverlay && menuToggle) {
      navDrawer.classList.add('open');
      drawerOverlay.classList.add('active');
      menuToggle.classList.add('active');
      menuToggle.setAttribute('aria-expanded', 'true');
      navDrawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden'; // Mencegah scroll latar saat menu terbuka
    }
  }

  function closeDrawer() {
    if (navDrawer && drawerOverlay && menuToggle) {
      navDrawer.classList.remove('open');
      drawerOverlay.classList.remove('active');
      menuToggle.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      navDrawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      if (navDrawer && navDrawer.classList.contains('open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  if (drawerClose) {
    drawerClose.addEventListener('click', closeDrawer);
  }

  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeDrawer);
  }

  // Tutup drawer ketika salah satu link navigasi diklik
  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Tutup drawer ketika menekan tombol Escape (aksesibilitas)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navDrawer && navDrawer.classList.contains('open')) {
      closeDrawer();
    }
  });

  // 2. Contact Form Validation
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      let isValid = true;

      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const messageInput = document.getElementById('message');

      const nameError = document.getElementById('nameError');
      const emailError = document.getElementById('emailError');
      const messageError = document.getElementById('messageError');
      const formSuccess = document.getElementById('formSuccess');

      // Reset errors
      [nameError, emailError, messageError].forEach(el => {
        if (el) el.style.display = 'none';
      });

      // Name validation
      if (!nameInput.value.trim()) {
        nameError.textContent = 'Nama lengkap wajib diisi.';
        nameError.style.display = 'block';
        isValid = false;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailInput.value.trim()) {
        emailError.textContent = 'Alamat email wajib diisi.';
        emailError.style.display = 'block';
        isValid = false;
      } else if (!emailRegex.test(emailInput.value.trim())) {
        emailError.textContent = 'Format email tidak valid.';
        emailError.style.display = 'block';
        isValid = false;
      }

      // Message validation
      if (!messageInput.value.trim()) {
        messageError.textContent = 'Pesan tidak boleh kosong.';
        messageError.style.display = 'block';
        isValid = false;
      }

      if (isValid) {
        formSuccess.textContent = 'Terima kasih! Pesan Anda berhasil dikirim.';
        formSuccess.style.display = 'block';
        contactForm.reset();
        
        setTimeout(() => {
          formSuccess.style.display = 'none';
        }, 5000);
      }
    });
  }
});
