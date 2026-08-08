import Link from "next/link";
import { SITE, whatsappLink, telLink } from "@/lib/whatsapp";

const BRANDS = ["Radhe Bulbs", "Vasko Bulbs", "KSV Bulbs", "Canon Wiring", "Sunny Switches"];

export default function Footer() {
  return (
    <footer className="mt-16 bg-brand-navy text-gray-300">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div>
          <h3 className="text-lg font-bold text-white">{SITE.name}</h3>
          <p className="mt-3 text-sm leading-relaxed text-gray-400">
            Trusted auto parts &amp; accessories supplier in Pune since 1996, serving workshops,
            retailers and spare parts dealers with quality electrical components and accessories.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-brand-gold">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/products" className="hover:text-white">Products</Link></li>
            <li><Link href="/about" className="hover:text-white">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/cart" className="hover:text-white">Cart &amp; Checkout</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-brand-gold">Authorized Brands</h4>
          <ul className="mt-3 space-y-2 text-sm">
            {BRANDS.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-brand-gold">Contact Us</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-400">
            <li>{SITE.address}</li>
            <li>
              <a href={telLink(SITE.phonePrimary)} className="hover:text-white">{SITE.phonePrimary}</a>
              {" / "}
              <a href={telLink(SITE.phoneSecondary)} className="hover:text-white">{SITE.phoneSecondary}</a>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`} className="hover:text-white">{SITE.email}</a>
            </li>
            <li>
              <a
                href={whatsappLink("Hello Mahalaxmi Auto Agency, I would like to enquire about your products.")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-2 rounded-md bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1ebe5b]"
              >
                Chat on WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
      </div>
    </footer>
  );
}
