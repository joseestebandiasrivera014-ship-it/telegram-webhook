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

/* 🔥 IMPORTANTE: evita que Render se duerma */
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

async function enviarTelegram(endpoint, payload, token) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await r.json();

  /* 🧠 Grupo migrado a supergrupo */
  if (!data.ok && data.parameters?.migrate_to_chat_id) {
    console.log("Grupo migrado, reenviando a:", data.parameters.migrate_to_chat_id);
    payload.chat_id = data.parameters.migrate_to_chat_id;

    return fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  if (!data.ok) {
    console.error("Error Telegram:", data);
    throw new Error("Telegram error");
  }

  return data;
}

app.post("/telegram", async (req, res) => {
  try {
    if (req.headers["x-secret"] !== process.env.SECRET_KEY) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { text, photo } = req.body;
    const token = process.env.TELEGRAM_TOKEN;
    let chatId = process.env.TELEGRAM_CHAT_ID;

    if (!text) {
      return res.status(400).json({ error: "Text requerido" });
    }

    if (photo && photo.startsWith("http") && !photo.includes("placeholder")) {
      await enviarTelegram(
        "sendPhoto",
        {
          chat_id: chatId,
          photo,
          caption: text
        },
        token
      );
    } else {
      await enviarTelegram(
        "sendMessage",
        {
          chat_id: chatId,
          text
        },
        token
      );
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("Telegram falló:", e.message);
    res.status(500).json({ error: "Telegram failed" });
  }
});

app.listen(3000, () => {
  console.log("Webhook activo en puerto 3000");
});




