/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone só no Docker (NEXT_OUTPUT=standalone). No Windows local o standalone
  // tenta criar symlinks e falha (EPERM) — por isso fica atrás da env.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
};

export default nextConfig;
