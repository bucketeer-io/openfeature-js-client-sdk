import { defineBKTConfig, RawBKTConfig, BKTConfig } from '@bucketeer/js-client-sdk'

// IdGenerator is an internal type in @bucketeer/js-client-sdk and is not part of its public API.
// We derive it here for internal use only — this type is never exposed to users of this package.
type IdGenerator = NonNullable<RawBKTConfig['idGenerator']>

/**
 * A placeholder IdGenerator injected by defineBKTConfigForReactNative.
 *
 * WHY THIS EXISTS:
 * The native SDK's defineBKTConfig (from main.native.ts) enforces that idGenerator
 * is present via a runtime guard — because the native SDK requires it when calling
 * initializeBKTClient directly.
 *
 * In the OpenFeature adapter, however, the real idGenerator (react-native-uuid) must be
 * loaded via an async dynamic import inside BucketeerReactNativeProvider.initialize().
 * This is necessary because react-native-uuid may not be installed, and we need a safe,
 * non-crashing import path to detect its absence and throw a ProviderFatalError instead.
 *
 * LIFECYCLE:
 *   1. defineBKTConfigForReactNative()             → injects this placeholder to pass the guard
 *   2. BucketeerReactNativeProvider.initialize()   → loads the real generator and replaces it
 *   3. initializeBKTClient()                       → called AFTER step 2, real generator is used
 *
 * This placeholder is NEVER called to generate a real ID. If it is, it means
 * initialize() was skipped — the error below will surface that misconfiguration clearly.
 */
export const REACT_NATIVE_PLACEHOLDER_ID_GENERATOR: IdGenerator = {
  newId: () => {
    throw new Error(
      '[Bucketeer] defineBKTConfigForReactNative placeholder idGenerator was called. ' +
        'This means BucketeerReactNativeProvider.initialize() was not called before the client was used. ' +
        'Ensure OpenFeature.setProvider() is called before using the client.',
    )
  },
}

/**
 * Creates a BKTConfig for use with BucketeerReactNativeProvider.
 *
 * Use this instead of the native SDK's defineBKTConfig when using BucketeerReactNativeProvider.
 * You do not need to provide an idGenerator — it is always managed internally by the provider,
 * which automatically loads and injects the correct React Native implementation (react-native-uuid)
 * during initialization. Any idGenerator provided in the config will be ignored.
 */
export const defineBKTConfigForReactNative = (config: RawBKTConfig): BKTConfig => {
  return defineBKTConfig({
    ...config,
    idGenerator: REACT_NATIVE_PLACEHOLDER_ID_GENERATOR,
  })
}
