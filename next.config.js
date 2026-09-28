/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // The GST bill PDF reads the logo from disk; make sure it ships with that function.
    outputFileTracingIncludes: {
      "/api/billing/invoices/[id]/pdf": ["./public/images/logo.png"],
    },
  },
};

module.exports = nextConfig;
