import Link from "next/link";
import { ReactNode } from "react";

export function ButtonLink({
  href,
  children,
  tone = "primary"
}: {
  href: string;
  children: ReactNode;
  tone?: "primary" | "secondary";
}) {
  const className =
    tone === "primary"
      ? "bg-ink text-white hover:bg-avocado-800"
      : "border border-avocado-900/15 bg-white text-ink hover:bg-avocado-50";

  return (
    <Link
      href={href}
      className={`focus-ring inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-black shadow-soft transition hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </Link>
  );
}
