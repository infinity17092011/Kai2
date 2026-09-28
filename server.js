require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL =
  process.env.GROQ_MODEL || "openai/gpt-oss-120b";

if (!GROQ_API_KEY) {
  console.warn("WARNING: GROQ_API_KEY is missing.");
}

app.get("/", (req, res) => {
  res.json({
    status: "online",
    name: "Kai Backend",
    message: "Kai backend is running."
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

app.post("/api/kai/chat", async (req, res) => {
  try {
    const { message, conversation } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required."
      });
    }

    if (!GROQ_API_KEY) {
      return res.status(500).json({
        error: "AI service is not configured."
      });
    }

    const messages = [
      {
        role: "system",
        content:
          "You are Kai, a confident, funny and helpful AI conversation coach. " +
          "Be natural, concise and useful. Never claim to be human. " +
          "Help the user craft confident, respectful messages and conversations. " +
          "Do not encourage manipulation, harassment, pressure, or disrespect."
      }
    ];

    if (Array.isArray(conversation)) {
      for (const item of conversation.slice(-12)) {
        if (
          item &&
          (item.role === "user" || item.role === "assistant") &&
          typeof item.content === "string"
        ) {
          messages.push({
            role: item.role,
            content: item.content
          });
        }
      }
    }

    messages.push({
      role: "user",
      content: message
    });

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          temperature: 0.8,
          max_tokens: 500
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);

      return res.status(500).json({
        error: "Kai could not get a response."
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Kai didn't have a response.";

    res.json({
      reply
    });
  } catch (error) {
    console.error("Server error:", error);

    res.status(500).json({
      error: "Something went wrong."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Kai backend running on port ${PORT}`);
});