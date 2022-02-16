require('dotenv').config();
const puppeteer = require('puppeteer');
const { sendMessage } = require('./services/telegram');
const { sleep } = require('./utils/helpers');

(async () => {
  console.log("Iniciando em " + new Date().toString());

  const browser = await puppeteer.launch({
    slowMo: 10,
    args: [
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-sandbox",
    ]
  });
  const page = await browser.newPage();
  await page.goto('https://freenanofaucet.com/', { waitUntil: 'networkidle0' })
    .then(() => console.log("Página aberta com sucesso!"));

  await page.waitForSelector('input[name=address]');

  await sleep(2000);

  await page.$eval('input[name=address]', el => el.value = 'nano_1edhcar53gfsdah83ei1nuht5rpz6gui5667kpet5zw3yyeq7om9pzqqwxhm');

  await page.click('input[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle0' })
    .then(() => console.log("Página recarregada!"))
    .catch(() => {
      console.log("Erro ao recarregar página!");
      process.exit(1);
    });

  await page.screenshot({ path: 'last_screenshot.png' });

  await page.waitForSelector('.faucetText');
  const text = await page.evaluate(() => {
    const anchor = document.querySelector('.faucetText');
    return anchor.textContent;
  });

  const message = text.trim();

  console.log(message);
  sendMessage(message);

  await browser.close();

  console.log("Finalizado em " + new Date().toString());

  process.exit(0);
})()
  .catch(() => process.exit(1));