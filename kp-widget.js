<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>КП — виджет</title>
<script src="https://cdn.saas-support.com/crm_assets/build/widget/js/envycrmwidget.min.js"></script>
</head>
<body>
<script>
(function(){
'use strict';
var W = window.EnvyCrmWidget;
console.log('[KP] файл виджета загружен, EnvyCrmWidget:', !!W);
if (!W || !W.init){ console.log('[KP] ОШИБКА: EnvyCrmWidget.init недоступен'); return; }

var CTOR = 'https://alenik9024-cell.github.io/kp/kp.html';

function ctorUrl(dealId){
  return CTOR + '?embed=1' + (dealId ? '&deal_id=' + dealId : '');
}
function openCtor(dealId){
  var u = ctorUrl(dealId);
  console.log('[KP] открываю конструктор:', u);
  var full  = '<iframe src="' + u + '" style="width:100%;height:100vh;border:0"></iframe>';
  var modal = '<iframe src="' + u + '" style="width:100%;height:85vh;border:0"></iframe>';
  if (W.openPage){
    W.openPage({ content: full }).catch(function(e){
      console.log('[KP] openPage не сработал:', e);
      if (W.openModal) W.openModal({ title:'Конструктор КП', width:1200, content: modal });
    });
    return;
  }
  if (W.openModal){ W.openModal({ title:'Конструктор КП', width:1200, content: modal }); return; }
  window.open(u, '_blank');
}

window.addEventListener('message', function(e){
  var raw = JSON.stringify(e.data || {});
  if (!/kp-btn:click|kp-side:click/.test(raw)) return;
  console.log('[KP] клик:', raw.slice(0, 200));
  var d = e.data || {};
  var id = d.deal_id || d.id || (d.options && d.options.deal_id) || (d.data && d.data.deal_id) || null;
  if (!id){ var m = /[?&]deal_id=(\d+)/.exec(location.search); if (m) id = Number(m[1]); }
  openCtor(id);
}, false);

W.init({
  'deal-btn': function(){
    return [{
      title: 'Сформировать КП',
      styles: { 'color':'#fff', 'background-color':'#2F6BFF' },
      icon: 'md-description',
      clickEventName: 'kp-btn:click',
      position: ['first'],
      name: 'kp-btn-1'
    }];
  },
  'sidebar-item': function(){
    return [{
      title: 'Конструктор КП',
      icon: 'md-description',
      clickEventName: 'kp-side:click',
      position: ['after-section-2'],
      name: 'kp-sidebar-1'
    }];
  }
});
console.log('[KP] виджет зарегистрирован');
})();
</script>
</body>
</html>
