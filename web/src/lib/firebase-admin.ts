import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// .env 用に値全体を '...' や "..." で囲んだ場合、Vercel の平文入力では囲み自体が文字列に含まれることがあるので外す。
function stripOptionalOuterQuotes(raw: string): string {
  const t = raw.trim();
  if (t.length >= 2) {
    if (t.startsWith("'") && t.endsWith("'")) return t.slice(1, -1).trim();
    if (t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1).trim();
  }
  return t;
}

type ServiceAccountReadResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; reason: "missing" | "parse" | "shape" };

// サービスアカウント JSON を1環境変数に入れる方式だけを使う（Vercel Secret / .env.local）。
function readServiceAccountFromJsonEnv(): ServiceAccountReadResult {
  const rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawEnv?.trim()) return { ok: false, reason: "missing" };
  const raw = stripOptionalOuterQuotes(rawEnv);
  if (!raw) return { ok: false, reason: "missing" };
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      typeof parsed.private_key !== "string" ||
      typeof parsed.client_email !== "string"
    ) {
      return { ok: false, reason: "shape" };
    }
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, reason: "parse" };
  }
}

function serviceAccountErrorMessage(reason: "missing" | "parse" | "shape"): string {
  const vercelHint =
    process.env.VERCEL === "1"
      ? " Vercel の Project → Settings → Environment Variables で Production に FIREBASE_SERVICE_ACCOUNT_JSON を設定し Redeploy してください（ダッシュボードの値は引用符で囲まない生の JSON が無難です）。"
      : "";
  if (reason === "missing") {
    return (
      "FIREBASE_SERVICE_ACCOUNT_JSON が未設定か空です。ローカルなら web/.env.local に1行で設定し next dev を再起動してください。" +
      vercelHint
    );
  }
  if (reason === "parse") {
    return (
      "FIREBASE_SERVICE_ACCOUNT_JSON はありますが JSON として解析できません。1行にまとめる・private_key 内の改行は \\n のままにする、を確認してください。" +
      vercelHint
    );
  }
  return (
    "FIREBASE_SERVICE_ACCOUNT_JSON は JSON ですが client_email / private_key が文字列としてありません。サービスアカウントのキーJSONか確認してください。" +
    vercelHint
  );
}

function ensureAdminAppInitialized() {
  if (getApps().length > 0) return;

  const read = readServiceAccountFromJsonEnv();
  if (read.ok) {
    initializeApp({
      credential: cert(read.data as Parameters<typeof cert>[0]),
    });
    return;
  }

  throw new Error(serviceAccountErrorMessage(read.reason));
}

export function getAdminDb() {
  ensureAdminAppInitialized();
  return getFirestore();
}

export function getAdminAuth() {
  ensureAdminAppInitialized();
  return getAuth();
}
