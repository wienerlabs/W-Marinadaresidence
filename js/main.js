(function () {
  const style = document.createElement("style");
  style.textContent = `
    .animate-on-scroll { animation-play-state: paused !important; }
    .animate-on-scroll.animate { animation-play-state: running !important; }
  `;
  document.head.appendChild(style);
  const once = true;
  if (!window.__inViewIO) {
    window.__inViewIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate");
          if (once) window.__inViewIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -5% 0px" });
  }
  window.initInViewAnimations = function (selector = ".animate-on-scroll") {
    document.querySelectorAll(selector).forEach((el) => {
      window.__inViewIO.observe(el);
    });
  };
  document.addEventListener("DOMContentLoaded", function () {
    initInViewAnimations();

    // Contact form handler
    var contactForm = document.getElementById("contact-form");
    if (contactForm) {
      contactForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!contactForm.checkValidity()) { contactForm.reportValidity(); return; }
        var btn = contactForm.querySelector('button[type="submit"]');
        var msg = document.getElementById("contact-success");
        btn.disabled = true;
        btn.style.opacity = "0.5";
        setTimeout(function () {
          contactForm.reset();
          btn.disabled = false;
          btn.style.opacity = "1";
          msg.textContent = currentLang === "en" ? "Thank you! We will contact you shortly." : "Teşekkürler! En kısa sürede sizi arayacağız.";
          msg.classList.remove("hidden");
          setTimeout(function () { msg.classList.add("hidden"); }, 5000);
        }, 800);
      });
    }

    // Suite slider
    var slides = document.querySelectorAll(".suite-slide");
    var dots = document.querySelectorAll(".suite-dot");
    var prevBtn = document.getElementById("slide-prev");
    var nextBtn = document.getElementById("slide-next");
    if (slides.length > 0 && prevBtn && nextBtn) {
      var current = 0;
      function showSlide(idx) {
        slides.forEach(function(s, i) { s.style.opacity = i === idx ? "1" : "0"; });
        dots.forEach(function(d, i) {
          d.className = i === idx
            ? "suite-dot w-8 h-1 rounded-full bg-white transition-all duration-300"
            : "suite-dot w-4 h-1 rounded-full bg-white/40 transition-all duration-300";
        });
        current = idx;
      }
      nextBtn.addEventListener("click", function(e) { e.stopPropagation(); showSlide((current + 1) % slides.length); });
      prevBtn.addEventListener("click", function(e) { e.stopPropagation(); showSlide((current - 1 + slides.length) % slides.length); });
      setInterval(function() { showSlide((current + 1) % slides.length); }, 5000);
    }

    // Newsletter form handler
    var nlForm = document.getElementById("newsletter-form");
    if (nlForm) {
      nlForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!nlForm.checkValidity()) { nlForm.reportValidity(); return; }
        var msg = document.getElementById("newsletter-success");
        nlForm.reset();
        msg.textContent = currentLang === "en" ? "Subscribed successfully!" : "Başarıyla abone oldunuz!";
        msg.classList.remove("hidden");
        setTimeout(function () { msg.classList.add("hidden"); }, 5000);
      });
    }
  });
})();
