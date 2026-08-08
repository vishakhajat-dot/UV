export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Mahalaxmi Auto Agency",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919209351647",
  phonePrimary: process.env.NEXT_PUBLIC_PHONE_PRIMARY || "9209351647",
  phoneSecondary: process.env.NEXT_PUBLIC_PHONE_SECONDARY || "9890984778",
  email: process.env.NEXT_PUBLIC_EMAIL || "utkarshchavan1999@gmail.com",
  address:
    process.env.NEXT_PUBLIC_ADDRESS ||
    "25 Guruwar Peth, Shitladevi Chowk, Pune - 411042, Maharashtra, India",
};

export function whatsappLink(message: string, number: string = SITE.whatsapp) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encoded}`;
}

export function mailtoLink(subject: string, body: string, to: string = SITE.email) {
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function telLink(number: string) {
  return `tel:+91${number.replace(/\D/g, "").slice(-10)}`;
}
