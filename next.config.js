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
            source: "*",
            headers:  [
                { key: "Access-Control-Allow-Credentials", value: "true" },
                { key: "Access-Control-Allow-Origin", value: "https://cph-redirect.onrender.com" }, // replace this your actual origin
                { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
                { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
            ]
        }
       ]
    },
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack}) => {
        config.resolve.alias.canvas = false
        config.resolve.alias.encoding = false
        return config
    }
}

module.exports = nextConfig
