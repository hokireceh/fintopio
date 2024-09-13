require('dotenv').config(); // Load environment variables
const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const colors = require("colors");
const readline = require("readline");
const { DateTime } = require("luxon");

class Fintopio {
  constructor() {
    this.baseUrl = "https://fintopio-tg.fintopio.com/api";
    this.headers = {
      Accept: "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://fintopio-tg.fintopio.com/",
      "Sec-Ch-Ua":
        '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
      "Sec-Ch-Ua-Mobile": "?1",
      "Sec-Ch-Ua-Platform": '"Android"',
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36",
    };
  }

  async sendToTelegram(message) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML" // Optional: to format the message
    };

    try {
      await axios.post(url, payload);
    } catch (error) {
      console.error("Error sending message to Telegram:", error.message);
    }
  }

  async log(msg, color = "white", sendToTelegram = false) {
    console.log(msg[color]);

    if (sendToTelegram) {
      await this.sendToTelegram(msg);
    }
  }

  async waitWithCountdown(seconds, msg = 'continue') {
    const spinners = ["|", "/", "-", "\\"];
    let i = 0;
    for (let s = seconds; s >= 0; s--) {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(
        `${spinners[i]} Waiting ${s} seconds to ${msg} ${spinners[i]}`.cyan
      );
      i = (i + 1) % spinners.length;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log("");
  }

  async auth(userData) {
    const url = `${this.baseUrl}/auth/telegram`;
    const headers = { ...this.headers, Webapp: "true" };

    try {
      const response = await axios.get(`${url}?${userData}`, { headers });
      return response.data.token;
    } catch (error) {
      await this.log(`Authentication error: ${error.message}`, "red", true);
      return null;
    }
  }

  async getProfile(token) {
    const url = `${this.baseUrl}/referrals/data`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      Webapp: "false, true",
    };

    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      await this.log(`Error fetching profile: ${error.message}`, "red", true);
      return null;
    }
  }

  async checkInDaily(token) {
    const url = `${this.baseUrl}/daily-checkins`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      await axios.post(url, {}, { headers });
      await this.log("Daily check-in successful!", "green", true);
    } catch (error) {
      await this.log(`Daily check-in error: ${error.message}`, "red", true);
    }
  }

  async getFarmingState(token) {
    const url = `${this.baseUrl}/farming/state`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      await this.log(`Error fetching farming state: ${error.message}`, "red", true);
      return null;
    }
  }

  async startFarming(token) {
    const url = `${this.baseUrl}/farming/farm`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.post(url, {}, { headers });
      const finishTimestamp = response.data.timings.finish;

      if (finishTimestamp) {
        const finishTime = DateTime.fromMillis(finishTimestamp).toLocaleString(
          DateTime.DATETIME_FULL
        );
        await this.log(`Starting farm...`, "yellow", true);
        await this.log(`Farming completion time: ${finishTime}`, "green", true);
      } else {
        await this.log("No completion time available.", "yellow", true);
      }
    } catch (error) {
      await this.log(`Error starting farming: ${error.message}`, "red", true);
    }
  }

  async claimFarming(token) {
    const url = `${this.baseUrl}/farming/claim`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      await axios.post(url, {}, { headers });
      await this.log("Farm claimed successfully!", "green", true);
    } catch (error) {
      await this.log(`Error claiming farm: ${error.message}`, "red", true);
    }
  }

  async getDiamondInfo(token){
    const url = `${this.baseUrl}/clicker/diamond/state`;
    const headers = {
        ...this.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    try {
        const response = await axios.get(url, { headers });
        return response.data;
    } catch (error) {
      await this.log(`Error fetching diamond state: ${error.message}`, "red", true);
      return null;
    }
  }

  async claimDiamond(token, diamondNumber, totalReward) {
    const url = `${this.baseUrl}/clicker/diamond/complete`;
    const headers = {
        ...this.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    };
    const payload = { "diamondNumber": diamondNumber };

    try {
        await axios.post(url, payload, { headers });
        await this.log(`Success claim ${totalReward} diamonds!`, "green", true);
    } catch (error) {
      await this.log(`Error claiming Diamond: ${error.message}`, "red", true);
    }
  }

  async getTask(token) {
    const url = `${this.baseUrl}/hold/tasks`;
    const headers = {
        ...this.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    try {
        const response = await axios.get(url, { headers });
        return response.data;
    } catch (error) {
      await this.log(`Error fetching task state: ${error.message}`, "red", true);
      return null;
    }
  }

  async startTask(token, taskId, slug) {
    const url = `${this.baseUrl}/hold/tasks/${taskId}/start`;
    const headers = {
        ...this.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
        "origin": "https://fintopio-tg.fintopio.com"
    };
    try {
        await axios.post(url, {}, { headers });
        await this.log(`Starting task ${slug}!`, "green", true);
    } catch (error) {
      await this.log(`Error starting task: ${error.message}`, "red", true);
    }
  }

  async claimTask(token, taskId, slug, rewardAmount) {
    const url = `${this.baseUrl}/hold/tasks/${taskId}/claim`;
    const headers = {
        ...this.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
        "origin": "https://fintopio-tg.fintopio.com"
    };
    try {
        await axios.post(url, {}, { headers });
        await this.log(`Task ${slug} complete, reward ${rewardAmount} diamonds!`, "green", true);
    } catch (error) {
      await this.log(`Error claiming task: ${error.message}`, "red", true);
    }
  }

  extractFirstName(userData) {
    try {
      const userPart = userData.match(/user=([^&]*)/)[1];
      const decodedUserPart = decodeURIComponent(userPart);
      const userObj = JSON.parse(decodedUserPart);
      return userObj.first_name || "Unknown";
    } catch (error) {
      this.log(`Error extracting first_name: ${error.message}`, "red", true);
      return "Unknown";
    }
  }

  calculateWaitTime(firstAccountFinishTime) {
    if (!firstAccountFinishTime) return null;

    const now = DateTime.now();
    const finishTime = DateTime.fromMillis(firstAccountFinishTime);
    const duration = finishTime.diff(now);

    return duration.as("milliseconds");
  }

  async main() {
    while (true) {
      const dataFile = path.join(__dirname, "data.txt");
      const data = await fs.readFile(dataFile, "utf8");
      const users = data.split("\n").filter(Boolean);

      let firstAccountFinishTime = null;

      for (let i = 0; i < users.length; i++) {
        const userData = users[i];
        const first_name = this.extractFirstName(userData);
        await this.log(
          `${"=".repeat(5)} Account ${i + 1} | ${first_name} ${"=".repeat(5)}`,
          "blue",
          true // Send this log to Telegram
        );

        const token = await this.auth(userData);
        if (token) {
          await this.log(`Login successful!`, "green", true);

          const profile = await this.getProfile(token);
          if (profile) {
            const balance = profile.balance;
            await this.log(`Balance: ${balance}`, "green", true);

            await this.checkInDaily(token);

            const diamond = await this.getDiamondInfo(token);
            if (diamond.state === 'available') {
              await this.waitWithCountdown(Math.floor(Math.random() * (21 - 10)) + 10, 'claim Diamonds');
              await this.claimDiamond(token, diamond.diamondNumber, diamond.settings.totalReward);
            } else {
              const nextDiamondTimeStamp = diamond.timings.nextAt;
              if (nextDiamondTimeStamp) {
                const nextDiamondTime = DateTime.fromMillis(nextDiamondTimeStamp).toLocaleString(DateTime.DATETIME_FULL);
                await this.log(`Next Diamond time: ${nextDiamondTime}`, 'green', true);

                if (i === 0) {
                  firstAccountFinishTime = nextDiamondTimeStamp;
                }
              }
            }

            const farmingState = await this.getFarmingState(token);

            if (farmingState) {
              if (farmingState.state === "idling") {
                await this.startFarming(token);
              } else if (farmingState.state === "farmed" || farmingState.state === "farming") {
                const finishTimestamp = farmingState.timings.finish;
                if (finishTimestamp) {
                  const finishTime = DateTime.fromMillis(finishTimestamp).toLocaleString(DateTime.DATETIME_FULL);
                  await this.log(`Farming completion time: ${finishTime}`, "green", true);

                  const currentTime = DateTime.now().toMillis();
                  if (currentTime > finishTimestamp) {
                    await this.claimFarming(token);
                    await this.startFarming(token);
                  }
                }
              }
            }

            const taskState = await this.getTask(token);

            if (taskState) {
              for (const item of taskState.tasks) {
                if (item.status === 'available') {
                  await this.startTask(token, item.id, item.slug);
                } else if (item.status === 'verified') {
                  await this.claimTask(token, item.id, item.slug, item.rewardAmount);
                } else if (item.status === 'in-progress') {
                  continue;
                } else {
                  await this.log(`Verifying task ${item.slug}!`, "green", true);
                }
              }
            }
          }
        }
      }

      const waitTime = this.calculateWaitTime(firstAccountFinishTime);
      if (waitTime && waitTime > 0) {
        await this.waitWithCountdown(Math.floor(waitTime / 1000));
      } else {
        await this.log("No valid wait time, continuing loop immediately.", "yellow", true);
        await this.waitWithCountdown(5);
      }
    }
  }
}

if (require.main === module) {
  const fintopio = new Fintopio();
  fintopio.main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
