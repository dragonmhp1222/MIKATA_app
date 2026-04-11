import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// サービスアカウントJSONを1つの環境変数にまとめた場合にパースする（Vercel の Secret 1本運用やインテグレーション向け）。
function readServiceAccountFromJsonEnv(): Record<string, unknown> | null {
  // 連携先が別名で渡す場合に備え、代表名を順に試す。
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ??
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  // 未設定なら使わない。
  if (!raw?.trim()) return null;
  try {
    // JSON 文字列をオブジェクトに戻す（private_key 内の \n はそのまま有効）。
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // 最低限のキーがあるか確認する（Google が配布する JSON と同形）。
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

// 従来どおり、3つの環境変数に分けて持つ方式を読む（ローカルや分割設定向け）。
function readFirebaseConfigFromParts() {
  // プロジェクトIDを読む。
  const projectId = process.env.FIREBASE_PROJECT_ID;
  // クライアントメールを読む。
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // 秘密鍵を読む（改行エスケープを戻す）。
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  // 3点が揃わない場合は未設定扱いにする。
  if (!projectId || !clientEmail || !privateKey) return null;
  // Admin SDK向け設定オブジェクトを返す。
  return { projectId, clientEmail, privateKey };
}

// Admin App を1回だけ初期化する（複数の注入形式のどれかがあればよい）。
function ensureAdminAppInitialized() {
  // すでに初期化済みなら何もしない。
  if (getApps().length > 0) return;

  // ① サービスアカウント JSON 1本（PC に JSON ファイルを置かず Vercel だけに載せる運用向け）。
  const fromJson = readServiceAccountFromJsonEnv();
  if (fromJson) {
    initializeApp({ credential: cert(fromJson as Parameters<typeof cert>[0]) });
    return;
  }

  // ② 3分割の環境変数（既存どおり）。
  const fromParts = readFirebaseConfigFromParts();
  if (fromParts) {
    initializeApp({ credential: cert(fromParts) });
    return;
  }

  // どちらも無いときは、Vercel の Settings → Environment Variables で Integration 由来の名前を確認してほしい旨を示す。
  throw new Error(
    "Firebase Admin の認証情報がありません。次のいずれかを Vercel（または .env.local）に設定してください: (A) FIREBASE_SERVICE_ACCOUNT_JSON にサービスアカウント JSON 全文、(B) FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY。Vercel の Firebase 連携を使った場合は、ダッシュボードに追加された変数名がこれと違うことがあるので、名前を合わせるか値をこれらにコピーしてください（チャットには貼らない）。"
  );
}

// Firestoreインスタンスを安全に取得する。
export function getAdminDb() {
  // 初期化を保証してから Firestore を返す。
  ensureAdminAppInitialized();
  // Firestoreクライアントを返す。
  return getFirestore();
}

// Admin Auth を取得する（IDトークン検証用）。
export function getAdminAuth() {
  // Firestore と同じ初期化ルートを通す。
  ensureAdminAppInitialized();
  // Auth インスタンスを返す。
  return getAuth();
}

