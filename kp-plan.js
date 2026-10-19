(function(root,factory){
  if(typeof module==='object' && module.exports) module.exports=factory();
  else root.KPPlan=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var titles=['Запуск отдела продаж под ключ','Трансформация имеющегося отдела продаж'];
  var groups={team:'Команда и ответственность',routing:'Маршрут клиента',management:'Управление и контроль',stages:'Этапы',metrics:'Метрики результата',assumptions:'Условия реализации'};
  var fields={title:'Название',timing:'Срок / периодичность',work:'Что делаем',result:'Результат',acceptance:'Критерий приёмки'};
  var config={mode:{launch:'Запуск',transform:'Трансформация'},workFormat:{remote:'Удалённо',office:'В офисе',hybrid:'Гибрид'},rop:{existing:'Действующий руководитель',recruit:'Подбор руководителя',external:'Внешний руководитель'},team:{existing:'Действующая команда',recruit:'Подбор команды',mixed:'Смешанная команда'},hiring:{client:'Заказчик',executor:'Исполнитель',shared:'Совместно'}};
  var configLabels={mode:'Сценарий',workFormat:'Формат работы',rop:'Руководитель продаж',team:'Состав команды',hiring:'Ответственность за найм'};
  function isPlanItem(item){return !!item && titles.indexOf(item.title)>=0;}
  function row(id,title,timing,work,result,acceptance){return {id:id,visible:true,title:title,timing:timing,work:work,result:result,acceptance:acceptance};}
  function createPlan(mode){
    var transform=mode==='transform';
    return {version:1,config:{mode:transform?'transform':'launch',workFormat:'remote',rop:transform?'existing':'recruit',team:transform?'existing':'recruit',hiring:'shared'},
      objective:transform?'Повысить управляемость действующих продаж: выявить потери в воронке, усилить команду и закрепить единый стандарт работы.':'Создать управляемую систему продаж: от обработки первого обращения до контроля результата и развития команды.',
      value:transform?'Руководитель видит причины потерь и точки роста, команда работает по понятным правилам, решения принимаются на основе данных.':'Бизнес получает не набор разрозненных инструментов, а понятный процесс: кто работает с клиентом, что делает на каждом этапе и как оценивается качество.',
      team:[row('team-1','Роли и ответственность','На старте','Согласуем функции руководителя, менеджеров и контроля качества.','Матрица ответственности и требования к компетенциям.','Назначены ответственные за ключевые действия.')],
      routing:[row('routing-1','От обращения до сделки','В ходе внедрения','Опишем квалификацию, передачу клиента, следующий шаг и причины отказа.','Воронка и правила ведения сделки в CRM.','Тестовая сделка проходит маршрут без потери ответственного.')],
      management:[row('management-1','Управленческий ритм','Ежедневно / еженедельно — согласовать','Настроим планирование, разбор сделок и обратную связь по качеству.','Регламент встреч и отчётность для руководителя.','Проведён первый разбор по согласованной форме.')],
      stages:[
        row('stage-1',transform?'Диагностика действующих продаж':'Проектирование системы','Этап 1 · срок согласуется','Изучим продукт, путь клиента, данные и ограничения.','Карта приоритетов, цели и согласованное ТЗ.','Заказчик согласовал приоритеты и объём работ.'),
        row('stage-2',transform?'Усиление процессов и команды':'Подготовка команды и инструментов','Этап 2 · срок согласуется','Подготовим CRM, правила работы, сценарии диалога и обучение.','Команда и инструменты готовы к пилоту.','Проверены доступы, маршрут сделки и учебные диалоги.'),
        row('stage-3','Пилот и корректировки','Этап 3 · срок согласуется','Запустим работу, разберём реальные обращения и скорректируем процесс.','Проверенный рабочий процесс и список улучшений.','Зафиксированы результаты пилота и приняты корректировки.'),
        row('stage-4','Закрепление управления','Этап 4 · срок согласуется','Передадим регламенты, отчётность и план дальнейших действий.','Прозрачная система контроля продаж.','Переданы материалы и проведён итоговый разбор.')],
      metrics:[row('metric-1','Показатели воронки','База → целевой ориентир: согласовать','Отслеживаем скорость ответа, конверсию этапов, качество контакта и причины потерь.','Показатели с источниками данных и ответственными.','Методика расчёта и целевые ориентиры согласованы.')],
      assumptions:[row('assumption-1','Границы и зависимости','До старта','Заказчик предоставляет доступы, данные и согласования. Найм и внешние расходы фиксируются отдельно.','Согласованный объём, сроки и ресурсы.','План уточнён по результатам диагностики; выручка и сроки найма не гарантируются.')]
    };
  }
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function escapeHtml(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function migratePlan(raw,mode){
    var p=createPlan(mode);
    if(raw==null) return p;
    if(typeof raw!=='object' || Array.isArray(raw) || (raw.version!=null && raw.version!==1)) throw Error('Неподдерживаемая версия плана');
    if(raw.config!=null){
      if(typeof raw.config!=='object' || Array.isArray(raw.config)) throw Error('Некорректная конфигурация');
      Object.keys(config).forEach(function(k){if(raw.config[k]!=null){if(!Object.prototype.hasOwnProperty.call(config[k],raw.config[k])) throw Error('Некорректная настройка: '+k);p.config[k]=raw.config[k];}});
    }
    ['objective','value'].forEach(function(k){if(raw[k]!=null){if(typeof raw[k]!=='string') throw Error('Некорректный текст');p[k]=raw[k];}});
    Object.keys(groups).forEach(function(g){
      if(raw[g]==null) return;
      if(!Array.isArray(raw[g]) || raw[g].length>200) throw Error('Некорректные строки плана');
      var ids={};
      p[g]=raw[g].map(function(r,i){
        if(!r || typeof r!=='object' || Array.isArray(r)) throw Error('Некорректная строка');
        var id=typeof r.id==='string'?r.id:g+'-'+i;
        if(ids[id]) id=g+'-import-'+i;
        ids[id]=true;
        var out={id:id,visible:r.visible!==false};
        Object.keys(fields).forEach(function(k){if(r[k]!=null && typeof r[k]!=='string') throw Error('Некорректный текст строки');out[k]=r[k]||'';});
        return out;
      });
    });
    return p;
  }
  function migrateItem(item){
    var out=clone(item);
    if(isPlanItem(out)) out.plan=migratePlan(out.plan,out.title===titles[1]?'transform':'launch');
    return out;
  }
  function applyPreset(plan,reset){
    var current=migratePlan(plan,plan.config.mode), next=createPlan(current.config.mode);
    next.config=clone(current.config);
    if(reset) return next;
    var candidates=[createPlan('launch'),createPlan('transform')];
    ['objective','value'].forEach(function(k){if(candidates.some(function(d){return current[k]===d[k];})) current[k]=next[k];});
    Object.keys(groups).forEach(function(g){current[g].forEach(function(r){
      var target=next[g].find(function(x){return x.id===r.id;});if(!target) return;
      Object.keys(fields).forEach(function(k){if(candidates.some(function(d){var old=d[g].find(function(x){return x.id===r.id;});return old && old[k]===r[k];})) r[k]=target[k];});
    });});
    return current;
  }
  function renderPlan(plan){
    var h='<section class="implementation-plan"><h3>План реализации</h3><p class="plan-copy">'+escapeHtml(plan.objective)+'</p>';
    Object.keys(groups).forEach(function(g){
      var rows=plan[g].filter(function(r){return r.visible!==false;});if(!rows.length) return;
      h+='<section class="plan-group"><h4>'+groups[g]+'</h4>';
      rows.forEach(function(r){h+='<article class="plan-stage"><h5>'+escapeHtml(r.title)+'</h5><dl>';
        ['timing','work','result','acceptance'].forEach(function(k){if(r[k]) h+='<div><dt>'+fields[k]+'</dt><dd>'+escapeHtml(r[k])+'</dd></div>';});
        h+='</dl></article>';});h+='</section>';
    });return h+'</section>';
  }
  return {isPlanItem:isPlanItem,createPlan:createPlan,migratePlan:migratePlan,migrateItem:migrateItem,applyPreset:applyPreset,renderPlan:renderPlan,escapeHtml:escapeHtml,groups:groups,fields:fields,config:config,configLabels:configLabels};
});
