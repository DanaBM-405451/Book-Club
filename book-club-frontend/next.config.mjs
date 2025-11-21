/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
webpack: (config, { isServer }) => {
    // Configuración para PDF.js
    if (!isServer) {
      config.resolve.alias.canvas = false;
      config.resolve.alias.encoding = false;
    }
    
    return config;
  }

};

export default nextConfig;
