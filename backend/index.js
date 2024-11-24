import express from 'express';
import { Client } from 'pg';
import axios from 'axios';
import cors from 'cors';
import path from 'path';

const app = express();
const port = 3000;

// ตั้งค่าการเชื่อมต่อฐานข้อมูล PostgreSQL
const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
});

// ฟังก์ชันเพื่อแปลงวันที่เป็นสตริงในรูปแบบ 'YYYY-MM-DD'
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// ฟังก์ชันดึงข้อมูลและอัปเดตฐานข้อมูลย้อนหลัง
async function fetchHistoricalDataAndUpdate() {
    const currentDate = new Date(); // วันที่ปัจจุบัน
    const startDate = new Date(); // วันที่เริ่มต้น
    startDate.setDate(currentDate.getDate() - 30); // ตั้งค่าให้ย้อนหลังแค่ 30 วัน

    currentDate.setHours(0, 0, 0, 0); // ตั้งเวลาเป็นเที่ยงคืน
    startDate.setHours(0, 0, 0, 0); // ตั้งเวลาเป็นเที่ยงคืน

    // ลบข้อมูลที่เกิน 30 วัน
    try {
        await client.query(`DELETE FROM ps_currency WHERE date < $1`, [formatDate(startDate)]);
        console.log(`Deleted data older than ${formatDate(startDate)}`);
    } catch (error) {
        console.error('Error deleting old data:', error.message);
    }

    // ดึงข้อมูลย้อนหลัง 30 วัน
    while (currentDate >= startDate) {
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
                            `INSERT INTO ps_currency (date, btcdata, currency, btc) VALUES ($1, $2, $3, $4)
                             ON CONFLICT (date, currency, btcdata) DO NOTHING`,
                            [date, 'btc', currency, btcValue]
                        );
                    }
                }
            }
        } catch (error) {
            console.error(`Error fetching data for ${dateStr}:`, error.message);
        }

        currentDate.setDate(currentDate.getDate() - 1);
    }
}

// เชื่อมต่อกับฐานข้อมูลและตรวจสอบข้อกำหนด UNIQUE
client.connect()
    .then(async () => {
        console.log('Connected to PostgreSQL');

        // Ensure the 'ps_currency' table exists with required columns
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'ps_currency') THEN
                    CREATE TABLE ps_currency (
                        date DATE,
                        currency TEXT,
                        btc NUMERIC,
                        btcdata TEXT
                    );
                END IF;

                -- Ensure each column exists, if the table already exists
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ps_currency' AND column_name = 'date') THEN
                    ALTER TABLE ps_currency ADD COLUMN date DATE;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ps_currency' AND column_name = 'currency') THEN
                    ALTER TABLE ps_currency ADD COLUMN currency TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ps_currency' AND column_name = 'btc') THEN
                    ALTER TABLE ps_currency ADD COLUMN btc NUMERIC;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ps_currency' AND column_name = 'btcdata') THEN
                    ALTER TABLE ps_currency ADD COLUMN btcdata TEXT;
                END IF;
            END
            $$;
        `);

        console.log("Table and columns ensured");

        // Ensure the unique constraint exists
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'unique_ps_currency_entry'
                    AND conrelid = 'ps_currency'::regclass
                ) THEN
                    ALTER TABLE ps_currency
                    ADD CONSTRAINT unique_ps_currency_entry UNIQUE (date, currency, btcdata);
                END IF;
            END
            $$;
        `);
        console.log("Unique constraint ensured on (date, currency, btcdata)");

        // Fetch historical data for the past 30 days
        await fetchHistoricalDataAndUpdate();
    })
    .catch(err => console.error('Connection error', err.stack));

app.use(cors());

app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => {
    res.send('Welcome to the BTC Currency Exchange API!');
});

// Endpoint สำหรับดึงข้อมูลและอัปเดตฐานข้อมูลล่าสุด
app.get('/api/currency', async (req, res) => {
    try {
        await fetchHistoricalDataAndUpdate();
        res.json({ message: 'Currency data updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching currency data', error: error.message });
    }
});

// Endpoint ใหม่สำหรับส่งข้อมูลให้ Front-end
app.get('/api/currency-data', async (req, res) => {
    try {
        const result = await client.query(`SELECT date, currency, btc FROM ps_currency ORDER BY date ASC`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching currency data for front-end:', error.message);
        res.status(500).json({ message: 'Error fetching data', error: error.message });
    }
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "about.html"));
});

// เริ่มเซิร์ฟเวอร์
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});