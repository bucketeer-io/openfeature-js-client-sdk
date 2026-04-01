import { BucketeerReactNativeProvider } from './internal/react_native/BucketeerReactNativeProvider'
import { defineBKTConfigForReactNative } from './internal/react_native/defineBKTConfigForReactNative'

export { BucketeerReactNativeProvider }
export { defineBKTConfigForReactNative }
export { SDK_VERSION } from './version'

// Re-exporting the entire public API of @bucketeer/js-client-sdk is intentional.
// This package is an OpenFeature adapter/wrapper — consumers should be able to import
// everything (BKTClient, initialize, BKTConfig, etc.) from a single entry point
// without having to install and import the underlying SDK separately.
// This follows the standard adapter pattern used across the OpenFeature ecosystem.
// See: https://openfeature.dev/docs/reference/concepts/provider
export * from '@bucketeer/js-client-sdk'
