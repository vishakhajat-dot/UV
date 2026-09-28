import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloatButton from "@/components/WhatsAppFloatButton";
import PublicOnly from "@/components/PublicOnly";

export const metadata: Metadata = {
  title: "Mahalaxmi Auto Agency | Auto Parts & Accessories Supplier in Pune",
  description:
    "Mahalaxmi Auto Agency - Trusted auto parts & accessories supplier in Pune since 1996. Authorized distributor of Radhe Bulbs, Vasko Bulbs, KSV Bulbs, Canon Wiring and Sunny Switches.",
  icons: { icon: "/images/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-white font-sans text-brand-navy antialiased">
        <CartProvider>
          <PublicOnly>
            <Header />
          </PublicOnly>
          <main className="flex-1">{children}</main>
          <PublicOnly>
            <Footer />
            <WhatsAppFloatButton />
          </PublicOnly>
        </CartProvider>
      </body>
    </html>
  );
}
