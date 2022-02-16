require('dotenv').config();

const puppeteer = require('puppeteer');
const fs = require('fs');

const { sendMessage } = require('./services/telegram');
const { sleep } = require('./utils/helpers');

const cookiesFilePath = 'cookies_btc.json';

const sleepMinutes = () => {
  const delays = [
    1, 2, 3, 5, 8
  ]

  // choice a random offset from the array of delays
  const randomIndex = Math.floor(Math.random() * delays.length);

  return delays[randomIndex] * 60 * 1000;
}

(async () => {
  const minutesToSleep = sleepMinutes();

  console.log("Me espreguiçando aqui um tiquin, espera aí mais ou menos.. " + minutesToSleep + "ms");
  await sleep(minutesToSleep);

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

  if (fs.existsSync(cookiesFilePath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesFilePath));
    await page.setCookie(...cookies);
    console.log('Carreguei uns biscoitin aqui pra aproveitar a sessão');
  }

  console.log("Abrindo a página...");
  await page.goto('https://freebitco.in/', { waitUntil: 'networkidle0' })
    .then(() => console.log("Página aberta com sucesso!"));

  try {
    console.log('Abrindo form de Login');
    await page.click('body>div.large-12.fixed>div>nav>section>ul>li.login_menu_button>a');

    console.log("Verificando barra de cookies");
    await page.click('body > div.cc_banner-wrapper > div > a.cc_btn.cc_btn_accept_all')
      .then(() => console.log("Barra de cookies ok!"))
      .catch(() => { console.log('Sem aviso de cookies') });

    console.log("Verificando barra de notificações");
    await page.click('#push_notification_modal > div.push_notification_big > div:nth-child(2) > div > div.pushpad_deny_button')
      .then(() => console.log("Barra de notificações ok!"))
      .catch(() => { console.log('Sem pedido de notificação') });

    console.log("Preenchendo form de login");
    await page.$eval('input[name=btc_address]', el => el.value = process.env.FREE_BTC_EMAIL)
      .then(() => console.log("Email preenchido!"));
    await page.$eval('input[id=login_form_password]', el => el.value = process.env.FREE_BTC_PASSWORD)
      .then(() => console.log("Senha preenchida!"));

    console.log("Delay");
    await sleep(2000);

    console.log("Enviando form de login");
    await page.click('button#login_button')
      .then(() => console.log("Form de login ok."));

    await page.waitForNavigation({ waitUntil: 'networkidle0' })
      .then(() => console.log("Página recarregada!"))
      .catch(() => {
        console.log("Erro ao recarregar página!");
        process.exit(1);
      });

    console.log("Delay");
    await sleep(2000);

    const cookiesObject = await page.cookies()
    // Write cookies to temp file to be used in other profile pages
    fs.writeFile(cookiesFilePath, JSON.stringify(cookiesObject),
      function (err) {
        if (err) {
          console.log('O arquivo não foi escrito.', err)
        }
        console.log('Sessão salva com sucesso')
      })

  } catch (error) {
    console.log('Não será necessário fazer login');
  }

  console.log("Verificando barra de notificações novamente");
  await page.click('#push_notification_modal > div.push_notification_big > div:nth-child(2) > div > div.pushpad_deny_button')
    .then(() => console.log("Barra de notificações ok!"))
    .catch(() => { console.log('Sem pedido de notificação') });

  await page.waitForSelector('#free_play_form_button');

  const balance = await page.evaluate(() => {
    const anchor = document.querySelector('#balance');
    return anchor.textContent;
  });

  console.log(`Voce possui um total de ${balance}BTC`);

  try {
    await page.click('#free_play_form_button');

  } catch (error) {
    console.log('Sem faucet');
  } finally {
    await page.reload({ waitUntil: 'networkidle0' });

    await page.waitForSelector('#balance');

    const newBalance = await page.evaluate(() => {
      const anchor = document.querySelector('#balance');
      return anchor.textContent;
    });

    const message = `Voce possui um saldo de ${newBalance}BTC 💰`;

    sendMessage(message);
    console.log(message);
  }

  await browser.close();

  console.log("Finalizado em " + new Date().toString());
})()
  .finally(() => process.exit(0));