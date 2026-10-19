// =========================================================
// Tugas 2 - FarmRPG: Authentication Bypass pakai Session Cookie (Puppeteer)
// =========================================================
// Alur:
// 1. Launch browser (headless: false)
// 2. Inject session cookie milik akun KAMU SENDIRI lewat page.setCookie()
// 3. Buka farmrpg.com, reload, verifikasi sudah login (tanpa isi form login)
// 4. Lakukan aksi otomatis di dalam game + screenshot sebagai bukti
//
// Cara jalanin:
//   npm install
//   (isi COOKIE_NAME & COOKIE_VALUE di bawah, atau lewat environment variable)
//   node index.js
//
// PENTING: value cookie = kunci masuk ke akun kamu. Jangan di-share ke
// siapapun, jangan di-upload ke GitHub / screenshot yang nampilin value-nya.
// =========================================================

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

// ---------------------------------------------------------
// ISI DARI DEVTOOLS: F12 -> Application -> Cookies -> farmrpg.com
// Cari cookie session (nama biasanya "HighwindFRPG", cek di DevTools kamu),
// lalu copy Name dan Value-nya ke sini.
// ---------------------------------------------------------
// Mulai dari HighwindFRPG saja. Kalau hasilnya "Belum login", isi juga
// farmrpg_token (dan kalau perlu HighwindFRPG_renewed) dengan value dari DevTools.
const COOKIE_VALUE = process.env.FRPG_COOKIE_VALUE || "PASTE_VALUE_HighwindFRPG_DI_SINI";
const COOKIES_TO_INJECT = [
  { name: "HighwindFRPG", value: COOKIE_VALUE },
  // { name: "farmrpg_token", value: "PASTE_VALUE_farmrpg_token_DI_SINI" },
  // { name: "HighwindFRPG_renewed", value: "PASTE_VALUE_HighwindFRPG_renewed_DI_SINI" },
];

const BASE_URL = "https://farmrpg.com";

// Waktu tunggu (ms) biar prosesnya kelihatan jelas di layar
const PAUSE = 2500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Klik elemen (link/tombol) berdasarkan teks yang tampil. Return true kalau ketemu.
async function clickByText(page, texts) {
  return page.evaluate((candidates) => {
    const els = Array.from(document.querySelectorAll("a, button, .item-link, .button"));
    for (const t of candidates) {
      const el = els.find((e) => (e.innerText || "").trim().toLowerCase().includes(t.toLowerCase()));
      if (el) {
        el.click();
        return t;
      }
    }
    return null;
  }, texts);
}

// Cek status login: kalau ada form password / tombol login, berarti BELUM login.
async function isLoggedIn(page) {
  return page.evaluate(() => {
    const hasPasswordInput = !!document.querySelector('input[type="password"]');
    const bodyText = (document.body.innerText || "").toLowerCase();
    const looksLikeLoginPage =
      hasPasswordInput || (/\blog ?in\b/.test(bodyText) && /\bpassword\b/.test(bodyText));
    return !looksLikeLoginPage;
  });
}

(async () => {
  if (COOKIES_TO_INJECT.some((c) => c.value.startsWith("PASTE_VALUE"))) {
    console.error("❌ Isi dulu value cookie di index.js (atau set env FRPG_COOKIE_VALUE).");
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: false, // browser kelihatan saat jalan (sesuai ketentuan tugas)
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const page = await browser.newPage();

  try {
    // Step 1: buka domain dulu (belum login), biar kelihatan "sebelum"
    console.log("➡️  Membuka farmrpg.com (belum login) ...");
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page.screenshot({ path: "1-sebelum-login.png" });
    await sleep(PAUSE);

    // Step 2: inject session cookie SEBELUM navigasi ke halaman game
    const cookies = COOKIES_TO_INJECT.map((c) => ({
      name: c.name,
      value: c.value,
      domain: "farmrpg.com",
      path: "/",
      httpOnly: true,
      secure: true,
    }));
    console.log(`🍪 Inject cookie [${cookies.map((c) => c.name).join(", ")}] lewat page.setCookie() ...`);
    if (typeof page.setCookie === "function") {
      await page.setCookie(...cookies);
    } else {
      await browser.setCookie(...cookies); // fallback untuk Puppeteer versi baru
    }

    // Step 3: reload / buka halaman game, lalu verifikasi login
    console.log("🔄 Reload halaman game ...");
    await page.goto(`${BASE_URL}/index.php`, { waitUntil: "networkidle2" });
    await page.waitForSelector("body", { timeout: 15000 });
    await sleep(PAUSE);

    const loggedIn = await isLoggedIn(page);
    await page.screenshot({ path: "2-setelah-inject-cookie.png" });

    if (!loggedIn) {
      console.error("❌ Belum login — cookie salah/kadaluarsa, atau nama cookie keliru.");
      console.error("   Login ulang manual, ambil cookie terbaru dari DevTools, lalu coba lagi.");
      await browser.close();
      process.exit(1);
    }
    console.log("✅ Login terverifikasi (tidak diarahkan ke halaman login).");

    // Step 4: aksi otomatis di dalam game — pindah ke Town lalu ke Farm
    console.log("🎮 Aksi 1: navigasi ke area Town ...");
    await page.goto(`${BASE_URL}/index.php#!/town.php`, { waitUntil: "domcontentloaded" });
    await sleep(PAUSE);
    await page.screenshot({ path: "3-aksi-town.png" });

    console.log("🎮 Aksi 2: klik menu Farm / Home ...");
    const clicked = await clickByText(page, ["My Farm", "Farm", "Home"]);
    console.log(clicked ? `   ✅ Klik "${clicked}"` : "   ⚠️ Tombol tidak ditemukan, lanjut.");
    await sleep(PAUSE);
    await page.screenshot({ path: "4-aksi-farm.png" });

    console.log("\n📸 Screenshot bukti tersimpan: 1-sebelum-login.png s/d 4-aksi-farm.png");
    console.log("⏳ Browser dibiarkan terbuka 8 detik untuk dokumentasi...");
    await sleep(8000);
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await browser.close();
    console.log("✅ Selesai.");
  }
})();
