// LP 閲覧からの流入ラベルをセッション内で引き継ぐ（/app 直叩きでも計測を揃える）。
export const LP_VARIANT_SESSION_KEY = "mikata_lp_variant";

export type LpVariantSource = "url" | "session" | "default";

export function readStoredLpVariant(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(LP_VARIANT_SESSION_KEY);
    const t = v?.trim().toLowerCase();
    return t || null;
  } catch {
    return null;
  }
}

export function writeStoredLpVariant(variant: string): void {
  if (typeof window === "undefined") return;
  try {
    const t = variant.trim().toLowerCase();
    if (t) sessionStorage.setItem(LP_VARIANT_SESSION_KEY, t);
  } catch {
    // ストレージ不可時は無視
  }
}
