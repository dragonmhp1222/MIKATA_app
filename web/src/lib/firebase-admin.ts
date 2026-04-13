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

// エディタやダッシュボード貼り付けで先頭に付く BOM を除く（JSON.parse が失敗する原因になる）。
function stripBom(s: string): string {
  return s.replace(/^\uFEFF/, "");
}

type ServiceAccountReadResult =
  | { ok: true; data: Record<string, unknown> }
  | {
      ok: false;
      reason: "missing" | "parse" | "shape" | "base64_invalid";
    };

// JSON 文字列として複数パターンを試す（二重に JSON 文字列化された値など）。
function tryParseServiceAccountJson(raw: string): ServiceAccountReadResult {
  const s = stripBom(stripOptionalOuterQuotes(raw.trim()));
  if (!s) return { ok: false, reason: "parse" };

  const candidates: string[] = [s];
  if (s.startsWith('"') && s.endsWith('"')) {
    try {
      const inner = JSON.parse(s);
      if (typeof inner === "string") candidates.push(inner);
    } catch {
      /* 次へ */
    }
  }

  for (const c of candidates) {
    try {
      const parsed = JSON.parse(c) as Record<string, unknown>;
      if (
        typeof parsed.private_key !== "string" ||
        typeof parsed.client_email !== "string"
      ) {
        return { ok: false, reason: "shape" };
      }
      return { ok: true, data: parsed };
    } catch {
      /* 次の候補へ */
    }
  }

  console.error("[firebase-admin] service account JSON parse failed (no secrets)", {
    length: s.length,
    firstNonWsChar: s.trimStart().slice(0, 1),
    firstNonWsCode: s.trimStart().charCodeAt(0),
  });
  return { ok: false, reason: "parse" };
}

type RawEnvResult =
  | { ok: true; raw: string; source: "json" | "base64" }
  | { ok: false; reason: "missing" | "base64_invalid" };

// BASE64 があればそちらを優先（Vercel で特殊文字・改行の問題を避けやすい）。
function getRawServiceAccountString(): RawEnvResult {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (b64) {
    try {
      const decoded = Buffer.from(b64, "base64").toString("utf8");
      if (!decoded.trim()) return { ok: false, reason: "base64_invalid" };
      return { ok: true, raw: decoded, source: "base64" };
    } catch {
      return { ok: false, reason: "base64_invalid" };
    }
  }

  const rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!rawEnv) return { ok: false, reason: "missing" };
  return { ok: true, raw: rawEnv, source: "json" };
}

// サービスアカウント JSON を1環境変数に入れる方式だけを使う（Vercel Secret / .env.local）。
function readServiceAccountFromJsonEnv(): ServiceAccountReadResult {
  const got = getRawServiceAccountString();
  if (!got.ok) {
    if (got.reason === "missing") return { ok: false, reason: "missing" };
    return { ok: false, reason: "base64_invalid" };
  }
  return tryParseServiceAccountJson(got.raw);
}

function serviceAccountErrorMessage(
  reason: "missing" | "parse" | "shape" | "base64_invalid"
): string {
  const vercelHint =
    process.env.VERCEL === "1"
      ? " Vercel では変数の Environment に Production にチェックが入っているか、Redeploy 済みか確認してください（Preview 用だけだと本番ドメインでは空になります）。"
      : "";
  if (reason === "missing") {
    return (
      "FIREBASE_SERVICE_ACCOUNT_JSON（または BASE64 版）が未設定か空です。ローカルなら web/.env.local に1行で設定し next dev を再起動してください。" +
      vercelHint
    );
  }
  if (reason === "base64_invalid") {
    return (
      "FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 のデコードに失敗しました。base64 文字列が切れていないか確認してください。" +
      vercelHint
    );
  }
  if (reason === "parse") {
    return (
      "FIREBASE_SERVICE_ACCOUNT_JSON はありますが JSON として解析できません。先頭の不可視文字・貼り付け欠けを疑うか、.env.example の BASE64 方式を試してください。" +
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
