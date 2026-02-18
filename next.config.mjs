/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {},
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      'framer-motion',
      '@radix-ui/react-icons',
    ],
  },
}

export default nextConfig
