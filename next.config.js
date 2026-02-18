/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com'
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos'
      },
      {
        protocol: 'https',
        hostname: 'uploadthing.com'
      },
      {
        protocol: 'https',
        hostname: 'utfs.io'
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com'
      },
      {
        protocol: 'https',
        hostname: 'files.stripe.com'
      }
    ]
  },
  serverExternalPackages: ['@prisma/client']
}

module.exports = nextConfig