"""Run: python tests/test-browser.py (pip install playwright; Chrome installed)."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(ROOT)))
Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}'
with sync_playwright() as pw:
    browser = pw.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width': 1600, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url+'/kp.html')
    page.locator('[data-pack="#svcPick|Отдел продаж"]').click()
    assert page.locator('.plan-editor').count() == 2
    assert page.locator('#doc .sales-service').count() == 2
    assert page.evaluate('calc().svc.mon') == 320000
    first = page.locator('#servicesEditor > .row').first
    first.locator('[data-plan-text="objective"]').fill('Ручная цель <img src=x onerror=alert(1)>')
    first.locator('[data-plan-text="value"]').fill('Измеримая ценность для бизнеса')
    first.locator('[data-plan-config="mode"]').select_option('transform')
    first.locator('[data-plan-action="preset"]').click()
    assert first.locator('[data-plan-text="objective"]').input_value().startswith('Ручная цель')
    assert page.locator('#doc img').count() == 0
    assert 'remote' not in page.locator('#doc').inner_text()
    # Exercise all row operations via actual controls; open groups after rerender.
    def open_groups():
        first.locator('.plan-section').evaluate_all('(els)=>els.forEach(e=>e.open=true)')
    open_groups()
    first.locator('[data-plan-group="stages"] [data-plan-action="add"]').click()
    assert first.locator('[data-plan-group="stages"]').evaluate('(e)=>e.parentElement.open'), 'row action preserves open section'
    open_groups()
    stages=first.locator('[data-plan-group="stages"] .plan-row')
    assert stages.count() == 5
    stages.last.locator('[data-plan-field="title"]').fill('Уникальный этап')
    stages.last.locator('[data-plan-action="up"]').click()
    assert page.evaluate('state.services[0].plan.stages[3].title') == 'Уникальный этап'
    open_groups()
    stages.nth(3).locator('[data-plan-visible]').uncheck()
    assert 'Уникальный этап' not in page.locator('#doc').inner_text()
    stages.nth(3).locator('[data-plan-action="down"]').click()
    open_groups()
    stages.last.locator('[data-plan-action="delete"]').click()
    assert page.evaluate('state.services[0].plan.stages.length') == 4
    # Cancel reset, then explicitly confirm reset.
    page.once('dialog',lambda d:d.dismiss())
    first.locator('[data-plan-action="reset"]').click()
    assert first.locator('[data-plan-text="objective"]').input_value().startswith('Ручная цель')
    page.reload()
    assert first.locator('[data-plan-text="objective"]').input_value().startswith('Ручная цель')
    assert page.evaluate('state.services[1].plan.objective') != page.evaluate('state.services[0].plan.objective')
    with page.expect_download() as download:
        page.locator('#btnExport').click()
    exported=json.loads(Path(download.value.path()).read_text(encoding='utf-8'))
    page.locator('#fileImport').set_input_files({'name':'proposal.json','mimeType':'application/json','buffer':json.dumps(exported).encode()})
    page.wait_for_load_state('load')
    page.wait_for_function('state.services.length===2')
    assert first.locator('[data-plan-text="value"]').input_value() == 'Измеримая ценность для бизнеса'
    # Ordinary service math is unchanged; old draft migrates through real import.
    old={'services':[{'id':'old','title':'Запуск отдела продаж под ключ','desc':'Описание','mode':'fixed','price':'160000','period':'month'}]}
    page.locator('#fileImport').set_input_files({'name':'old.json','mimeType':'application/json','buffer':json.dumps(old).encode()})
    page.wait_for_function('state.services.length===1')
    assert page.evaluate('state.services[0].plan.version') == 1
    page.locator('#svcPick').select_option('Авито::0')
    page.locator('#btnAddSvc').click()
    assert page.evaluate('calc().svc.mon') == 205000
    assert page.locator('#doc .svc').count() == 1
    page.once('dialog',lambda d:d.accept())
    first.locator('[data-plan-action="reset"]').click()
    assert first.locator('[data-plan-text="objective"]').input_value().startswith('Создать')
    # Long user text should wrap inside the client composition.
    first.locator('[data-plan-text="value"]').fill('ОченьДлинноеСлово'*70)
    for width in (1600, 1024, 390):
        page.set_viewport_size({'width':width,'height':1000})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), f'page overflow {width}'
        assert page.locator('.sales-service').first.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'), f'service overflow {width}'
    first.locator('[data-plan-text="value"]').fill('Измеримая ценность для бизнеса')
    page.emulate_media(media='print')
    pdf_path=ROOT.parent/'kp-enhancement-print.pdf'
    page.pdf(path=str(pdf_path), prefer_css_page_size=True, print_background=True)
    assert pdf_path.stat().st_size > 10000
    page.emulate_media(media='screen')
    page.goto(url+'/kp-widget.html?client_name=Test&deal_id=123&num=123-test')
    frame=page.frame_locator('#kp-frame')
    frame.locator('#doc').wait_for()
    assert frame.locator('[data-bind="client"]').input_value() == 'Test'
    assert frame.locator('[data-bind="docNumber"]').input_value() == '123-test'
    assert frame.locator('.implementation-plan').count()==1
    assert not errors, errors
    print('PASS: browser editing, presets, reset confirmation, row CRUD/reorder/hide, reload, JSON import/export, migration, totals, 3 viewport widths, print PDF and CRM wrapper context; zero page errors')
    print('PDF:',pdf_path)
    browser.close()
server.shutdown()
