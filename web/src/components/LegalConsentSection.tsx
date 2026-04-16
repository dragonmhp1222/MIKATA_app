"use client";

import type { User } from "firebase/auth";
import {
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getFirebaseFirestore } from "@/lib/firebase-client";

type Props = {
  user: User | null;
  authBlocked: boolean;
  onGateChange: (canGenerate: boolean) => void;
};

// ログイン後に表示する「規約リンク確認＋チェックボックス同意」ブロック（Firestore に証跡を残す）。
export function LegalConsentSection({
  user,
  authBlocked,
  onGateChange,
}: Props) {
  const [privacyOpened, setPrivacyOpened] = useState(false);
  const [termsOpened, setTermsOpened] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [localError, setLocalError] = useState("");
  const [legalModal, setLegalModal] = useState<null | "privacy" | "terms">(
    null
  );

  const refreshFromServer = useCallback(
    async (uid: string) => {
      setSyncing(true);
      setLocalError("");
      try {
        const db = getFirebaseFirestore();
        const snap = await getDoc(doc(db, "users", uid));
        const d = snap.data();
        setPrivacyOpened(d?.legal_privacy_doc_opened_at != null);
        setTermsOpened(d?.legal_terms_doc_opened_at != null);
        setConsentChecked(d?.legal_consent_at != null);
      } catch (e) {
        setLocalError(
          e instanceof Error ? e.message : "同意情報の取得に失敗しました。"
        );
        onGateChange(false);
      } finally {
        setSyncing(false);
      }
    },
    [onGateChange]
  );

  useEffect(() => {
    if (!user || authBlocked) {
      setPrivacyOpened(false);
      setTermsOpened(false);
      setConsentChecked(false);
      onGateChange(false);
      return;
    }
    void refreshFromServer(user.uid);
  }, [user, authBlocked, onGateChange, refreshFromServer]);

  useEffect(() => {
    if (!user || authBlocked) {
      onGateChange(false);
      return;
    }
    onGateChange(privacyOpened && termsOpened && consentChecked);
  }, [
    user,
    authBlocked,
    privacyOpened,
    termsOpened,
    consentChecked,
    onGateChange,
  ]);

  const recordDocOpened = async (which: "privacy" | "terms") => {
    if (!user) return;
    setLocalError("");
    try {
      const db = getFirebaseFirestore();
      const field =
        which === "privacy"
          ? "legal_privacy_doc_opened_at"
          : "legal_terms_doc_opened_at";
      await setDoc(
        doc(db, "users", user.uid),
        { [field]: serverTimestamp() },
        { merge: true }
      );
      if (which === "privacy") setPrivacyOpened(true);
      else setTermsOpened(true);
    } catch (e) {
      setLocalError(
        e instanceof Error ? e.message : "規約閲覧の記録に失敗しました。"
      );
    }
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (legalModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [legalModal]);

  useEffect(() => {
    if (!legalModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLegalModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [legalModal]);

  const handleConsentChange = async (checked: boolean) => {
    if (!user) return;
    if (!privacyOpened || !termsOpened) {
      setLocalError(
        "先にプライバシーポリシーと利用規約をそれぞれ表示してください。"
      );
      return;
    }
    setLocalError("");
    try {
      const db = getFirebaseFirestore();
      if (checked) {
        await setDoc(
          doc(db, "users", user.uid),
          { legal_consent_at: serverTimestamp() },
          { merge: true }
        );
      } else {
        await setDoc(
          doc(db, "users", user.uid),
          { legal_consent_at: deleteField() },
          { merge: true }
        );
      }
      setConsentChecked(checked);
    } catch (e) {
      setLocalError(
        e instanceof Error ? e.message : "同意の保存に失敗しました。"
      );
    }
  };

  if (!user || authBlocked) return null;

  const linksDone = privacyOpened && termsOpened;
  const showConfirmHint = !linksDone;

  const openLegalModal = (which: "privacy" | "terms") => {
    setLegalModal(which);
    void recordDocOpened(which);
  };

  const legalModalUi =
    legalModal && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50 dark:bg-black/70"
              aria-label="閉じる"
              onClick={() => setLegalModal(null)}
            />
            <div className="relative z-10 flex h-[min(88vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <h2
                  id="legal-modal-title"
                  className="text-sm font-semibold text-slate-900 dark:text-slate-100"
                >
                  {legalModal === "privacy"
                    ? "プライバシーポリシー"
                    : "利用規約"}
                </h2>
                <button
                  type="button"
                  onClick={() => setLegalModal(null)}
                  className="cursor-pointer select-none rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-800 shadow-sm transition-all duration-150 hover:bg-slate-100 active:translate-y-px active:shadow-inner dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  閉じる
                </button>
              </div>
              <iframe
                title={
                  legalModal === "privacy"
                    ? "プライバシーポリシー全文"
                    : "利用規約全文"
                }
                src={
                  legalModal === "privacy" ? "/legal/privacy" : "/legal/terms"
                }
                className="min-h-0 w-full flex-1 border-0 bg-slate-50 dark:bg-slate-950"
              />
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-4 dark:border-slate-700/90 dark:bg-slate-950/50">
      {legalModalUi}
      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
        利用規約・プライバシーポリシーへの同意
      </p>
      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
        生成の前に、各文書を表示して内容を確認し、同意にチェックを入れてください。
      </p>

      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => openLegalModal("privacy")}
          className={`cursor-pointer select-none rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.98] active:shadow-inner ${
            privacyOpened
              ? "border-emerald-700/80 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "border-slate-300 text-slate-800 hover:border-cyan-500 hover:text-cyan-800 dark:border-slate-600 dark:text-slate-200 dark:hover:border-cyan-600/60 dark:hover:text-cyan-100"
          }`}
        >
          プライバシーポリシーを表示
          {privacyOpened ? "（確認済）" : ""}
        </button>
        <button
          type="button"
          onClick={() => openLegalModal("terms")}
          className={`cursor-pointer select-none rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.98] active:shadow-inner ${
            termsOpened
              ? "border-emerald-700/80 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "border-slate-300 text-slate-800 hover:border-cyan-500 hover:text-cyan-800 dark:border-slate-600 dark:text-slate-200 dark:hover:border-cyan-600/60 dark:hover:text-cyan-100"
          }`}
        >
          利用規約を表示
          {termsOpened ? "（確認済）" : ""}
        </button>
      </div>

      {showConfirmHint ? (
        <p className="mt-3 text-xs text-amber-800 dark:text-amber-200/95" role="status">
          規約を確認してください。上の2つを表示すると、確認済みの表示になります。
        </p>
      ) : null}

      <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          checked={consentChecked}
          disabled={!linksDone || syncing}
          onChange={(e) => void handleConsentChange(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-400 bg-white text-cyan-600 focus:ring-cyan-500/40 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-950 dark:text-cyan-500"
        />
        <span>
          <span className="text-slate-900 dark:text-slate-200">
            プライバシーポリシーおよび利用規約の内容を確認し、これに同意します。
          </span>
        </span>
      </label>

      {syncing ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
          同意状態を読み込み中…
        </p>
      ) : null}
      {localError ? (
        <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">{localError}</p>
      ) : null}
    </div>
  );
}
