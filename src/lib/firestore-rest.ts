/**
 * Firestore REST API helper
 *
 * نستخدم REST بدل Firebase client SDK جوه الـ server routes لأن الـ SDK
 * بيعتمد على `localStorage` / بيئة المتصفح ومش شغال في Cloudflare Workers.
 *
 * راجع: https://firebase.google.com/docs/firestore/use-rest-api
 */

const PROJECT_ID = 'domainview';
const API_KEY = 'AIzaSyA-AuKkPZiuQdA-NIPjObheWabwnrqwG7g';

const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/** يحوّل قيمة Firestore REST إلى قيمة JS عادية */
function fromFirestoreValue(v: any): any {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(fromFirestoreValue);
  if ('mapValue' in v) return fromFirestoreFields(v.mapValue.fields ?? {});
  return null;
}

/** يحوّل حقول Firestore REST إلى كائن JS */
function fromFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) out[k] = fromFirestoreValue(v);
  return out;
}

/** يحوّل قيمة JS إلى صيغة Firestore REST */
function toFirestoreValue(v: any): any {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFirestoreValue) } };
  if (typeof v === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, val] of Object.entries(v)) fields[k] = toFirestoreValue(val);
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = toFirestoreValue(v);
  return fields;
}

/** يقرأ مستندًا. يرجّع null لو مش موجود. */
export async function getFirestoreDoc(
  collection: string,
  docId: string
): Promise<Record<string, any> | null> {
  const res = await fetch(`${BASE}/${collection}/${docId}?key=${API_KEY}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Firestore GET ${collection}/${docId} failed: ${res.status} ${res.statusText}`);
  }
  const json: any = await res.json();
  return fromFirestoreFields(json.fields ?? {});
}

/** يكتب/يحدّث مستندًا */
export async function setFirestoreDoc(
  collection: string,
  docId: string,
  data: Record<string, any>
): Promise<void> {
  const res = await fetch(`${BASE}/${collection}/${docId}?key=${API_KEY}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Firestore PATCH ${collection}/${docId} failed: ${res.status} ${text}`);
  }
}
