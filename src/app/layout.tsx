import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ChatbotWidget } from "@/components/chatbot/chatbot-widget";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Alkhidmat Karachi Volunteer Management",
    template: "%s | Alkhidmat Volunteer Management",
  },
  description:
    "Volunteer registration, events, QR attendance, certificates, and impact reporting for Alkhidmat Karachi.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full">
        {children}
        <ChatbotWidget />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
