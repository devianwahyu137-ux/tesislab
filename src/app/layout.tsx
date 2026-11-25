import type { Metadata, Viewport } from "next";
import {
  JetBrains_Mono,
  Newsreader,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";
import { CommandPalette } from "@/components/navigation/CommandPalette";
import { ThemedToaster } from "@/components/providers/ThemedToaster";
import { AuditUIProvider } from "@/context/AuditUIContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import idDict from "../../locales/id.json";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-editorial",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: idDict.meta.title,
  description: idDict.meta.description,
  openGraph: {
    title: idDict.meta.title,
    description: idDict.meta.description,
    type: "website",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: idDict.meta.title,
    description: idDict.meta.description,
    images: ["/api/og"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#060B11",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${newsreader.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('tesislab_theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-obsidian text-text-primary font-sans">
        <ThemeProvider>
          <LanguageProvider>
            <AuditUIProvider>
              {children}
              <CommandPalette />
              <ThemedToaster />
            </AuditUIProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
