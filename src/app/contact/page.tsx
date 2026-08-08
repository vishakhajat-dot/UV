import type { Metadata } from "next";
import { SITE, telLink, whatsappLink } from "@/lib/whatsapp";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us | Mahalaxmi Auto Agency",
  description: "Get in touch with Mahalaxmi Auto Agency, Pune - call, WhatsApp or email us directly.",
};

export default function ContactPage() {
  const mapQuery = encodeURIComponent(SITE.address);

  return (
    <div className="container-page py-14">
      <div className="text-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-brand-red">Get In Touch</span>
        <h1 className="mt-2 text-3xl font-extrabold text-brand-navy sm:text-4xl dark:text-white">Contact Us</h1>
        <p className="mx-auto mt-2 max-w-xl text-gray-600 dark:text-gray-400">
          Reach out for product enquiries, bulk/dealer pricing, or order support &mdash; we typically
          reply fastest on WhatsApp.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="card flex items-start gap-4 p-5">
            <IconWrap>
              <PhoneIcon />
            </IconWrap>
            <div>
              <h3 className="font-semibold text-brand-navy dark:text-white">Call Us</h3>
              <a href={telLink(SITE.phonePrimary)} className="block text-sm text-gray-600 hover:text-brand-red dark:text-gray-400">
                {SITE.phonePrimary}
              </a>
              <a href={telLink(SITE.phoneSecondary)} className="block text-sm text-gray-600 hover:text-brand-red dark:text-gray-400">
                {SITE.phoneSecondary}
              </a>
            </div>
          </div>

          <div className="card flex items-start gap-4 p-5">
            <IconWrap>
              <MailIcon />
            </IconWrap>
            <div>
              <h3 className="font-semibold text-brand-navy dark:text-white">Email Us</h3>
              <a href={`mailto:${SITE.email}`} className="block text-sm text-gray-600 hover:text-brand-red dark:text-gray-400">
                {SITE.email}
              </a>
            </div>
          </div>

          <div className="card flex items-start gap-4 p-5">
            <IconWrap>
              <PinIcon />
            </IconWrap>
            <div>
              <h3 className="font-semibold text-brand-navy dark:text-white">Visit Us</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{SITE.address}</p>
            </div>
          </div>

          <a
            href={whatsappLink("Hello Mahalaxmi Auto Agency, I would like to enquire about your products.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp w-full"
          >
            Chat with Us on WhatsApp
          </a>

          <div className="card overflow-hidden">
            <iframe
              title="Mahalaxmi Auto Agency Location"
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              width="100%"
              height="260"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}

function IconWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand-navy dark:bg-gray-800 dark:text-brand-gold">
      {children}
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.79.64 2.65a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.43-1.27a2 2 0 0 1 2.11-.45c.86.3 1.75.52 2.65.64A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
