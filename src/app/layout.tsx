import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/provider/Web3Provider";
import Header from "@/components/layout/header";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexus Upgrade",
  description:
    "Allow users to seamlessly move tokens into your dApp, no bridging, and no confusion. Connect your wallet to experience the Nexus Effect.",
  metadataBase: new URL("https://avail-nexus-demo-five.vercel.app/"),
  icons: {
    icon: [
      { url: "/favicon.svg", sizes: "16x16", type: "image/svg" },
      { url: "/favicon.svg", sizes: "32x32", type: "image/svg" },
      { url: "/favicon.svg", sizes: "96x96", type: "image/svg" },
      { url: "/favicon.svg", sizes: "any" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/headless-meta.jpg",
        width: 1200,
        height: 628,
        alt: "Nexus",
        type: "image/jpeg",
      },
      {
        url: "/headless-meta.jpg",
        width: 1080,
        height: 1080,
        alt: "Nexus upgrade",
        type: "image/jpeg",
      },
      {
        url: "/headless-meta.jpg",
        width: 1080,
        height: 1350,
        alt: "Nexus upgrade",
        type: "image/jpeg",
      },
      {
        url: "/headless-meta.jpg",
        width: 398,
        height: 208,
        alt: "Nexus upgrade",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@availproject",
    images: [
      {
        url: "/headless-meta.jpg",
        alt: "Nexus",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3Provider>
          <Header />
          {children}
          <Toaster />
        </Web3Provider>
      </body>
    </html>
  );
}
