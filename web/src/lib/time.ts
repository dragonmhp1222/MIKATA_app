// JST(+9h)と4時リセットをミリ秒で定義する。
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const RESET_HOUR_OFFSET_MS = 4 * 60 * 60 * 1000;

// JST 04:00始まりの論理日キーを返す。
export function getJstBusinessDayKey(date: Date): string {
  // UTC時刻を取得する。
  const utcMs = date.getTime();
  // JSTに寄せる。
  const jstMs = utcMs + JST_OFFSET_MS;
  // 4時間戻して「04:00開始」を「00:00開始」に正規化する。
  const shiftedMs = jstMs - RESET_HOUR_OFFSET_MS;
  // UTC系getterを使って環境依存のズレを避ける。
  const shifted = new Date(shiftedMs);
  // 年を取り出す。
  const year = shifted.getUTCFullYear();
  // 月を2桁で取り出す。
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  // 日を2桁で取り出す。
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  // 比較しやすい日付キーとして返す。
  return `${year}-${month}-${day}`;
}

// 前回利用時刻と比較して無料枠が使えるか判定する。
export function canUseFreeOncePerDay(
  now: Date,
  lastFreeUsedAt?: Date | null
): boolean {
  // 初回利用なら無条件で許可する。
  if (!lastFreeUsedAt) return true;
  // 論理日キーが違うときのみ許可する。
  return getJstBusinessDayKey(now) !== getJstBusinessDayKey(lastFreeUsedAt);
}

