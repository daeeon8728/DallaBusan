import { test,expect } from './fixtures.js';

test.beforeEach(async({context})=>{
 await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(['127.0.0.1','localhost'].includes(url.hostname)||url.protocol==='data:')return route.continue();
   if(route.request().resourceType()==='image')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#9bb7b1"/></svg>'});
   return route.abort();
 });
});
test('alternatives compare actual menus and navigate to the selected source identity',async({page},info)=>{
 await page.goto('/food/1516?locale=en');
 const panel=page.getByTestId('food-assistance');
 await panel.getByRole('button',{name:'Find alternative restaurants'}).click();
 await expect(panel.getByTestId('food-alternative')).toHaveCount(3);
 await expect(panel).toContainText('straight-line');
 await expect(panel).toContainText('Rice soup');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await panel.scrollIntoViewIfNeeded();
 await page.screenshot({path:info.outputPath('restaurant-alternatives.png'),fullPage:false,animations:'disabled'});
 await panel.getByTestId('food-alternative').first().getByRole('link',{name:'Explore this option'}).click();
 await expect(page).toHaveURL(/\/food\/1618\?locale=en/);
 await expect(page.getByRole('heading',{level:1})).not.toBeEmpty();
});
test('Korean card supports quantity, questions, Escape, backdrop and focus restoration',async({page},info)=>{
 await page.goto('/food/1516?locale=en');
 const trigger=page.getByRole('button',{name:'Show Korean order & taxi card'});
 await expect(trigger).toBeEnabled();await trigger.click();
 const dialog=page.getByRole('dialog');
 await expect(dialog).toBeVisible();await expect(dialog.getByTestId('korean-show-text')).toContainText('부광돼지국밥');
 await dialog.getByRole('button',{name:'For restaurant staff'}).click();
 await dialog.getByLabel('Requested quantity').selectOption('2');
 await dialog.getByLabel('Ask staff').selectOption({label:'Is takeaway available?'});
 await expect(dialog.getByTestId('korean-show-text')).toContainText('희망 수량: 2');
 await expect(dialog.getByTestId('korean-show-text')).toContainText('포장 가능한가요?');
 await expect(dialog).toContainText('Pork rice soup');
 expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('korean-order-card.png'),animations:'disabled'});
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
 await expect(page.locator('body')).not.toHaveCSS('overflow','hidden');
 await trigger.click();await page.mouse.click(2,2);await expect(dialog).not.toBeVisible();
 await trigger.click();await dialog.getByRole('button',{name:'Close',exact:true}).click();await expect(trigger).toBeFocused();
});
test('course meal action preserves course context and provides a next-stop comparison',async({page})=>{
 await page.goto('/courses/fa06?locale=en');
 await page.getByRole('link',{name:'Find alternative restaurants'}).first().click();
 await expect(page).toHaveURL(/\/food\/204\?.*course=fa06/);
 const panel=page.getByTestId('food-assistance');
 await expect(panel.locator('.food-course-context')).toBeVisible();
 await panel.getByRole('combobox',{name:'Closest to this restaurant'}).selectOption('next');
 await expect(panel.getByTestId('food-alternative').first()).toContainText('To next stop');
 await panel.getByRole('link',{name:'Back to original course'}).click();
 await expect(page).toHaveURL(/\/courses\/fa06\?locale=en/);
});
test('empty candidates retain a usable Korean card and copy failures are explicit',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('denied'))},configurable:true});});
 await page.goto('/food/70?locale=en');
 const panel=page.getByTestId('food-assistance');
 await panel.getByRole('button',{name:'Find alternative restaurants'}).click();await expect(panel).toContainText('No reviewed nearby alternative yet.');
 await panel.getByRole('button',{name:'Show Korean order & taxi card'}).click();
 const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'For restaurant staff'}).click();
 await expect(dialog).toContainText('Individual dishes have not been reviewed');
 await dialog.getByLabel('Ask staff').selectOption({label:'Is takeaway available?'});
 await dialog.getByRole('button',{name:'Copy Korean text'}).click();await expect(dialog.getByRole('status')).toContainText('Could not copy.');
 await expect(dialog.getByTestId('korean-show-text')).toContainText('포장 가능한가요?');
});
test('all five languages, failed API retry, broken photo and existing storage survive',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('travel-keep','unchanged'));
 await page.route('**/api/food-assistance/1516?**',route=>route.fulfill({status:503,body:'{}'}));
 await page.goto('/food/1516?locale=en');const panel=page.getByTestId('food-assistance');await expect(panel.getByRole('alert')).toBeVisible();
 await page.unroute('**/api/food-assistance/1516?**');await panel.getByRole('button',{name:'Try again'}).click();
 await expect(panel.getByRole('button',{name:'Show Korean order & taxi card'})).toBeEnabled();
 for(const locale of ['ja','zh-CN','zh-TW','ko','en']){
  await page.locator('.language-select select').selectOption(locale);
  await expect(panel.getByRole('button').nth(1)).toBeEnabled();
  await expect(page.locator('html')).toHaveAttribute('lang',locale);
 }
 await page.route('https://www.visitbusan.net/**',route=>route.abort());
 await panel.getByRole('button',{name:'Find alternative restaurants'}).click();
 await expect(panel.locator('.food-alternative-placeholder').first()).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('travel-keep'))).toBe('unchanged');
 await page.reload();await expect(page).toHaveURL(/locale=en/);await expect(panel.getByRole('button').nth(1)).toBeEnabled();
});

test('copy succeeds with the exact Korean text and keyboard focus stays inside the dialog',async({page})=>{
 await page.goto('/food/1516?locale=en');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async(text:string)=>{document.documentElement.dataset['copiedKorean']=text;}},configurable:true}));
 await page.getByRole('button',{name:'Show Korean order & taxi card'}).click();
 const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Copy Korean text'}).click();
 await expect(dialog.getByRole('status')).toHaveText('Copied.');
 expect(await page.locator('html').getAttribute('data-copied-korean')).toBe(await dialog.getByTestId('korean-show-text').innerText());
 for(let i=0;i<8;i++){await page.keyboard.press('Tab');expect(await dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true);}
});
test('a late or mismatched help response cannot replace the selected language',async({page,request})=>{
 const english:unknown=await (await request.get('/api/food-assistance/1516?locale=en')).json();
 await page.route('**/api/food-assistance/1516?**',async route=>{
  if(new URL(route.request().url()).searchParams.get('locale')==='en'){
   await new Promise(resolve=>setTimeout(resolve,250));await route.fulfill({json:english});
  }else await route.continue();
 });
 await page.goto('/food/1516?locale=en');await page.locator('.language-select select').selectOption('ja');
 const panel=page.getByTestId('food-assistance');await expect(panel.getByRole('button',{name:'韓国語の注文・移動カード'})).toBeEnabled();
 await page.waitForTimeout(300);await panel.getByRole('button',{name:'韓国語の注文・移動カード'}).click();
 await page.getByRole('dialog').getByRole('button',{name:'店員に見せる'}).click();
 await expect(page.getByRole('dialog')).toContainText('豚肉クッパ');
});

test('missing Korean sources remain explicit without inventing an address or order card',async({page})=>{
 await page.goto('/food/2261?locale=en');
 const panel=page.getByTestId('food-assistance');
 await expect(panel).toContainText('A Korean source card is not available');
 await expect(panel.getByRole('button',{name:'Show Korean order & taxi card'})).toBeDisabled();
 await panel.getByRole('button',{name:'Find alternative restaurants'}).click();
 await expect(panel).toContainText('No reviewed nearby alternative yet.');
 await expect(panel.getByRole('alert')).toHaveCount(0);
});
