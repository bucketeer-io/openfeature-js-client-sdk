import {
  BKTConfig,
  defineBKTConfig,
} from '@bucketeer/js-client-sdk'
import { SDK_VERSION } from '../../version'
import BucketeerProvider, { SOURCE_ID_OPEN_FEATURE_REACT_NATIVE } from '../BucketeerProvider'
import { createReactNativeStorageFactory } from './AsyncStorageFactory'
import { createReactNativeIdGenerator } from './IdGeneratorFactory'
import { EvaluationContext, ProviderFatalError, ProviderMetadata } from '@openfeature/web-sdk'

class BucketeerReactNativeProvider extends BucketeerProvider {

  get metadata() {
    return {
      name: 'Bucketeer React Native Provider' as const,
      version: SDK_VERSION,
    } as ProviderMetadata
  }

  constructor(config: BKTConfig) {
    const overrideConfig = defineBKTConfig({
      ...config,
      wrapperSdkSourceId: SOURCE_ID_OPEN_FEATURE_REACT_NATIVE,
      wrapperSdkVersion: SDK_VERSION,
    })
    super(overrideConfig)
  }

  async initialize(context?: EvaluationContext | undefined): Promise<void> {
    const [storageFactory, idGenerator] = await Promise.all([
      createReactNativeStorageFactory(),
      createReactNativeIdGenerator(),
    ])

    if (!idGenerator) {
      throw new ProviderFatalError('react-native-uuid is not available. Please add it as a dependency.')
    }

    // idGenerator is always managed internally by this provider.
    // The react-native-uuid implementation is injected here.
    // Any idGenerator value in the incoming config is intentionally 
    // ignored — it is an internal-only concern of the provider.
    // storageFactory is also always replaced with the React Native AsyncStorage implementation.
    this.config = defineBKTConfig({
      ...this.config,
      storageFactory: storageFactory,
      idGenerator: idGenerator,
    })

    // BKTClient will be initialized in the super.initialize() call
    return super.initialize?.(context)
  }
}

export { BucketeerReactNativeProvider }
