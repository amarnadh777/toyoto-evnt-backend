const puppeteer = require("puppeteer");
const os = require("os");
const fs = require("fs");

let browserInstance = null;

async function getBrowser() {

  try {

    if (!browserInstance) {

      console.log("Launching Puppeteer with Google Chrome...");

      const platform = os.platform();

      let chromePath;

      if (platform === "linux") {

        // Linux Chrome paths
        if (fs.existsSync("/usr/bin/google-chrome")) {
          chromePath = "/usr/bin/google-chrome";
        } 
        else if (fs.existsSync("/usr/bin/google-chrome-stable")) {
          chromePath = "/usr/bin/google-chrome-stable";
        }

      } 
      else if (platform === "win32") {

        chromePath =
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

      } 
      else if (platform === "darwin") {

        chromePath =
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

      }

      browserInstance = await puppeteer.launch({

        headless: true,

        executablePath: chromePath, // ✅ Use Google Chrome

        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--no-zygote",
          "--single-process"
        ]

      });

      browserInstance.on("disconnected", () => {
        console.log("Browser disconnected");
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
