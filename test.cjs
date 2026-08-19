const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
    console.log(err.stack);
  });
  page.on('console', msg => {
    if(msg.type() === 'error') {
       console.log('CONSOLE ERROR:', msg.text());
       const location = msg.location();
       console.log('LOCATION:', location.url, location.lineNumber);
    }
  });
  
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})();
