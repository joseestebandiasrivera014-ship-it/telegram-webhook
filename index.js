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
  try {
    if (req.headers["x-secret"] !== process.env.SECRET_KEY) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { text, photo } = req.body;
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (photo && photo.startsWith("http") && !photo.includes("placeholder")) {
      await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          photo,
          caption: text
        })
      });
    } else {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text
        })
      });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("Telegram error:", e);
    res.status(500).json({ error: "Telegram failed" });
  }
});

app.listen(3000, () => {
  console.log("Webhook activo en puerto 3000");
});




