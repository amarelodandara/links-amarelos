"use client";

import { usePathname } from "next/navigation";

// Hides chrome on specific routes. Uses usePathname rather than headers() so
// pages stay statically prerendered — reading headers in the layout would opt
// every route into dynamic rendering.
export default function HideOnRoutes({ routes, children }) {
  const pathname = usePathname();
  return routes.includes(pathname) ? null : children;
}
