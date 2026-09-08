/**
 * Bhashini (Digital India / ULCA) translation wrapper.
 * Same two-step flow as the Python version this replaces
 * (backend/app/services/bhashini.py, now superseded — see gateway placement
 * in the technical-approach diagram). Fails soft: any error returns the
 * original text so a translation outage never breaks chat.
 *
 * Credentials: sign up free at https://bhashini.gov.in, verify email,
 * Profile page -> Generate API Key -> userId + ulcaApiKey.
 */
const axios = require("axios");

const CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline";
const PIPELINE_ID = "64392f96daac500b55c543cd";

const SUPPORTED_LANGUAGES = {
  en: "English", hi: "Hindi", bn: "Bengali", ta: "Tamil", te: "Telugu",
  mr: "Marathi", gu: "Gujarati", kn: "Kannada", ml: "Malayalam",
  pa: "Punjabi", or: "Odia", ur: "Urdu",
};

const configCache = new Map(); // "source:target" -> { serviceId, callbackUrl, authHeader }

async function getPipelineConfig(source, target) {
  const key = `${source}:${target}`;
  if (configCache.has(key)) return configCache.get(key);

  const { data } = await axios.post(
    CONFIG_URL,
    {
      pipelineTasks: [{
        taskType: "translation",
        config: { language: { sourceLanguage: source, targetLanguage: target } },
      }],
      pipelineRequestConfig: { pipelineId: PIPELINE_ID },
    },
    {
      headers: {
        "Content-Type": "application/json",
        userID: process.env.BHASHINI_USER_ID,
        ulcaApiKey: process.env.BHASHINI_API_KEY,
      },
    }
  );

  const serviceId = data.pipelineResponseConfig[0].config[0].serviceId;
  const endpoint = data.pipelineInferenceAPIEndPoint;
  const resolved = {
    serviceId,
    callbackUrl: endpoint.callbackUrl,
    authHeader: { [endpoint.inferenceApiKey.name]: endpoint.inferenceApiKey.value },
  };
  configCache.set(key, resolved);
  return resolved;
}

async function translate(text, source, target) {
  if (!text || !text.trim() || source === target) return text;
  if (!process.env.BHASHINI_USER_ID || !process.env.BHASHINI_API_KEY) return text;

  try {
    const cfg = await getPipelineConfig(source, target);
    const { data } = await axios.post(
      cfg.callbackUrl,
      {
        pipelineTasks: [{
          taskType: "translation",
          config: {
            language: { sourceLanguage: source, targetLanguage: target },
            serviceId: cfg.serviceId,
          },
        }],
        inputData: { input: [{ source: text }] },
      },
      { headers: { "Content-Type": "application/json", ...cfg.authHeader }, timeout: 15000 }
    );
    return data.pipelineResponse[0].output[0].target;
  } catch (err) {
    console.error("Bhashini translate failed, returning original text:", err.message);
    return text;
  }
}

module.exports = { translate, SUPPORTED_LANGUAGES };
