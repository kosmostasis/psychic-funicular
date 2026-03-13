/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@swarm-cdp/core", "@swarm-cdp/simulator-data"],
  /**
   * Dev-only, opt-in: set CDP_DEV_POLL=1 before next dev to force webpack
   * polling + ignored dirs (helps EMFILE when native watchers exhaust fds).
   */
  webpack: (config, { dev }) => {
    if (dev && process.env.CDP_DEV_POLL === "1") {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
        ],
      };
    }
    return config;
  },
};

module.exports = nextConfig;
