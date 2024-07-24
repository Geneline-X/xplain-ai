/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects(){
       return [
        {
            source: "/sign-in",
            destination: "/api/auth/login",
            permanent: true
        },
        {
            source: "/sign-up",
            destination: "/api/auth/register",
            permanent: true
        },
        {
            source: "/sign-out",
            destination: "/api/auth/logout",
            permanent: true
        }
       ]
    },
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack}) => {
        config.resolve.alias.canvas = false
        config.resolve.alias.encoding = false
        return config
    },
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'uploadthing-prod.s3.us-west-2.amazonaws.com',
            port: '',
            pathname: '/*',
          },
          {
            protocol: 'https',
            hostname: 'utfs.io',
            port: '',
            pathname: '/*',
          },
        ],
      },
}


module.exports = nextConfig
