require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');
const { DateTime } = require('luxon');
const fetch = require('node-fetch'); // Tambahkan ini untuk import node-fetch

class Fintopio {
  constructor() {
    this.baseUrl = 'https://fintopio-tg.fintopio.com/api';
    this.headers = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: 'https://fintopio-tg.fintopio.com/',
      'Sec-Ch-Ua': '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
      'Sec-Ch-Ua-Mobile': '?1',
      'Sec-Ch-Ua-Platform': '"Android"',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36',
    };
  }

  log(msg, color = 'white') {
    console.log(msg[color]);
    this.sendTelegramMessage(msg); // Kirim pesan ke bot Telegram
  }

  async sendTelegramMessage(message) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: message,
    };

    try {
      await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error(`Error mengirim pesan ke Telegram: ${error.message}`);
    }
  }

  async waitWithCountdown(seconds, msg = 'melanjutkan') {
    const spinners = ['|', '/', '-', '\\'];
    let i = 0;
    for (let s = seconds; s >= 0; s--) {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(
        `${spinners[i]} Menunggu ${s} detik untuk ${msg} ${spinners[i]}`.cyan
      );
      i = (i + 1) % spinners.length;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log('');
  }

  async auth(userData) {
    const url = `${this.baseUrl}/auth/telegram`;
    const headers = { ...this.headers, Webapp: 'true' };

    try {
      const response = await axios.get(`${url}?${userData}`, { headers });
      return response.data.token;
    } catch (error) {
      this.log(`Kesalahan otentikasi: ${error.message}`, 'red');
      return null;
    }
  }

  async getProfile(token) {
    const url = `${this.baseUrl}/referrals/data`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      Webapp: 'false, true',
    };

    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      this.log(`Kesalahan mengambil profil: ${error.message}`, 'red');
      return null;
    }
  }

  async checkInDaily(token) {
    const url = `${this.baseUrl}/daily-checkins`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      await axios.post(url, {}, { headers });
      this.log('Check-in harian berhasil!', 'green');
    } catch (error) {
      this.log(`Kesalahan check-in harian: ${error.message}`, 'red');
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
      this.log(`Kesalahan mengambil status farming: ${error.message}`, 'red');
      return null;
    }
  }

  async startFarming(token) {
    const url = `${this.baseUrl}/farming/farm`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await axios.post(url, {}, { headers });
      const finishTimestamp = response.data.timings.finish;

      if (finishTimestamp) {
        const finishTime = DateTime.fromMillis(finishTimestamp).toLocaleString(
          DateTime.DATETIME_FULL
        );
        this.log(`Memulai farming...`, 'yellow');
        this.log(`Waktu selesai farming: ${finishTime}`, 'green');
      } else {
        this.log('Tidak ada waktu penyelesaian yang tersedia.', 'yellow');
      }
    } catch (error) {
      this.log(`Kesalahan memulai farming: ${error.message}`, 'red');
    }
  }

  async claimFarming(token) {
    const url = `${this.baseUrl}/farming/claim`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      await axios.post(url, {}, { headers });
      this.log('Farming berhasil diklaim!', 'green');
    } catch (error) {
      this.log(`Kesalahan mengklaim farming: ${error.message}`, 'red');
    }
  }

  async getDiamondInfo(token) {
    const url = `${this.baseUrl}/clicker/diamond/state`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      this.log(`Kesalahan mengambil status diamond: ${error.message}`, 'red');
      return null;
    }
  }

  async claimDiamond(token, diamondNumber, totalReward) {
    const url = `${this.baseUrl}/clicker/diamond/complete`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const payload = { diamondNumber: diamondNumber };

    try {
      await axios.post(url, payload, { headers });
      this.log(`Berhasil mengklaim ${totalReward} diamond!`, 'green');
    } catch (error) {
      this.log(`Kesalahan mengklaim diamond: ${error.message}`, 'red');
    }
  }

  async getTask(token) {
    const url = `${this.baseUrl}/hold/tasks`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      this.log(`Kesalahan mengambil status tugas: ${error.message}`, 'red');
      return null;
    }
  }

  async startTask(token, taskId, slug) {
    const url = `${this.baseUrl}/hold/tasks/${taskId}/start`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
      origin: 'https://fintopio-tg.fintopio.com',
    };
    try {
      await axios.post(url, {}, { headers });
      this.log(`Memulai tugas ${slug}!`, 'green');
    } catch (error) {
      this.log(`Kesalahan memulai tugas: ${error.message}`, 'red');
    }
  }

  async claimTask(token, taskId, slug, rewardAmount) {
    const url = `${this.baseUrl}/hold/tasks/${taskId}/claim`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
      origin: 'https://fintopio-tg.fintopio.com',
    };

    try {
      await axios.post(url, {}, { headers });
      this.log(`Mengklaim tugas ${slug} senilai ${rewardAmount} berhasil!`, 'green');
    } catch (error) {
      this.log(`Kesalahan mengklaim tugas: ${error.message}`, 'red');
    }
  }

  async main() {
    while (true) {
      const dataFile = path.join(__dirname, 'data.txt');
      const data = await fs.readFile(dataFile, 'utf8');
      const users = data.split('\n').filter(Boolean);

      let firstAccountFinishTime = null;

      for (let i = 0; i < users.length; i++) {
        const userData = users[i];
        const first_name = this.extractFirstName(userData);
        console.log(
          `${'='.repeat(5)} Akun ${i + 1} | ${first_name.green} ${'='.repeat(
            5
          )}`.blue
        );
        const token = await this.auth(userData);
        if (token) {
          this.log('Login berhasil!', 'green');
          const profile = await this.getProfile(token);
          if (profile) {
            const balance = profile.balance;
            this.log(`Saldo: ${balance}`, 'green');

            await this.checkInDaily(token);

            const diamond = await this.getDiamondInfo(token);
            if(diamond.state === 'available') {
              await this.waitWithCountdown(Math.floor(Math.random() * (21 - 10)) + 10, 'klaim Diamond');
              await this.claimDiamond(token, diamond.diamondNumber, diamond.settings.totalReward);
            } else {
                const nextDiamondTimeStamp = diamond.timings.nextAt;
                if(nextDiamondTimeStamp) {
                    const nextDiamondTime = DateTime.fromMillis(
                        nextDiamondTimeStamp
                    ).toLocaleString(DateTime.DATETIME_FULL);
                    this.log(`Waktu Diamond berikutnya: ${nextDiamondTime}`, 'green');

                    if (i === 0) {
                        firstAccountFinishTime = nextDiamondTimeStamp;
                    }
                }
            }

            const farmingState = await this.getFarmingState(token);

            if (farmingState) {
              if (farmingState.state === 'idling') {
                await this.startFarming(token);
              } else if (
                farmingState.state === 'farmed' ||
                farmingState.state === 'farming'
              ) {
                const finishTimestamp = farmingState.timings.finish;
                if (finishTimestamp) {
                  const finishTime = DateTime.fromMillis(
                    finishTimestamp
                  ).toLocaleString(DateTime.DATETIME_FULL);
                  this.log(`Waktu selesai farming: ${finishTime}`, 'green');

                  const currentTime = DateTime.now().toMillis();
                  if (currentTime > finishTimestamp) {
                    await this.claimFarming(token);
                    await this.startFarming(token);
                  }
                }
              }
            }

            const taskState = await this.getTask(token);

            if(taskState) {
                for (const item of taskState.tasks) {
                    if(item.status === 'available') {
                        await this.startTask(token, item.id, item.slug);
                    } else if(item.status === 'verified') {
                        await this.claimTask(token, item.id, item.slug, item.rewardAmount);
                    } else if(item.status === 'in-progress') {
                        continue;
                    } else {
                        this.log(`Memverifikasi tugas ${item.slug}!`, 'green');
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
        this.log('Tidak ada waktu tunggu yang valid, melanjutkan loop segera.', 'yellow');
        await this.waitWithCountdown(5);
      }
    }
  }

  calculateWaitTime(firstAccountFinishTime) {
    if (!firstAccountFinishTime) return 0;

    const currentTime = DateTime.now().toMillis();
    return firstAccountFinishTime - currentTime;
  }

  extractFirstName(userData) {
    // Implementasikan logika ekstraksi nama depan dari userData
    return userData.split(' ')[0]; // Contoh implementasi sederhana
  }
}

if (require.main === module) {
  const fintopio = new Fintopio();
  fintopio.main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
