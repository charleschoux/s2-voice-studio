import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Roboto_Mono, Lora } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const serif = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600"],
  display: "swap",
});

const mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "S2 Voice Studio — Fish Audio TTS Workbench",
  description:
    "Local-first professional WebUI for Fish Audio S2.1-Pro-Free TTS. Server-proxied, no API key exposed to the browser.",
  applicationName: "S2 Voice Studio",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ece7dc",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sans.variable} ${serif.variable} ${mono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
