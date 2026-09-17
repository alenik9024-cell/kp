<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>КП — виджет EnvyCRM</title>
</head>
<body>

<script src="https://cdn.saas-support.com/crm_assets/build/widget/js/envycrmwidget.min.js"></script>

<script>
(function () {
  'use strict';

  var VERSION = 'v14';
  var CONSTRUCTOR_URL = 'https://alenik9024-cell.github.io/kp/kp.html';
  var STORAGE_KEY = 'kp_current_deal_context';

  var w = window.EnvyCrmWidget;

  function log(message, data) {
    console.log('[KP ' + VERSION + '] ' + message, data || '');
  }

  if (!w) {
    log('EnvyCrmWidget не загрузилась');
    return;
  }

  function text(value) {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value).trim();
    }

    if (typeof value === 'object') {
      if (value.value !== undefined && value.value !== null) {
        return text(value.value);
      }

      if (value.client_name !== undefined) {
        return text(value.client_name);
      }

      if (value.phone !== undefined) {
        return text(value.phone);
      }

      if (value.name !== undefined) {
        return text(value.name);
      }

      if (value.result !== undefined) {
        return text(value.result);
      }
    }

    return '';
  }

  function getDealId(deal) {
    deal = deal || {};

    return String(
      deal.id ||
      deal.deal_id ||
      (deal.result && (
        deal.result.id ||
        deal.result.deal_id
      )) ||
      ''
    );
  }

  function getDealObject(deal) {
    return deal && deal.result ? deal.result : (deal || {});
  }

  function getNameFromDeal(deal) {
    var d = getDealObject(deal);

    var name = text(
      d.client_name ||
      d.clientName ||
      d.customer_name ||
      d.name_client
    );

    if (name) {
      return name;
    }

    if (d.client && typeof d.client === 'object') {
      return text(
        d.client.client_name ||
        d.client.name ||
        d.client.name_client
      );
    }

    return '';
  }

  function getPhoneFromDeal(deal) {
    var d = getDealObject(deal);

    var direct = text(
      d.phone ||
      d.client_phone ||
      d.mobile_phone
    );

    if (direct && /\d{5,}/.test(direct)) {
      return direct;
    }

    var contacts = d.contacts || [];

    for (var i = 0; i < contacts.length; i++) {
      var contact = contacts[i] || {};

      var phone = text(
        contact.phone ||
        contact.mobile_phone ||
        contact.value
      );

      if (phone && /\d{5,}/.test(phone)) {
        return phone;
      }
    }

    return '';
  }

  function getClientValue(inputId) {
    if (!w.getClientValue) {
      return Promise.resolve('');
    }

    return w.getClientValue({
      input_id: inputId,
      type: 'service'
    }).then(function (result) {
      return text(result);
    }).catch(function () {
      return '';
    });
  }

  function getProposalNumber(dealId) {
    var now = new Date();

    var day = String(now.getDate()).padStart(2, '0');
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var year = now.getFullYear();

    return 'КП-' + dealId + '/' + day + '.' + month + '.' + year;
  }

  function saveContext(context) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(context)
      );

      log('контекст сохранён', context);
    } catch (error) {
      log('ошибка сохранения контекста', error);
    }
  }

  function getDealContext() {
    return w.getDeal().then(function (deal) {
      deal = deal || {};

      var dealId = getDealId(deal);
      var clientName = getNameFromDeal(deal);
      var phone = getPhoneFromDeal(deal);

      var namePromise = clientName
        ? Promise.resolve(clientName)
        : getClientValue(1001);

      var phonePromise = phone
        ? Promise.resolve(phone)
        : getClientValue(1002);

      return Promise.all([
        namePromise,
        phonePromise
      ]).then(function (values) {
        return {
          dealId: dealId,
          clientName: values[0] || '',
          phone: values[1] || '',
          number: getProposalNumber(dealId),
          time: Date.now()
        };
      });
    });
  }

  function openConstructor() {
    var token = 'kp_' + Date.now();

    /*
     * Сначала создаём пустой контекст.
     * Это позволяет открыть окно сразу, без ожидания API.
     */
    saveContext({
      token: token,
      dealId: '',
      clientName: '',
      phone: '',
      number: '',
      time: Date.now()
    });

    var url =
      CONSTRUCTOR_URL +
      '?embed=1' +
      '&full=1' +
      '&auto=1' +
      '&context_token=' +
      encodeURIComponent(token);

    var content =
      '<iframe ' +
      'src="' + url + '" ' +
      'style="width:100%;height:calc(100vh - 70px);min-height:600px;border:0" ' +
      'allowfullscreen></iframe>';

    log('открываю конструктор');

    /*
     * Открываем сразу.
     */
    try {
      if (w.openPage) {
        var page = w.openPage({
          content: content
        });

        if (page && typeof page.catch === 'function') {
          page.catch(function (error) {
            log('openPage не сработал', error);

            if (w.openModal) {
              w.openModal({
                title: 'Конструктор КП',
                content: content,
                width: 1150
              });
            }
          });
        }
      } else if (w.openModal) {
        w.openModal({
          title: 'Конструктор КП',
          content: content,
          width: 1150
        });
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      log('ошибка открытия конструктора', error);
      window.open(url, '_blank');
    }

    /*
     * После открытия получаем текущую сделку
     * и обновляем контекст для уже открытого конструктора.
     */
    getDealContext()
      .then(function (context) {
        context.token = token;
        saveContext(context);
      })
      .catch(function (error) {
        log('не удалось получить данные сделки', error);
      });
  }

  window.addEventListener('message', function (event) {
    var type = event.data && event.data.type;

    if (type !== 'kp-btn:click') {
      return;
    }

    log('нажата кнопка «Сформировать КП»');
    openConstructor();
  }, false);

  /*
   * Удаляем старый пункт из левого меню.
   */
  if (w.closeWidget) {
    try {
      w.closeWidget({
        type: 'sidebar-item',
        name: 'kp-sidebar-1'
      });
    } catch (e) {}

    try {
      w.closeWidget({
        type: 'sidebar-item',
        name: 'kp-side-1'
      });
    } catch (e) {}
  }

  /*
   * Регистрируем только одну кнопку в сделке.
   */
  try {
    w.init({
      'deal-btn': function () {
        return [{
          title: 'Сформировать КП',
          styles: {
            color: '#fff',
            'background-color': '#2F6BFF'
          },
          icon: 'md-description',
          clickEventName: 'kp-btn:click',
          position: ['first'],
          name: 'kp-btn-1'
        }];
      }
    });

    log('зарегистрирована одна кнопка');
  } catch (error) {
    log('ошибка регистрации кнопки', error);
  }
})();
</script>

</body>
</html>
