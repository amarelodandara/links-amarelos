/** @type {import('next').NextConfig} */
const nextConfig = {
  // Verification builds run with NEXT_DIST_DIR set to a scratch directory, so
  // they never write into (or delete) the .next that `next dev` is live on.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
