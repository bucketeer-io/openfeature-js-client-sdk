import BucketeerProvider from './internal/BucketeerProvider'
import { BucketeerReactProvider } from './internal/react/BucketeerReactProvider'
// BucketeerReactNativeProvider and defineBKTConfigForReactNative are intentionally exported
// from the browser entry to support React Native Web consumers. When using React Native Web,
// the app is bundled for the browser environment, so the browser/default export condition is
// resolved — not the `react-native` condition. Without these exports here, React Native Web
// consumers would not be able to use BucketeerReactNativeProvider from this package.
//
// SAFETY — optional peer deps are not statically imported:
// The RN-specific optional packages (`react-native-uuid` and
// `@react-native-async-storage/async-storage`) are  **never** referenced by a top-level
// static `import` statement anywhere in this module graph. They are only loaded via
// dynamic `import()` inside async try/catch blocks in:
//   - src/internal/react_native/IdGeneratorFactory.ts
//   - src/internal/react_native/AsyncStorageFactory.ts
//
// This means:
//   1. Bundlers (Rollup, Vite, webpack, esbuild) do NOT require those packages to be
//      installed at build time — dynamic imports are treated as optional async chunks.
//   2. At runtime in a web context the dynamic imports simply fail silently (caught).
//   3. Both packages are declared as `optional: true` in peerDependenciesMeta, which
//      is the npm-standard signal that they may be absent.
//
// Therefore, pure web consumers can build and run without these packages installed.
import { BucketeerReactNativeProvider } from './internal/react_native/BucketeerReactNativeProvider'
import { defineBKTConfigForReactNative } from './internal/react_native/defineBKTConfigForReactNative'

export {
  BucketeerProvider,
  BucketeerReactProvider,
  BucketeerReactNativeProvider,
  defineBKTConfigForReactNative,
}
export { SDK_VERSION } from './version'

// Re-exporting the entire public API of @bucketeer/js-client-sdk is intentional.
// This package is an OpenFeature adapter/wrapper — consumers should be able to import
// everything (BKTClient, initialize, BKTConfig, etc.) from a single entry point
// without having to install and import the underlying SDK separately.
// This follows the standard adapter pattern used across the OpenFeature ecosystem.
// See: https://openfeature.dev/docs/reference/concepts/provider
export * from '@bucketeer/js-client-sdk'