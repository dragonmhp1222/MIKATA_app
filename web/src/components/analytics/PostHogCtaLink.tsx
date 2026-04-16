"use client";

import Link from "next/link";
import posthog from "posthog-js";

type Props = {
  href: string;
  eventName: string;
  className: string;
  children: React.ReactNode;
  properties?: Record<string, string | number | boolean | null | undefined>;
};

// LP の CTA 計測用リンク。遷移前に capture を打つだけの薄い部品にして再利用する。
export function PostHogCtaLink({
  href,
  eventName,
  className,
  children,
  properties,
}: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
        posthog.capture(eventName, properties ?? {});
      }}
    >
      {children}
    </Link>
  );
}
