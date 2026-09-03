// Module declarations for static image imports (app/page.tsx imports the
// portrait and Penrose photos). `next build` writes the same reference into
// next-env.d.ts, but that file is generated and git-ignored, so the type-check
// step in CI — which runs before the build — needs it from here.
/// <reference types="next/image-types/global" />
