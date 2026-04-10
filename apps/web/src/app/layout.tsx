import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ToastViewport } from "@/components/ui/ToastViewport";
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
  title: "VisoHelp",
  description: "Service Desk e Inventario de TI",
};

const themeInitScript = `
(function(){
  try {
    var s = localStorage.getItem('visohelp-theme');
    if (s === 'dark') document.documentElement.classList.add('dark');
    else if (s === 'light') document.documentElement.classList.remove('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Script id="visohelp-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {children}
        <ToastViewport />
      </body>
    </html>
  );
}
