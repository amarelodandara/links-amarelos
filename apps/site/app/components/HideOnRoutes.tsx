"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

type HideOnRoutesProps = {
  routes: readonly string[];
  children: ReactNode;
};

// Hides chrome on specific routes. Uses usePathname rather than headers() so
// pages stay statically prerendered — reading headers in the layout would opt
// every route into dynamic rendering.
export default function HideOnRoutes({ routes, children }: HideOnRoutesProps) {
  const pathname = usePathname();
  return routes.includes(pathname) ? null : children;
}
