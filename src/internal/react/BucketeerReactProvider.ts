import { BKTConfig, defineBKTConfig } from '@bucketeer/js-client-sdk'
import { SDK_VERSION } from '../../version'
import BucketeerProvider, {
  SOURCE_ID_OPEN_FEATURE_REACT,
} from '../BucketeerProvider'
import { ProviderMetadata } from '@openfeature/web-sdk'

class BucketeerReactProvider extends BucketeerProvider {
  constructor(config: BKTConfig) {
    const inputWrapperSdkVersion = SDK_VERSION
    const inputWrapperSdkSourceId = SOURCE_ID_OPEN_FEATURE_REACT
    const overrideConfig = defineBKTConfig({
      ...config,
      wrapperSdkVersion: inputWrapperSdkVersion,
      wrapperSdkSourceId: inputWrapperSdkSourceId,
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
