import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// サービスアカウント JSON を1環境変数に入れる方式だけを使う（Vercel Secret / .env.local）。
function readServiceAccountFromJsonEnv(): Record<string, unknown> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      typeof parsed.private_key !== "string" ||
      typeof parsed.client_email !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function ensureAdminAppInitialized() {
  if (getApps().length > 0) return;

  const fromJson = readServiceAccountFromJsonEnv();
  if (fromJson) {
    initializeApp({
      credential: cert(fromJson as Parameters<typeof cert>[0]),
    });
    return;
  }

  throw new Error(
    "Firebase Admin 用の FIREBASE_SERVICE_ACCOUNT_JSON がありません。web/.env.example を参照し、サービスアカウント JSON の全文を .env.local（ローカル）と Vercel の Environment Variables（本番）に設定してください。Git / チャットには貼らないでください。"
  );
}

export function getAdminDb() {
  ensureAdminAppInitialized();
  return getFirestore();
}

export function getAdminAuth() {
  ensureAdminAppInitialized();
  return getAuth();
}
