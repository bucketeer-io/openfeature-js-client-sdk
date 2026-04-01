import { BKTConfig, defineBKTConfig } from '@bucketeer/js-client-sdk'
import { SDK_VERSION } from '../../version'
import BucketeerProvider, {
  SOURCE_ID_OPEN_FEATURE_REACT,
} from '../BucketeerProvider'
import { ProviderMetadata } from '@openfeature/web-sdk'

class BucketeerReactProvider extends BucketeerProvider {
  
  constructor(config: BKTConfig) {
    // Note: defineBKTConfig is called here and again in the super() constructor.
    // This is intentional: defineBKTConfig is idempotent on already-normalized input,
    // and this allows the subclass to safely own its specific identity (userAgent, sourceId, etc.)
    // without relying on base class implementation details.
    const overrideConfig = defineBKTConfig({
      ...config,
      wrapperSdkSourceId: SOURCE_ID_OPEN_FEATURE_REACT,
      wrapperSdkVersion: SDK_VERSION,
    })
    super(overrideConfig)
  }

  get metadata() {
    return {
      name: 'Bucketeer React Provider' as const,
      version: SDK_VERSION,
    } as ProviderMetadata
  }
}

export { BucketeerReactProvider }
