/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Preview host allowlist (e2b sandbox proxy ke liye) — exact host + wildcard
  allowedDevOrigins: ["3900-imydanvsueti0zc2uwf1y.e2b.app", "*.e2b.app"],
  // Backend proxy — browser same-origin /backend use karta hai,
  // dev server ise sandbox ke andar localhost:8200 par forward karta hai.
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: "http://127.0.0.1:8200/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
