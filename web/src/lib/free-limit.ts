import type { Firestore, Timestamp } from "firebase-admin/firestore";
import { canUseFreeOncePerDay } from "@/lib/time";

// ユーザーごとの無料枠判定結果を返す型。
type FreeUsageResult = {
  // 利用可否を返す。
  allowed: boolean;
  // 次回可能になる境界時刻（JST4時）を文字列で返す。
  nextResetJstIso: string;
};

// JSTの次回4:00時刻をISOで返すユーティリティ。
function getNextResetJstIso(now: Date): string {
  // UTCミリ秒を取得する。
  const nowMs = now.getTime();
  // JSTへ変換する。
  const jstMs = nowMs + 9 * 60 * 60 * 1000;
  // Date化する。
  const jstNow = new Date(jstMs);
  // JST基準で年を取る。
  const y = jstNow.getUTCFullYear();
  // JST基準で月を取る。
  const m = jstNow.getUTCMonth();
  // JST基準で日を取る。
  const d = jstNow.getUTCDate();
  // 当日4:00 JSTをUTC表現で作る（JST4:00 = UTC前日19:00）。
  const todayResetUtc = new Date(Date.UTC(y, m, d, 4 - 9, 0, 0, 0));
  // まだ境界前なら当日境界、超えていれば翌日境界を返す。
  const next =
    now.getTime() < todayResetUtc.getTime()
      ? todayResetUtc
      : new Date(todayResetUtc.getTime() + 24 * 60 * 60 * 1000);
  // 表示しやすいISOへ変換して返す。
  return next.toISOString();
}

// Firestoreトランザクションで無料枠を判定して必要時更新する。
export async function checkAndConsumeFreeQuota(
  db: Firestore,
  userId: string
): Promise<FreeUsageResult> {
  // 現在時刻を先に確定して判定と保存に使う。
  const now = new Date();
  // 次回リセット時刻を先に計算する。
  const nextResetJstIso = getNextResetJstIso(now);

  // トランザクションで読み書きを直列化して二重消費を防ぐ。
  const allowed = await db.runTransaction(async (tx) => {
    // ユーザードキュメント参照を作る。
    const userRef = db.collection("users").doc(userId);
    // 現在のドキュメントを読む。
    const snap = await tx.get(userRef);
    // 前回時刻を取り出す（未設定ならnull）。
    const lastUsedAt = (snap.get("last_free_used_at") as Timestamp | undefined)
      ?.toDate();
    // 1日1回条件を判定する。
    const canUse = canUseFreeOncePerDay(now, lastUsedAt ?? null);
    // 利用不可なら更新せず終了する。
    if (!canUse) return false;
    // 利用可なら最終利用時刻を更新する。
    tx.set(
      userRef,
      {
        last_free_used_at: now,
        updated_at: now,
      },
      { merge: true }
    );
    // 利用可を返す。
    return true;
  });

  // 判定結果を返す。
  return { allowed, nextResetJstIso };
}

