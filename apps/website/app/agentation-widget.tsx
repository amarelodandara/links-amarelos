'use client';

export default function AgentationWidget() {
  if (process.env.NODE_ENV !== 'development') return null;

  // Lazy require rather than a static import: it keeps the dev-only toolbar
  // out of the production bundle. The type-only `import()` annotation costs
  // nothing at runtime and replaces the `any` a bare require would hand back.
  const { Agentation }: typeof import('agentation') = require('agentation');
  return <Agentation endpoint="http://localhost:4747" />;
}
