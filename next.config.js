/** @type {import('next').NextConfig} */
const { execSync } = require('child_process');

// Get git commit hash and timestamp for build verification
const getGitCommitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch (e) {
    return 'unknown';
  }
};

const getBuildTimestamp = () => {
  return new Date().toISOString();
};

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BUILD_ID: getGitCommitHash(),
    NEXT_PUBLIC_BUILD_TIMESTAMP: getBuildTimestamp(),
  },
};

module.exports = nextConfig;
