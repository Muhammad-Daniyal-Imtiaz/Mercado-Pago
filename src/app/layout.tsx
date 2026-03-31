import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Pay-Alert - Notificaciones Verificadas de Mercado Pago",
  description: "Recibe notificaciones verificadas y en tiempo real de cada pago que ingresa a tu cuenta de Mercado Pago. Elimina comprobantes falsos y protege tu negocio.",
  keywords: "mercado pago, notificaciones pagos, verificar pagos, comprobantes falsos, alertas mercado pago, seguridad pagos, negocios argentinos",
  authors: [{ name: "Pay-Alert Team" }],
  creator: "Pay-Alert",
  publisher: "Pay-Alert Argentina",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://pay-alert.com.ar'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://pay-alert.com.ar',
    title: 'Pay-Alert - Notificaciones Verificadas de Mercado Pago',
    description: 'Recibe notificaciones verificadas y en tiempo real de cada pago que ingresa a tu cuenta de Mercado Pago. Ideal para negocios argentinos.',
    siteName: 'Pay-Alert',
    images: [
      {
        url: '/assets/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pay-Alert - Notificaciones Verificadas de Mercado Pago',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pay-Alert - Notificaciones Verificadas de Mercado Pago',
    description: 'Recibe notificaciones verificadas y en tiempo real de cada pago que ingresa a tu cuenta de Mercado Pago. Protege tu negocio de comprobantes falsos.',
    images: ['/assets/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/assets/icon-192x192.png',
    shortcut: '/assets/icon-192x192.png',
    apple: '/assets/icon-192x192.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Pay-Alert',
    statusBarStyle: 'default',
  },
  other: {
    'msapplication-TileColor': '#3B82F6',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#3B82F6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pay-Alert" />
        <meta name="application-name" content="Pay-Alert" />
        <meta name="msapplication-TileColor" content="#3B82F6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/assets/icon-16x16.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
