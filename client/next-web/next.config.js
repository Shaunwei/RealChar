/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/join-discord',
        destination: 'https://discord.gg/e4AYNnFg2F',
        permanent: false,
      },
      {
        source: '/feedback',
        destination: 'https://github.com/ReByteAI/bug-tracker',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
