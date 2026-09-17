/* Виджет КП для EnvyCRM. Библиотека EnvyCrmWidget подключена в kp-widget.html */
(function(){
'use strict';

var W = window.EnvyCrmWidget;
if (!W){ console.log('[KP] EnvyCrmWidget не загрузилась'); return; }

/* !!! адрес конструктора (при переносе на другой хостинг — заменить) !!! */
var CTOR = 'https://alenik9024-cell.github.io/kp/kp.html';

/* блок внутри карточки: включить после переноса файлов на хостинг без
   X-Frame-Options (сейчас github.io рамку блокирует) */
var SHOW_BLOCK = false;

function urlFor(dealID, extra){
  return CTOR + '?embed=1' + (dealID ? '&deal_id=' + dealID : '') + (extra ? '&' + extra : '');
}

function panelHtml(url){
  return '<div style="padding:24px;font:15px/1.6 system-ui,-apple-system,Arial,sans-serif">'
   + '<p style="margin:0 0 8px;font-size:17px"><b>Конструктор КП</b></p>'
   + '<p style="margin:0 0 18px;color:#6B7893;font-size:13px">Откроется в новой вкладке. '
   + 'Там: впишите телефон клиента → «Найти сделку» → выберите услуги → «Сформировать КП». '
   + 'PDF сохранится в поле «КП (файл)» этой сделки.</p>'
   + '<a href="' + url + '" target="_blank" rel="noopener" style="display:inline-block;'
   + 'padding:12px 20px;border-radius:9px;background:#2F6BFF;color:#fff;text-decoration:none;'
   + 'font-weight:600">Открыть конструктор КП</a>'
   + '<p style="margin:18px 0 0;color:#9AA7BD;font-size:12px;word-break:break-all">' + url + '</p></div>';
}

function showPanel(url){
  console.log('[KP] показываю панель:', url);
  if (W.openPage){
    return Promise.resolve(W.openPage({ content: panelHtml(url) }))
      .then(function(){ console.log('[KP] openPage ок'); })
      .catch(function(e){ console.log('[KP] openPage ошибка:', e); altPanel(url); });
  }
  altPanel(url);
}
function altPanel(url){
  if (W.openModal){
    try { W.openModal({ title:'Конструктор КП', content: panelHtml(url), width: 640 });
          console.log('[KP] openModal вызван'); return; } catch(e){}
  }
  console.log('[KP] показать панель нечем, адрес:', url);
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

/* ---------------- клик ---------------- */
window.addEventListener('message', function (e) {
  var raw = JSON.stringify(e.data || {});
  if (!/kp-btn:click|kp-side:click/.test(raw)) return;

  console.log('[KP] клик:', raw.slice(0, 300));

  /* ПАНЕЛЬ ПОКАЗЫВАЕМ СРАЗУ — не ждём сделку.
     ID сделки пользователь подставит поиском по телефону. */
  showPanel(urlFor(null, 'full=1'));

  /* фоном: если сделка всё-таки ответит — запишем ID в журнал, пригодится */
  var d = e.data || {};
  var id = d.deal_id || d.id || (d.options && d.options.deal_id)
        || (d.data && d.data.deal_id) || null;
  if (id){ console.log('[KP] ID сделки из события:', id); return; }

  if (W.getDeal){
    var t = setTimeout(function(){ console.log('[KP] getDeal не ответил за 3 с (в кнопке он недоступен)'); }, 3000);
    W.getDeal().then(function (deal) {
      clearTimeout(t);
      console.log('[KP] ID сделки через getDeal:', deal && (deal.id || deal.deal_id));
    }).catch(function (err) {
      clearTimeout(t);
      console.log('[KP] getDeal ошибка:', err && err.message ? err.message : err);
    });
  }
}, false);

W.init(params);
console.log('[KP] виджет зарегистрирован · блок в карточке: ' + (SHOW_BLOCK ? 'вкл' : 'выкл'));
})();
