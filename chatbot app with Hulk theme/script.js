const PREFERRED_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];
const STORAGE_KEY = "gemini_api_key";
// Keep blank in git; set locally only if needed.
const EMBEDDED_API_KEY = "";
const USER_NAME = "Bruce Banner";
const AGENT_NAME = "Hulk";

const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const apiKeyInput = document.getElementById("apiKey");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const apiPanel = document.getElementById("apiPanel");
const toggleApiPanelBtn = document.getElementById("toggleApiPanelBtn");
const sendBtn = document.getElementById("sendBtn");

let conversation = [];

function addMessage(text, role = "system") {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  if (role === "user") {
    div.textContent = `${USER_NAME}: ${text}`;
  } else if (role === "bot") {
    div.textContent = `${AGENT_NAME}: ${text}`;
  } else {
    div.textContent = text;
  }
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function setSending(isSending) {
  sendBtn.disabled = isSending;
  sendBtn.textContent = isSending ? "Thinking..." : "Send";
}

function loadApiKey() {
  const saved = localStorage.getItem(STORAGE_KEY) || EMBEDDED_API_KEY || "";
  apiKeyInput.value = saved;
}

function hasApiKeyConfigured() {
  return Boolean((localStorage.getItem(STORAGE_KEY) || EMBEDDED_API_KEY || "").trim());
}

function setApiPanelVisibility(visible) {
  if (visible) {
    apiPanel.classList.remove("hidden");
    toggleApiPanelBtn.textContent = "Hide API Key";
    return;
  }
  apiPanel.classList.add("hidden");
  toggleApiPanelBtn.textContent = "Change API Key";
}

function saveApiKey() {
  const key = apiKeyInput.value.trim();
  if (!key) {
    addMessage("Please enter a Gemini API key first.", "system");
    return;
  }
  localStorage.setItem(STORAGE_KEY, key);
  addMessage("API key saved locally in your browser.", "system");
  setApiPanelVisibility(false);
}

function buildFriendlyGeminiError(status, data, rawText) {
  const apiMessage = data?.error?.message || "";
  const apiStatus = data?.error?.status || "";
  const retryDelay = data?.error?.details?.find(
    (d) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
  )?.retryDelay;

  if (status === 429 || apiStatus === "RESOURCE_EXHAUSTED") {
    let msg =
      "Gemini quota/rate limit reached for this API key or project. " +
      "Please check Google AI Studio usage, wait briefly, or use a key/project with available quota.";

    if (retryDelay) {
      msg += ` Retry suggested by API: ${retryDelay}.`;
    }
    return msg;
  }

  if (status === 401 || status === 403) {
    return "Authentication failed. Verify your Gemini API key and project permissions.";
  }

  return apiMessage || rawText || `Gemini request failed with status ${status}.`;
}

async function requestGeminiWithModel(model, apiKey, payload) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const rawText = await res.text();
    let parsed = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }
    return {
      ok: false,
      status: res.status,
      parsed,
      rawText
    };
  }

  const data = await res.json();
  return { ok: true, data };
}

async function listSupportedModels(apiKey) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  const models = data?.models || [];
  return models
    .filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
    .map((m) => (m.name || "").replace("models/", ""))
    .filter(Boolean);
}

function buildModelOrder(availableModels) {
  if (!availableModels.length) return PREFERRED_MODELS;

  const preferred = PREFERRED_MODELS.filter((m) => availableModels.includes(m));
  const otherGemini = availableModels.filter(
    (m) => m.startsWith("gemini-") && !preferred.includes(m)
  );
  return [...preferred, ...otherGemini];
}

async function askGemini(userText) {
  const apiKey =
    localStorage.getItem(STORAGE_KEY) || EMBEDDED_API_KEY || apiKeyInput.value.trim();
  if (!apiKey) {
    throw new Error("No API key found. Save your Gemini API key first.");
  }

  conversation.push({
    role: "user",
    parts: [{ text: userText }]
  });
  const userMessageIndex = conversation.length - 1;

  const payload = {
    contents: conversation,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512
    }
  };

  const availableModels = await listSupportedModels(apiKey);
  const modelsToTry = buildModelOrder(availableModels);
  if (!modelsToTry.length) {
    conversation.splice(userMessageIndex, 1);
    throw new Error(
      "No Gemini models with generateContent are available for this API key/project."
    );
  }

  let finalError = null;
  for (const model of modelsToTry) {
    const result = await requestGeminiWithModel(model, apiKey, payload);
    if (result.ok) {
      const modelText =
        result.data?.candidates?.[0]?.content?.parts
          ?.map((p) => p.text)
          .join("\n")
          .trim() || "No response text returned.";

      conversation.push({
        role: "model",
        parts: [{ text: modelText }]
      });

      return modelText;
    }

    finalError = buildFriendlyGeminiError(result.status, result.parsed, result.rawText);
  }

  // Remove the pending user turn from conversation if all model calls fail.
  conversation.splice(userMessageIndex, 1);
  throw new Error(
    finalError ||
      "Gemini request failed for all configured models. Check API key, quota, and model availability."
  );
}

saveKeyBtn.addEventListener("click", saveApiKey);
toggleApiPanelBtn.addEventListener("click", () => {
  const isHidden = apiPanel.classList.contains("hidden");
  setApiPanelVisibility(isHidden);
  if (isHidden) {
    apiKeyInput.focus();
  }
});

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
if (hasApiKeyConfigured()) {
  setApiPanelVisibility(false);
  addMessage("Welcome to GammaChat. API key detected. Start chatting.", "system");
} else {
  setApiPanelVisibility(true);
  addMessage("Welcome to GammaChat. Save your Gemini API key and start chatting.", "system");
}
