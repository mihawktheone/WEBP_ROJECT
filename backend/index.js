import express from 'express';
import { Client } from 'pg';
import axios from 'axios';
import cors from 'cors';

const app = express();
const port = 3000;
//const cors = cors();

// ตั้งค่าการเชื่อมต่อฐานข้อมูล PostgreSQL
const client = new Client({
   host: '13.214.66.96',
   port: 5432,
   user: 'postgres',
   password: '1234',
   database: 'postgres'
});

// ฟังก์ชันเพื่อแปลงวันที่เป็นสตริงในรูปแบบ 'YYYY-MM-DD'
function formatDate(date) {
   return date.toISOString().split('T')[0];
}

// ฟังก์ชันดึงข้อมูลและอัปเดตฐานข้อมูลย้อนหลัง
async function fetchHistoricalDataAndUpdate(startDate) {
   const start = new Date(startDate); // วันที่เริ่มต้น
   let currentDate = new Date(); // วันที่ปัจจุบัน

   currentDate.setHours(0, 0, 0, 0); // ตั้งเวลาเป็นเที่ยงคืน

   while (currentDate >= start) {
       const dateStr = formatDate(currentDate);
       try {
           const response = await axios.get(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${dateStr}/v1/currencies/btc.json`);

           console.log(`Fetched data for ${dateStr}:`, response.data);

           const currencyData = response.data;

           if (currencyData && typeof currencyData === 'object') {
               const date = currencyData.date;
               const btcValues = currencyData.btc;

               if (btcValues && typeof btcValues === 'object') {
                   for (const [currency, btc] of Object.entries(btcValues)) {
                       const btcValue = parseFloat(btc);
                       if (isNaN(btcValue)) {
                           console.error(`Invalid BTC value for currency ${currency} on ${date}: ${btc}`);
                           continue;
                       }

                       await client.query(
                           `INSERT INTO currency (date, btcdata, currency, btc) VALUES ($1, $2, $3, $4)
                            ON CONFLICT (date, currency, btcdata) DO NOTHING`,
                           [date, 'btc', currency, btcValue]
                       );
                   }
               }
           }
       } catch (error) {
           console.error(`Error fetching data for ${dateStr}:`, error.message);
       }

       // ลดวันลง 1 วัน
       currentDate.setDate(currentDate.getDate() - 1);
   }
}

// เชื่อมต่อกับฐานข้อมูลและตรวจสอบข้อกำหนด UNIQUE
client.connect()
   .then(async () => {
       console.log('Connected to PostgreSQL');

       await client.query(`
           DO $$
           BEGIN
               IF NOT EXISTS (
                   SELECT 1 FROM pg_constraint
                   WHERE conname = 'unique_currency_entry'
                   AND conrelid = 'currency'::regclass
               ) THEN
                   ALTER TABLE currency
                   ADD CONSTRAINT unique_currency_entry UNIQUE (date, currency, btcdata);
               END IF;
           END
           $$;
       `);
       console.log("Unique constraint ensured on (date, currency, btcdata)");

       // ดึงข้อมูลย้อนหลังตั้งแต่วันที่ที่กำหนดจนถึงวันนี้
       await fetchHistoricalDataAndUpdate('2024-10-01');
   })
   .catch(err => console.error('Connection error', err.stack));
app.use(cors())
app.get('/', (req, res) => {
    res.send('Welcome to the BTC Currency Exchange API!');
});

// Endpoint สำหรับดึงข้อมูลและอัปเดตฐานข้อมูลล่าสุด
app.get('/api/currency', async (req, res) => {
   try {
       await fetchHistoricalDataAndUpdate('2024-10-01');
       res.json({ message: 'Currency data updated successfully' });
   } catch (error) {
       res.status(500).json({ message: 'Error fetching currency data', error: error.message });
   }
});

//app.use(cors()); // อนุญาตทุกโดเมน หรือระบุ origin ที่อนุญาต เช่น { origin: 'http://localhost:5173' }

// Endpoint ใหม่สำหรับส่งข้อมูลให้ Front-end
app.get('/api/currency-data', async (req, res) => {
   try {
       const result = await client.query(`SELECT date, currency, btc FROM currency ORDER BY date ASC`);
       res.json(result.rows);
   } catch (error) {
       console.error('Error fetching currency data for front-end:', error.message);
       res.status(500).json({ message: 'Error fetching data', error: error.message });
   }
});

// เริ่มเซิร์ฟเวอร์
app.listen(port, () => {
   console.log(`Server is running on http://localhost:${port}`);
});
