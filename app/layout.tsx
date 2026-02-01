import type { Metadata } from "next";
import { Inter, Noto_Sans_JP, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSansKR = Noto_Sans_KR({ subsets: ["latin"], variable: "--font-noto-kr", weight: ["400", "700"] });
const notoSansJP = Noto_Sans_JP({ subsets: ["latin"], variable: "--font-noto-jp", weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "서로말 - 한일 언어교환 플랫폼",
  description: "서로 말하고, 서로 배우다. 익명 음성/화상 기반 한일 언어교환 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} ${notoSansKR.variable} ${notoSansJP.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
