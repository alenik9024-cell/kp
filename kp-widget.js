/* Виджет КП для EnvyCRM. Библиотека EnvyCrmWidget подключена в kp-widget.html */
(function(){
'use strict';

var W = window.EnvyCrmWidget;
if (!W){ console.log('[KP] EnvyCrmWidget не загрузилась'); return; }

/* !!! адрес конструктора !!! */
var CTOR = 'https://alenik9024-cell.github.io/kp/kp.html';

/* блок внутри карточки: включить после переноса файлов на хостинг без
   X-Frame-Options (сейчас на github.io рамку блокирует GitHub) */
var SHOW_BLOCK = false;

function urlFor(dealID, extra){
  return CTOR + '?embed=1' + (dealID ? '&deal_id=' + dealID : '') + (extra ? '&' + extra : '');
}

/* открываем конструктор: сначала пробуем новую вкладку, но полагаться на неё нельзя */
function showPanel(dealId){
  var u = urlFor(dealId, 'full=1');
  console.log('[KP] конструктор:', u);

  var html = '<div style="padding:22px;font:15px/1.6 system-ui,-apple-system,Arial">'
    + '<p style="margin:0 0 10px"><b>Конструктор КП</b>'
    + (dealId ? ' · сделка №' + dealId : '') + '</p>'
    + '<p style="margin:0 0 16px;color:#6B7893;font-size:13px">Нажмите кнопку — откроется в новой вкладке.</p>'
    + '<a href="' + u + '" target="_blank" rel="noopener" '
    + 'style="display:inline-block;padding:12px 20px;border-radius:9px;background:#2F6BFF;color:#fff;'
    + 'text-decoration:none;font-weight:600">Открыть конструктор КП</a>'
    + '<p style="margin:16px 0 0;color:#9AA7BD;font-size:12px;word-break:break-all">' + u + '</p>'
    + '</div>';

  if (W.openPage){
    W.openPage({ content: html }).catch(function(e){
      console.log('[KP] openPage не сработал:', e);
      try { window.open(u, '_blank'); } catch(_){}
    });
  } else {
    try { window.open(u, '_blank'); } catch(_){}
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
  var raw = JSON.stringify(d);
  var hit = /kp-btn:click|kp-side:click/.test(raw);
  if (!hit) return;

  console.log('[KP] клик:', raw.slice(0, 300));

  /* ID сделки может лежать в разных местах ответа */
  var id = d.deal_id || d.id
        || (d.options && d.options.deal_id)
        || (d.data && d.data.deal_id)
        || (d.data && d.data.options && d.data.options.deal_id)
        || null;

  if (id) return showPanel(id);

  /* ID не пришёл — забираем через виджет */
  if (W.getDeal){
    W.getDeal().then(function (deal) {
      var x = deal && (deal.id || deal.deal_id || (deal.result && deal.result.id));
      showPanel(x || null);
    }).catch(function(){ showPanel(null); });
  } else {
    showPanel(null);
  }
}, false);

W.init(params);
console.log('[KP] виджет зарегистрирован · блок в карточке: ' + (SHOW_BLOCK ? 'вкл' : 'выкл'));
})();
