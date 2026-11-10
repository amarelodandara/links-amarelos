/** @type {import('next').NextConfig} */
const nextConfig = {
  // Verification builds run with NEXT_DIST_DIR set to a scratch directory, so
  // they never write into (or delete) the .next that `next dev` is live on.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Workspace packages ship TypeScript source, not a build.
  transpilePackages: ["@links/brand", "@links/content"],
};

export default nextConfig;
