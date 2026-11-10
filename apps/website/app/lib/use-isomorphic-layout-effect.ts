import { useEffect, useLayoutEffect } from "react";

// useLayoutEffect has no server equivalent and React warns when it is called
// during SSR, so it falls back to useEffect there. Reading `globalThis.window`
// is safe on both sides — unlike a bare `window`, which throws — so the
// environment check needs no typeof guard.
const isBrowser = globalThis.window !== undefined;

const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
