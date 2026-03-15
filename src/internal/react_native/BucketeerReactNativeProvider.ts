import {
  BKTConfig,
  defineBKTConfig,
  RawBKTConfig,
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
    const inputConfig: RawBKTConfig = {
      ...config,
      wrapperSdkSourceId: SOURCE_ID_OPEN_FEATURE_REACT_NATIVE,
      wrapperSdkVersion: SDK_VERSION,
      // idGenerator and storageFactory are NOT set here — they will be provided in initialize() 
      // with React Native–specific implementations. Any user-provided values 
      // in the config are explicitly ignored here by setting them to undefined.
      idGenerator: undefined,
      storageFactory: undefined,
    }

    // Note: defineBKTConfig is called here and again in the super() constructor.
    // This is intentional: defineBKTConfig is idempotent on already-normalized input,
    // and this allows the subclass to safely own its specific identity (userAgent, sourceId, etc.)
    // without relying on base class implementation details.
    const result = defineBKTConfig(inputConfig)
    super(result)
  }

  async initialize(context?: EvaluationContext | undefined): Promise<void> {
    const [storageFactory, idGenerator] = await Promise.all([
      createReactNativeStorageFactory(),
      createReactNativeIdGenerator(),
    ])

    if (!idGenerator) {
      throw new ProviderFatalError('react-native-uuid is not available. Please add it as a dependency.')
    }

    // This provider is designed to provide React Native specific implementations.
    // User-provided storageFactory or idGenerator in the config are ignored to ensure
    // the correct environment-specific behavior is maintained.
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
