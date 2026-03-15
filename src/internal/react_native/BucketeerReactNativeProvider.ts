import {
  BKTConfig,
  defineBKTConfig,
  RawBKTConfig,
} from '@bucketeer/js-client-sdk'
import { SDK_VERSION } from '../../version'
import BucketeerProvider, { SOURCE_ID_OPEN_FEATURE_REACT_NATIVE } from '../BucketeerProvider'
import { createReactNativeStorageFactory } from './AsyncStorageFactory'
import { EvaluationContext, ProviderMetadata } from '@openfeature/web-sdk'
import { ReactNativeIdGenerator } from './IdGenerator'

class BucketeerReactNativeProvider extends BucketeerProvider {

  get metadata() {
    return {
      name: 'Bucketeer React Native Provider' as const,
      version: SDK_VERSION,
    } as ProviderMetadata
  }

  constructor(config: BKTConfig) {
    const inputConfig: RawBKTConfig = {
      ...config,
      wrapperSdkSourceId: SOURCE_ID_OPEN_FEATURE_REACT_NATIVE,
      wrapperSdkVersion: SDK_VERSION,
      userAgent: `Bucketeer React Native Provider`,
      // idGenerator is required in React Native environment
      idGenerator: new ReactNativeIdGenerator(),
    }

    // Note: defineBKTConfig is called here and again in the super() constructor.
    // This is intentional: defineBKTConfig is idempotent on already-normalized input,
    // and this allows the subclass to safely own its specific identity (userAgent, sourceId, etc.)
    // without relying on base class implementation details.
    const result = defineBKTConfig(inputConfig)
    super(result)
  }

  async initialize(context?: EvaluationContext | undefined): Promise<void> {
    // Options to set up AsyncStorage-backed storageFactory when available
    // Create storageFactory here to avoid async constructor
    const storageFactory = await createReactNativeStorageFactory()
    let inputConfig = this.config
    if (storageFactory) {
      inputConfig = {
        ...inputConfig,
        storageFactory,
      }
      // Re-define config with storageFactory
      this.config = defineBKTConfig(inputConfig)
    } else {
      // Do not set storageFactory when AsyncStorage is not available
      // This allows the JS-SDK to fall back to its default in-memory storage implementation
      console.warn(
        'AsyncStorage is not available. Bucketeer JS SDK will use in-memory storage without persistence.'
      )
    }

    // BKTClient will be initialized in the super.initialize() call
    return super.initialize?.(context)
  }
}

export { BucketeerReactNativeProvider }
