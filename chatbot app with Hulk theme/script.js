const MODEL = "gemini-2.0-flash";
const STORAGE_KEY = "gemini_api_key";

const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const apiKeyInput = document.getElementById("apiKey");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const sendBtn = document.getElementById("sendBtn");

let conversation = [];

function addMessage(text, role = "system") {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = text;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function setSending(isSending) {
  sendBtn.disabled = isSending;
  sendBtn.textContent = isSending ? "Thinking..." : "Send";
}

function loadApiKey() {
  const saved = localStorage.getItem(STORAGE_KEY) || "";
  apiKeyInput.value = saved;
}

function saveApiKey() {
  const key = apiKeyInput.value.trim();
  if (!key) {
    addMessage("Please enter a Gemini API key first.", "system");
    return;
  }
  localStorage.setItem(STORAGE_KEY, key);
  addMessage("API key saved locally in your browser.", "system");
}

async function askGemini(userText) {
  const apiKey = localStorage.getItem(STORAGE_KEY) || apiKeyInput.value.trim();
  if (!apiKey) {
    throw new Error("No API key found. Save your Gemini API key first.");
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  conversation.push({
    role: "user",
    parts: [{ text: userText }]
  });

  const payload = {
    contents: conversation,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini request failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  const modelText =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n").trim() ||
    "No response text returned.";

  conversation.push({
    role: "model",
    parts: [{ text: modelText }]
  });

  return modelText;
}

saveKeyBtn.addEventListener("click", saveApiKey);

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  messageInput.value = "";
  setSending(true);

  try {
    const reply = await askGemini(text);
    addMessage(reply, "bot");
  } catch (error) {
    addMessage(error.message || "Something went wrong.", "system");
  } finally {
    setSending(false);
    messageInput.focus();
  }
});

loadApiKey();
addMessage("Welcome to GammaChat. Save your Gemini API key and start chatting.", "system");
