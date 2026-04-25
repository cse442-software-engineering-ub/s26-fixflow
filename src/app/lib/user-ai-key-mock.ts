/**
 * BYOK: provider/model lists + `maskApiKey` must stay in sync with `api/user-ai-key.php`.
 * Real API: `api.userAiKeyGet` / Save / Delete in `api.ts`.
 * Use `userAiKeyGetMock` etc. below for isolated UI tests; set TEST_SAVED_KEY_UI to exercise saved-key state.
 */
export const TEST_SAVED_KEY_UI = false;

export type UserAiKeyGetResponse = {
  hasKey: boolean;
  provider: string | null;
  model: string | null;
  maskedKey: string | null;
};

export const AI_PROVIDER_OPTIONS = [
  'Google',
  'Claude',
  'OpenAI',
  'OpenRouter',
  'NVIDIA',
  'Kimi',
  'MiniMax',
  'Qwen',
  'DeepSeek',
  'Mistral',
] as const;

export type AiProviderOption = (typeof AI_PROVIDER_OPTIONS)[number];

export const AI_MODELS_BY_PROVIDER: Record<AiProviderOption, readonly string[]> = {
  Google: [
    'gemini-3.1-pro-preview',
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-native-audio-preview-09-2025',
  ],
  Claude: [
    'claude-opus-4.6',
    'claude-sonnet-4.6',
    'claude-haiku-4.5',
    'claude-opus-4.5',
    'claude-sonnet-4.5',
  ],
  OpenAI: ['gpt-5.4', 'gpt-5.4-mini', 'gpt-5.4-nano', 'gpt-4o', 'o4-mini'],
  OpenRouter: [
    'google/gemini-3-flash-preview:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen3-coder:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'arcee-ai/trinity-large-preview:free',
  ],
  NVIDIA: [
    'nvidia/nemotron-3-super-120b-a12b',
    'nvidia/nemotron-3-nano-30b-a3b',
    'nvidia/nemotron-3-super',
    'nvidia/nemotron-mini',
    'nvidia/nemotron-4',
  ],
  Kimi: ['Kimi K2.5', 'Kimi K1.6', 'Kimi K1.5', 'Kimi K1'],
  MiniMax: ['MiniMax M2.7', 'MiniMax M2.5', 'MiniMax M2.1', 'MiniMax M2'],
  Qwen: [
    'Qwen 3.6 Plus',
    'Qwen 3.5 Omni',
    'Qwen3-Coder-480B-A35B-Instruct',
    'Qwen3-235B-A22B',
    'Qwen 3.5 9B',
  ],
  DeepSeek: [
    'DeepSeek-V3.2',
    'DeepSeek R1',
    'DeepSeek V4',
    'DeepSeek Coder',
    'DeepSeek Math',
  ],
  Mistral: ['mistral-large-3', 'mistral-small-4', 'mistral-3', 'pixtral', 'devstral'],
};

export const AI_KEY_HELPER_TEXT: Record<AiProviderOption, string> = {
  Google: 'Get your key at aistudio.google.com',
  Claude: 'Get your key at console.anthropic.com',
  OpenAI: 'Get your key at platform.openai.com/api-keys',
  OpenRouter: 'Get your key at openrouter.ai/keys',
  NVIDIA: 'Get your key at build.nvidia.com',
  Kimi: 'Get your key at platform.moonshot.cn',
  MiniMax: 'Get your key at platform.minimaxi.com',
  Qwen: 'Get your key at dashscope.console.aliyun.com',
  DeepSeek: 'Get your key at platform.deepseek.com',
  Mistral: 'Get your key at console.mistral.ai',
};

function maskApiKey(key: string): string {
  const t = key.trim();
  if (t.length <= 8) return '••••••••';
  const tail = t.slice(-4);
  return `${'•'.repeat(Math.min(24, t.length))}${tail}`;
}

/** In-memory mock persistence for the session */
let mockStore: UserAiKeyGetResponse = {
  hasKey: false,
  provider: null,
  model: null,
  maskedKey: null,
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function userAiKeyGetMock(): Promise<UserAiKeyGetResponse> {
  await delay(280);
  if (TEST_SAVED_KEY_UI) {
    return {
      hasKey: true,
      provider: 'OpenAI',
      model: 'gpt-5.4',
      maskedKey: 'sk-•••••••••••••••••••••••••abcd',
    };
  }
  return { ...mockStore };
}

export async function userAiKeySaveMock(payload: {
  provider: string;
  model: string;
  api_key: string;
}): Promise<{ success: boolean; message?: string }> {
  await delay(450);
  const masked = maskApiKey(payload.api_key);
  mockStore = {
    hasKey: true,
    provider: payload.provider,
    model: payload.model,
    maskedKey: masked,
  };
  return { success: true };
}

export async function userAiKeyDeleteMock(): Promise<{ success: boolean; message?: string }> {
  await delay(320);
  mockStore = {
    hasKey: false,
    provider: null,
    model: null,
    maskedKey: null,
  };
  return { success: true };
}

/** Reset mock store (e.g. tests) */
export function resetUserAiKeyMockStore(): void {
  mockStore = { hasKey: false, provider: null, model: null, maskedKey: null };
}
