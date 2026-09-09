/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Live preview (sandbox proxy) ko dev resources allow karo
  allowedDevOrigins: ["3900-imydanvsueti0zc2uwf1y.e2b.app", "3900-ij6lcudwx7htrkdbq0mb8.e2b.app", "*.e2b.app"],
  // Backend proxy: browser same-origin /be/* use kare; Next server sandbox/local
  // backend (port 8200) tak forward karta hai. Local + preview dono pe same path.
  async rewrites() {
    return [{ source: "/be/:path*", destination: "http://127.0.0.1:8200/:path*" }];
  },
};

module.exports = nextConfig;
