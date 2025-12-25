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

/* 🔥 Evita que Render se duerma */
app.get("/", (_, res) => res.send("OK"));

async function telegram(endpoint, payload, token) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await r.json();

  if (!data.ok && data.parameters?.migrate_to_chat_id) {
    payload.chat_id = data.parameters.migrate_to_chat_id;
    return telegram(endpoint, payload, token);
  }

  if (!data.ok) throw data;
  return data;
}

app.post("/telegram", async (req, res) => {
  try {
    if (req.headers["x-secret"] !== process.env.SECRET_KEY) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { text, photo } = req.body;
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    /* 1️⃣ Intentar con foto */
    if (photo && photo.startsWith("http")) {
      try {
        await telegram(
          "sendPhoto",
          { chat_id: chatId, photo, caption: text },
          token
        );
        return res.json({ ok: true, mode: "photo" });
      } catch (e) {
        console.warn("Foto falló, enviando solo texto");
      }
    }

    /* 2️⃣ Fallback seguro: solo texto */
    await telegram(
      "sendMessage",
      { chat_id: chatId, text },
      token
    );

    res.json({ ok: true, mode: "text" });
  } catch (e) {
    console.error("Telegram error final:", e);
    res.status(500).json({ error: "Telegram failed" });
  }
});

app.listen(3000, () => {
  console.log("Webhook activo en puerto 3000");
});




