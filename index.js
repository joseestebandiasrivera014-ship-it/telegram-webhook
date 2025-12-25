import express from "express";
import fetch from "node-fetch";
import FormData from "form-data";
import rateLimit from "express-rate-limit";

const app = express();
app.use(express.json());

app.use("/telegram", rateLimit({
  windowMs: 60 * 1000,
  max: 5
}));

const BOT_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SECRET = process.env.SECRET_KEY;

app.post("/telegram", async (req, res) => {
  if (req.headers["x-secret"] !== SECRET)
    return res.status(403).json({ error: "Forbidden" });

  try {
    const { text, photo } = req.body;

    const form = new FormData();
    form.append("chat_id", CHAT_ID);
    form.append("photo", photo || "https://via.placeholder.com/300");
    form.append("caption", text);

    const tg = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
      { method: "POST", body: form }
    );

    if (!tg.ok) throw new Error();

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Telegram error" });
  }
});

app.listen(3000, () => console.log("Webhook activo"));
