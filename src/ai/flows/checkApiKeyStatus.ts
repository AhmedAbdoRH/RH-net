'use server';
/**
 * @fileOverview
 * A realistic Gemini API key validator.
 * This version simulates the same type of request a chatbot would send,
 * so only truly working keys will pass (not just valid ones).
 *
 * ملاحظة: كانت هذه الدالة تُعرَّف عبر genkit، لكنها لا تستخدم أي قدرة من قدراته
 * (مجرد fetch لـ Gemini REST API). أُزيل الاعتماد على genkit لتقليل حجم الـ bundle
 * وتفادي سحب حزم OpenTelemetry التي تُكسِر بناء Cloudflare Workers.
 */

export interface CheckApiKeyStatusInput {
  apiKey: string;
}

export interface CheckApiKeyStatusOutput {
  isWorking: boolean;
  statusCode?: number;
  message?: string;
}

export async function checkApiKeyStatus(
  input: CheckApiKeyStatusInput
): Promise<CheckApiKeyStatusOutput> {
  const { apiKey } = input;
  const GEMINI_MODEL = 'gemini-2.5-flash';
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  try {
    // نرسل طلب بنفس طريقة البوت الحقيقي
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'اختبار اتصال API للدردشة' }],
          },
        ],
      }),
    });

    const data: any = await response.json();

    // ✅ تحقق واقعي: لازم يرجع candidates مع output text
    if (response.ok && Array.isArray(data?.candidates) && data.candidates[0]?.content?.parts?.[0]?.text) {
      return {
        isWorking: true,
        statusCode: response.status,
        message: `API key works properly. Response: ${data.candidates[0].content.parts[0].text.substring(0, 50)}...`,
      };
    }

    // ❌ مفتاح غير شغال فعليًا
    console.log(`API Key validation failed for key ending with ...${apiKey.slice(-4)}:`, {
      status: response.status,
      statusText: response.statusText,
      error: data?.error,
    });

    return {
      isWorking: false,
      statusCode: response.status,
      message: data?.error?.message || `API key not functional. Status: ${response.status}`,
    };
  } catch (error: any) {
    console.error(`Error validating key ending with ...${apiKey.slice(-4)}:`, {
      error: error.message,
      type: error.name,
      stack: error.stack,
    });
    return {
      isWorking: false,
      message: `Network or unexpected error: ${error.message}`,
    };
  }
}
