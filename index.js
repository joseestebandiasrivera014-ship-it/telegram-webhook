import express from "express";
import fetch from "node-fetch";

const app = express();
app.set("trust proxy", 1);
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://eventos-ciudad.web.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Secret");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.post("/telegram", async (req, res) => {
  if (req.headers["x-secret"] !== process.env.SECRET_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { text, photo } = req.body;

  const payload = photo
    ? {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        photo,
        caption: text
      }
    : {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text
      };

  const endpoint = photo ? "sendPhoto" : "sendMessage";

  const tg = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/${endpoint}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  );

  const data = await tg.json();

  if (!data.ok) {
    console.error("Telegram error:", data);
    return res.status(500).json(data);
  }

  res.json({ ok: true });
});

app.listen(3000);



