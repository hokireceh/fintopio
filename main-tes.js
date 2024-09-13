const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const colors = require("colors");
const readline = require("readline");
const { DateTime } = require("luxon");
require('dotenv').config(); // Memuat variabel lingkungan dari .env

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

  log(msg, color = "white") {
    console.log(msg[color]);
  }

  async sendToTelegram(message) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    };

    try {
      await axios.post(url, payload);
      console.log('Pesan berhasil dikirim ke Telegram');
    } catch (error) {
      console.error('Error mengirim pesan ke Telegram:', error.response ? error.response.data : error.message);
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
      const token = response.data.token;
      await this.sendToTelegram(`Login berhasil untuk ${userData}`);
      return token;
    } catch (error) {
      await this.sendToTelegram(`Error autentikasi: ${error.message}`);
      this.log(`Authentication error: ${error.message}`, "red");
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
      await this.sendToTelegram(`Error fetching profile: ${error.message}`);
      this.log(`Error fetching profile: ${error.message}`, "red");
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
      await this.sendToTelegram(`Daily check-in successful!`);
      this.log("Daily check-in successful!", "green");
    } catch (error) {
      await this.sendToTelegram(`Daily check-in error: ${error.message}`);
      this.log(`Daily check-in error: ${error.message}`, "red");
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
      await this.sendToTelegram(`Error fetching farming state: ${error.message}`);
      this.log(`Error fetching farming state: ${error.message}`, "red");
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
        await this.sendToTelegram(`Starting farm... Farming completion time: ${finishTime}`);
        this.log(`Starting farm...`, "yellow");
        this.log(`Farming completion time: ${finishTime}`, "green");
      } else {
        await this.sendToTelegram(`No completion time available.`);
        this.log("No completion time available.", "yellow");
      }
    } catch (error) {
      await this.sendToTelegram(`Error starting farming: ${error.message}`);
      this.log(`Error starting farming: ${error.message}`, "red");
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
      await this.sendToTelegram(`Farm claimed successfully!`);
      this.log("Farm claimed successfully!", "green");
    } catch (error) {
      await this.sendToTelegram(`Error claiming farm: ${error.message}`);
      this.log(`Error claiming farm: ${error.message}`, "red");
    }
  }

  async getDiamondInfo(token) {
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
      await this.sendToTelegram(`Error fetching diamond state: ${error.message}`);
      this.log(`Error fetching diamond state: ${error.message}`, "red");
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
      await this.sendToTelegram(`Success claim ${totalReward} diamonds!`);
      this.log(`Success claim ${totalReward} diamonds!`, "green");
    } catch (error) {
      await this.sendToTelegram(`Error claiming Diamond: ${error.message}`);
      this.log(`Error claiming Diamond: ${error.message}`, "red");
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
      await this.sendToTelegram(`Error fetching task state: ${error.message}`);
      this.log(`Error fetching task state: ${error.message}`, "red");
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
      await this.sendToTelegram(`Starting task ${slug}!`);
      this.log(`Starting task ${slug}!`, "green");
    } catch (error) {
      await this.sendToTelegram(`Error starting task: ${error.message}`);
      this.log(`Error starting task: ${error.message}`, "red");
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
      await this.sendToTelegram(`Claiming task ${slug} of ${rewardAmount} successfully!`);
      this.log(`Claiming task ${slug} of ${rewardAmount} successfully!`, "green");
    } catch (error) {
      await this.sendToTelegram(`Error claiming task: ${error.message}`);
      this.log(`Error claiming task: ${error.message}`, "red");
    }
  }

  async main() {
    await this.sendToTelegram('Ini adalah pesan test dari Fintopio');

    // Ambil data login, misalnya dari file atau input pengguna
    const userData = "example=user&data=test"; // Ganti sesuai kebutuhan

    // Autentikasi
    const token = await this.auth(userData);
    if (!token) return;

    // Ambil profil
    const profile = await this.getProfile(token);
    if (!profile) return;

    // Periksa dan lakukan check-in harian
    await this.checkInDaily(token);

    // Periksa status farming dan lakukan farming
    const farmingState = await this.getFarmingState(token);
    if (farmingState && farmingState.canFarm) {
      await this.startFarming(token);
    }

    // Klaim hasil farming jika ada
    await this.claimFarming(token);

    // Ambil informasi diamond dan klaim jika ada
    const diamondInfo = await this.getDiamondInfo(token);
    if (diamondInfo && diamondInfo.diamonds.length > 0) {
      await this.claimDiamond(token, diamondInfo.diamonds[0].number, diamondInfo.totalReward);
    }

    // Ambil task dan mulai serta klaim task
    const tasks = await this.getTask(token);
    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        await this.startTask(token, task.id, task.slug);
        await this.claimTask(token, task.id, task.slug, task.rewardAmount);
      }
    }

    // Akhir dari proses utama
    console.log('Selesai!');
  }
}

if (require.main === module) {
  const fintopio = new Fintopio();
  fintopio.main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
