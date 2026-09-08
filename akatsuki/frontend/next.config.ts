import type { NextConfig } from "next";

// Auto-detects repo name during GitHub Actions so basePath is only applied
// there — leave this as-is unless you're deploying to a custom domain or a
// user/org page (e.g. yourname.github.io repo itself), in which case set
// basePath and assetPrefix to "" below.
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isGithubActions = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",              // static export — required for GitHub Pages
  images: { unoptimized: true }, // next/image has no server to optimize on Pages
  basePath: isGithubActions ? `/${repoName}` : "",
  assetPrefix: isGithubActions ? `/${repoName}/` : "",
};

export default nextConfig;
