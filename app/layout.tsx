import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "괴이현상관리국 — 근무일지",
  description: "말단 직원의 회사 생활과 괴이 업무가 공존하는 TRPG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
