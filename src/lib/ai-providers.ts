// Text-generation providers. All of them expose an OpenAI-compatible
// /chat/completions endpoint, so swapping providers only means changing the
// base URL, API key and model id.
export interface TextProvider {
  id: string;
  label: string;
  baseUrl: string;
  models: { id: string; label: string }[];
  keyHelpUrl: string;
  keyEnvVar: string;
  free?: boolean;
}

export const TEXT_PROVIDERS: TextProvider[] = [
  {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    models: [
      { id: "gpt-4o-mini", label: "GPT-4o mini (recomendado)" },
      { id: "gpt-4o", label: "GPT-4o (máxima calidad)" },
    ],
    keyHelpUrl: "https://platform.openai.com/api-keys",
    keyEnvVar: "OPENAI_API_KEY",
  },
  {
    id: "groq",
    label: "Groq (gratis)",
    baseUrl: "https://api.groq.com/openai/v1",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (recomendado)" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (más rápido)" },
    ],
    keyHelpUrl: "https://console.groq.com/keys",
    keyEnvVar: "GROQ_API_KEY",
    free: true,
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    models: [{ id: "deepseek-chat", label: "DeepSeek Chat" }],
    keyHelpUrl: "https://platform.deepseek.com/api_keys",
    keyEnvVar: "DEEPSEEK_API_KEY",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    models: [
      { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (gratis)" },
      { id: "openai/gpt-4o-mini", label: "GPT-4o mini (vía OpenRouter)" },
    ],
    keyHelpUrl: "https://openrouter.ai/keys",
    keyEnvVar: "OPENROUTER_API_KEY",
    free: true,
  },
];

export const DEFAULT_TEXT_PROVIDER = TEXT_PROVIDERS[0]!;

export function getTextProvider(id: string | undefined): TextProvider {
  return TEXT_PROVIDERS.find((p) => p.id === id) ?? DEFAULT_TEXT_PROVIDER;
}
