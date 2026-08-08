"use client";

import { useState } from "react";
import { whatsappLink, mailtoLink } from "@/lib/whatsapp";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const buildMessage = () =>
    `Hello Mahalaxmi Auto Agency,\n\nName: ${name || "-"}\nPhone: ${phone || "-"}\n\n${message || "I would like to enquire about your products."}`;

  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold text-brand-navy dark:text-white">Send Us a Message</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Fill in your details and reach us instantly on WhatsApp or Email.
      </p>
      <div className="mt-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input mt-1"
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input mt-1"
            placeholder="Enter your phone number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="input mt-1"
            placeholder="Tell us what you're looking for..."
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={whatsappLink(buildMessage())}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
          >
            Send via WhatsApp
          </a>
          <a href={mailtoLink("Enquiry from Website", buildMessage())} className="btn-secondary">
            Send via Email
          </a>
        </div>
      </div>
    </div>
  );
}
