// JavaScript untuk Interaktivitas Portofolio Statis

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Navigation Toggle
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      mainNav.classList.toggle('active');
    });

    // Close nav on click link
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('active');
      });
    });
  }

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
