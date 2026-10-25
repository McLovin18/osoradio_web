import "./globals.css";

import Footer from "./components/Footer";
import { cookies } from "next/headers";
import Navbar from "./components/Navbar";
import { UserProvider } from "./context/UserContext";
import { OnboardingProvider } from "./context/OnboardingContext";
import { ToastProvider } from "./context/ToastContext";
import LayoutContentClient from "./components/LayoutContentClient";
import { StructuredData } from "./components/StructuredData";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

// ISR Global
export const revalidate = 1800;

// Cambiar cuando tengas el dominio
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://radiooso.ec";

const SITE_NAME = "Radio Oso - 98.5 FM";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

// Aplica el theme ANTES del primer render (evita flash). Si no hay
// preferencia guardada, arranca en dark (identidad de la marca).
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var isDark = stored ? stored === 'dark' : true;
    var root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    root.style.colorScheme = isDark ? 'dark' : 'light';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#0B0D12' : '#FFFFFF');
  } catch (e) {}
})();
`;

export const metadata: Metadata = {
  title: {
    default: "Radio Oso - 98.5 FM Ecuador | La mejor música en tu sintonía",
    template: "%s | Radio Oso",
  },

  description:
    "Radio Oso - Emisora de radio en Ecuador transmitiendo en 98.5 FM. Programas en vivo, la mejor música 24/7 y contenido de entretenimiento.",

  keywords: [
    "Radio Oso",
    "98.5 FM Ecuador",
    "Radio Ecuador",
    "Emisora de radio",
    "Programas en vivo",
    "Música en vivo",
    "Locutores",
    "Noticias Ecuador",
  ],

  creator: SITE_NAME,

  publisher: SITE_NAME,

  metadataBase: new URL(SITE_URL),

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },

  manifest: "/site.webmanifest",

  openGraph: {
    type: "website",
    locale: "es_EC",
    url: SITE_URL,
    siteName: SITE_NAME,

    title: "Radio Oso - 98.5 FM Ecuador | La mejor música en tu sintonía",

    description:
      "Radio Oso - Emisora de radio en Ecuador transmitiendo en 98.5 FM. Programas en vivo, la mejor música 24/7 y contenido de entretenimiento.",

    images: [
      {
        url: `${SITE_URL}/img-1.jpeg`,
        width: 1200,
        height: 630,
        alt: "Radio Oso - 98.5 FM",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "Radio Oso - 98.5 FM Ecuador | La mejor música en tu sintonía",

    description:
      "Radio Oso - Emisora de radio en Ecuador transmitiendo en 98.5 FM. Programas en vivo, la mejor música 24/7 y contenido de entretenimiento.",

    images: [`${SITE_URL}/twitter-image.jpg`],
  },

  alternates: {
    canonical: SITE_URL,
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  verification: {
    google: "", // colocar Search Console cuando el dominio exista
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },

  category: "Emisora de radio",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0D12" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} dark`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        {/* Theme init: debe ir primero para evitar flash */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />

        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XXXXXXXXXX');
            `,
          }}
        />

        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
          rel="stylesheet"
        />

        <StructuredData />
      </head>

      <body className="relative min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        <ToastProvider>
          <OnboardingProvider>
            <LayoutContentClient>
              {children}
            </LayoutContentClient>
          </OnboardingProvider>
        </ToastProvider>
      </body>
    </html>
  );
}