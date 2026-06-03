/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // football-data.org serveix escuts (crests) des d'aquests dominis
    remotePatterns: [
      { protocol: 'https', hostname: 'crests.football-data.org' },
      { protocol: 'https', hostname: '**.football-data.org' },
    ],
  },
};
module.exports = nextConfig;
