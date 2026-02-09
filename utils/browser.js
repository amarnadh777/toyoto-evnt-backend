const puppeteer = require("puppeteer");

let browserInstance = null;

async function getBrowser() {
  try {

    if (!browserInstance) {

      console.log("Launching Puppeteer browser...");

      browserInstance = await puppeteer.launch({

        headless: true,

        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",

          // VERY IMPORTANT for Ubuntu server
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--no-zygote",
          "--single-process"
        ]

      });

      browserInstance.on("disconnected", () => {
        console.log("Browser disconnected. Resetting...");
        browserInstance = null;
      });

    }

    return browserInstance;

  } catch (err) {
    console.error("Browser launch error:", err);
    throw err;
  }
}

module.exports = getBrowser;
