    // --- Adobe Fonts (Chandler42): load without blocking first paint ---
    // Injected here rather than as a <link> in <head> so the page renders
    // immediately; Chandler42 text shows in Courier until the face arrives.
    // (Done in JS, not an inline onload, because the CSP forbids inline handlers.)
    (function () {
      const tk = document.createElement('link');
      tk.rel = 'stylesheet';
      tk.href = 'https://use.typekit.net/miv0ffy.css';
      document.head.appendChild(tk);
    })();

    // --- Fade-up on scroll (progressive enhancement) ---
    const fadeTargets = document.querySelectorAll('.fade-up');
    if ('IntersectionObserver' in window) {
      const fadeObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              fadeObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      fadeTargets.forEach((el) => fadeObserver.observe(el));
      // Safety net: if the observer never fires (odd viewport, tooling, etc.),
      // reveal anything still hidden after 3s so content is never stuck blank.
      setTimeout(() => {
        document.querySelectorAll('.fade-up:not(.visible)')
          .forEach((el) => el.classList.add('visible'));
      }, 3000);
    } else {
      // No IntersectionObserver support: just show everything.
      fadeTargets.forEach((el) => el.classList.add('visible'));
    }

    // --- Mailing list signup: POSTs to Kit, then hands the visitor to Gamefound ---
    const GAMEFOUND_URL = 'https://gamefound.com/en/projects/burzerkerr-studios/haunted';
    const QS_URL = 'https://hauntedrpg.com/assets/quickstart/haunted-quickstart.pdf';

    document.querySelectorAll('.cta-form').forEach(function (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const slot  = form.closest('.signup-target');
        const email = form.querySelector('input[type="email"]').value.trim();
        const btn   = form.querySelector('button');

        // Clear any previous error
        const prev = form.parentNode.querySelector('.cta-error');
        if (prev) prev.remove();

        btn.disabled = true;

        try {
          const res = await fetch('https://app.kit.com/forms/9459188/subscriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ email_address: email })
          });

          if (res.ok) {
            if (window.fbq) {
              fbq('track', 'Lead');
              // We navigate to Gamefound programmatically below, so the delegated
              // a[href*=gamefound] click handler won't fire. Record the
              // GamefoundClick retargeting signal here instead.
              fbq('trackCustom', 'GamefoundClick');
            }
            if (slot) {
              slot.innerHTML = '<p class="cta-confirm">You\'re on the List! Find your free Quickstart in your inbox. And now, to Gamefound!</p>';
            }
            // Short beat so the message is legible and the pixel beacons flush,
            // then hand the visitor straight to the Gamefound campaign.
            setTimeout(function () { window.location.assign(GAMEFOUND_URL); }, 1200);
          } else {
            throw new Error('server');
          }
        } catch (_) {
          btn.disabled = false;
          const err = document.createElement('p');
          err.className = 'cta-error';
          err.setAttribute('role', 'alert');
          err.textContent = 'Something went wrong. Try again.';
          form.insertAdjacentElement('afterend', err);
        }
      });
    });

    // --- Track outbound clicks to Gamefound as a custom conversion signal ---
    document.addEventListener('click', function (e) {
      const link = e.target.closest('a[href*="gamefound.com"]');
      if (link && window.fbq) fbq('trackCustom', 'GamefoundClick');
    });

    // --- Cookie consent: the Meta pixel loads ONLY after the visitor accepts ---
    (function () {
      const PIXEL_ID = '878081998717431';

      function loadMetaPixel() {
        if (window.fbq) return;
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
        document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', PIXEL_ID);
        fbq('track', 'PageView');
      }

      const banner = document.getElementById('cookie-banner');
      let choice = null;
      try { choice = localStorage.getItem('hr_cookie_consent'); } catch (_) {}

      if (choice === 'accepted') {
        loadMetaPixel();
      } else if (choice !== 'declined' && banner) {
        banner.hidden = false;
      }

      const accept = document.getElementById('cookie-accept');
      const decline = document.getElementById('cookie-decline');
      const reset = document.getElementById('cookie-reset');

      if (accept) accept.addEventListener('click', function () {
        try { localStorage.setItem('hr_cookie_consent', 'accepted'); } catch (_) {}
        if (banner) banner.hidden = true;
        loadMetaPixel();
      });

      if (decline) decline.addEventListener('click', function () {
        try { localStorage.setItem('hr_cookie_consent', 'declined'); } catch (_) {}
        if (banner) banner.hidden = true;
      });

      if (reset) reset.addEventListener('click', function (e) {
        e.preventDefault();
        try { localStorage.removeItem('hr_cookie_consent'); } catch (_) {}
        location.reload();
      });
    })();
  
