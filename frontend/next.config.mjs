import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const stellarSdkLib = path.resolve(
  __dirname,
  "node_modules/@stellar/stellar-sdk/lib/index.js",
);
const stellarSdkRpcLib = path.resolve(
  __dirname,
  "node_modules/@stellar/stellar-sdk/lib/rpc/index.js",
);
const stellarBaseLib = path.resolve(
  __dirname,
  "node_modules/@stellar/stellar-base/lib/index.js",
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@stellar/stellar-sdk$": stellarSdkLib,
      "@stellar/stellar-sdk/rpc$": stellarSdkRpcLib,
      "@stellar/stellar-base$": stellarBaseLib,
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
