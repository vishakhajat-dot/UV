import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloatButton from "@/components/WhatsAppFloatButton";

export const metadata: Metadata = {
  title: "Mahalaxmi Auto Agency | Auto Parts & Accessories Supplier in Pune",
  description:
    "Mahalaxmi Auto Agency - Trusted auto parts & accessories supplier in Pune since 1996. Authorized distributor of Radhe Bulbs, Vasko Bulbs, KSV Bulbs, Canon Wiring and Sunny Switches.",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("mla_theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = stored ? stored === "dark" : prefersDark;
    if (isDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col bg-white font-sans text-brand-navy antialiased dark:bg-gray-950 dark:text-gray-100">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppFloatButton />
        </CartProvider>
      </body>
    </html>
  );
}
