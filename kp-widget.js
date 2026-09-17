/* Виджет КП для EnvyCRM. Библиотека EnvyCrmWidget подключена в kp-widget.html */
(function(){
'use strict';

var W = window.EnvyCrmWidget;
if (!W){ console.log('[KP] EnvyCrmWidget не загрузилась'); return; }

/* !!! адрес конструктора. При переносе на другой хостинг — заменить !!! */
var CTOR = 'https://alenik9024-cell.github.io/kp/kp.html';

/* блок внутри карточки выключен: пока файлы на github.io, рамка блокируется
   и на месте блока остаётся пустота. Включить после переноса на другой хостинг. */
var SHOW_BLOCK = false;

function urlFor(dealID, extra){
  return CTOR + '?embed=1' + (dealID ? '&deal_id=' + dealID : '') + (extra ? '&' + extra : '');
}

function openTab(url){
  /* открываем сразу, синхронно — иначе браузер блокирует как всплывающее окно */
  var w = window.open(url, '_blank');
  if (!w){
    try {
      var a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
    } catch(e){}
  }
  if (W.openPage){
    try {
      W.openPage({
        content: '<div style="padding:24px;font:15px/1.6 system-ui">'
          + '<p style="margin:0 0 12px"><b>Конструктор КП открыт в новой вкладке браузера.</b></p>'
          + '<p style="margin:0 0 16px;color:#6B7893;font-size:13px">'
          + 'Если вкладка не появилась — браузер её заблокировал. Нажмите кнопку:</p>'
          + '<a href="' + url + '" target="_blank" rel="noopener" '
          + 'style="display:inline-block;padding:11px 18px;border-radius:9px;background:#2F6BFF;'
          + 'color:#fff;text-decoration:none;font-weight:600">Открыть конструктор КП</a>'
          + '<p style="margin:16px 0 0;color:#6B7893;font-size:12px;word-break:break-all">' + url + '</p>'
          + '</div>'
      }).catch(function(){});
    } catch(e){}
  }
}

/* ---------------- описание виджетов ---------------- */
var params = {};

if (SHOW_BLOCK){
  params['before-deal-task'] = function (p) {
    return [{
      title: 'КП из сделки',
      events: ['deal::update-value', 'client::update-value'],
      content: { type:'iframe', url: urlFor(p.dealID), height: 500 }
    }];
  };
}

params['deal-btn'] = function () {
  return [{
    title: 'Сформировать КП',
    styles: { 'color':'#fff', 'background-color':'#2F6BFF' },
    icon: 'md-description',
    clickEventName: 'kp-btn:click',
    position: ['first'],
    name: 'kp-btn-1'
  }];
};

params['sidebar-item'] = function () {
  return [{
    title: 'Конструктор КП',
    icon: 'md-description',
    clickEventName: 'kp-side:click',
    position: ['after-section-2'],
    name: 'kp-side-1'
  }];
};

/* ---------------- клики ---------------- */
window.addEventListener('message', function (e) {
  var d = e.data || {};
  var t = String(d.type || '');

  /* CRM присылает свой формат: crm:widget.method + method/type = наше clickEventName */
  var inner = String((d.data && (d.data.method || d.data.type)) || d.method || '');
  var hit = /kp-btn:click|kp-side:click/.test(t) || /kp-btn:click|kp-side:click/.test(inner);
  if (!hit) return;

  console.log('[KP] клик:', t, inner || '', JSON.stringify(d).slice(0, 300));

  var id = d.deal_id || d.id
        || (d.options && d.options.deal_id)
        || (d.data && d.data.deal_id) || null;

  /* важно: открываем вкладку СРАЗУ, до любых запросов — иначе браузер заблокирует */
  if (id) return openTab(urlFor(id, 'full=1'));

  var pre = window.open('', '_blank');
  if (W.getDeal){
    W.getDeal().then(function (deal) {
      var x = deal && (deal.id || deal.deal_id || (deal.result && deal.result.id));
      var u = urlFor(x, 'full=1');
      if (pre) pre.location.href = u; else openTab(u);
    }).catch(function(){ if (pre) pre.location.href = urlFor(null,'full=1'); else openTab(urlFor(null,'full=1')); });
  } else {
    if (pre) pre.location.href = urlFor(null, 'full=1'); else openTab(urlFor(null, 'full=1'));
  }
}, false);

W.init(params);
console.log('[KP] виджет зарегистрирован · блок в карточке: ' + (SHOW_BLOCK ? 'вкл' : 'выкл'));
})();
