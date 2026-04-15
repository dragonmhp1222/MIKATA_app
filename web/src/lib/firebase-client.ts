import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";

// ブラウザ用 Firebase 設定を環境変数から読む（NEXT_PUBLIC_* はビルド時に埋め込まれる）。
function readWebConfig() {
  // Web API キーを読む。
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  // Auth 用ドメインを読む。
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  // プロジェクトIDを読む。
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  // アプリIDを読む。
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  // 必須4項目が揃っているか確認する。
  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error(
      "Firebase クライアント用の NEXT_PUBLIC_FIREBASE_* が1つでも空です。ローカル: web/.env.local に4項目を入れ、npm run dev を止めて再起動。本番(Vercel): Project → Settings → Environment Variables に NEXT_PUBLIC_FIREBASE_API_KEY / AUTH_DOMAIN / PROJECT_ID / APP_ID を Production 向けで設定し、保存後に Redeploy（.env.local は本番ビルドでは使われません）。"
    );
  }
  // Firebase JS SDK 向け設定オブジェクトを返す。
  return { apiKey, authDomain, projectId, appId };
}

// シングルトンの App を保持する（再初期化を防ぐ）。
let app: FirebaseApp | undefined;
// Firestore も1つにまとめる（同意記録・無料枠等で使う）。
let firestore: Firestore | undefined;

// Firebase App を1つだけ初期化して返す。
export function getFirebaseApp(): FirebaseApp {
  // SSR では呼ばない想定だが、誤用時は明示的に落とす。
  if (typeof window === "undefined") {
    throw new Error("getFirebaseApp must run in the browser.");
  }
  // 既に初期化済みなら再利用する。
  if (app) return app;
  // 既に getApps にある場合はそれを使う。
  if (getApps().length > 0) {
    app = getApp();
    return app;
  }
  // 新規に初期化する。
  app = initializeApp(readWebConfig());
  return app;
}

// Auth インスタンスを返す（Google ログイン等で使う）。
export function getFirebaseAuth(): Auth {
  // App を取得して Auth を紐づける。
  return getAuth(getFirebaseApp());
}

// Firestore を返す（利用規約同意の記録などクライアント書き込み用）。
export function getFirebaseFirestore(): Firestore {
  if (typeof window === "undefined") {
    throw new Error("getFirebaseFirestore must run in the browser.");
  }
  if (!firestore) {
    firestore = getFirestore(getFirebaseApp());
  }
  return firestore;
}
