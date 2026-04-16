"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

type Props = {
  eventName?: string;
  pageName: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
};

// 画面表示イベントを明示的に送る。capture_pageview を false にしているので手動送信する。
export function PostHogPageView({
  eventName = "page_view_custom",
  pageName,
  properties,
}: Props) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    posthog.capture(eventName, {
      page_name: pageName,
      path: window.location.pathname,
      ...properties,
    });
  }, [eventName, pageName, properties]);

  return null;
}
