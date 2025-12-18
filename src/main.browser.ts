import BucketeerProvider from './internal/BucketeerProvider'
import { BucketeerReactProvider } from './internal/react/BucketeerReactProvider'
import { BucketeerReactNativeProvider } from './internal/react_native/BucketeerReactNativeProvider'

export { defineBKTConfigForReactNative } from './internal/react_native/defineBKTConfigForReactNative'
export { BucketeerProvider, BucketeerReactProvider, BucketeerReactNativeProvider }
export { SDK_VERSION } from './version'

export * from '@bucketeer/js-client-sdk'