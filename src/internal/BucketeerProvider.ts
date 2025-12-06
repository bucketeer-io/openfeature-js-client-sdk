import {
  BKTClient,
  BKTConfig,
  defineBKTConfig,
  destroyBKTClient,
  getBKTClient,
  initializeBKTClient,
} from 'bkt-js-client-sdk'
import {
  ClientProviderEvents,
  ErrorCode,
  EvaluationContext,
  Hook,
  InvalidContextError,
  JsonValue,
  Logger,
  OpenFeatureEventEmitter,
  Provider,
  ProviderFatalError,
  ProviderMetadata,
  ProviderNotReadyError,
  ResolutionDetails,
  StandardResolutionReasons,
} from '@openfeature/web-sdk'
import { evaluationContextToBKTUser } from './EvaluationContext'
import { toResolutionDetails, toResolutionDetailsJsonValue } from './BKTEvaluationDetailExt'
import { SDK_VERSION } from '../version'

const SOURCE_ID_OPEN_FEATURE_JAVASCRIPT = 102
export const SOURCE_ID_OPEN_FEATURE_REACT = 105
export const SOURCE_ID_OPEN_FEATURE_REACT_NATIVE = 106

const supportedSourceIds = [
  SOURCE_ID_OPEN_FEATURE_JAVASCRIPT,
  SOURCE_ID_OPEN_FEATURE_REACT,
  SOURCE_ID_OPEN_FEATURE_REACT_NATIVE,
]

// implement the provider interface
class BucketeerProvider implements Provider {
  // Adds runtime validation that the provider is used with the expected SDK
  public readonly runsOn = 'client'
  get metadata() {
    return {
      name: 'Bucketeer Provider' as const,
      version: SDK_VERSION,
    } as ProviderMetadata
  }
  // Optional provider managed hooks
  hooks?: Hook[]

  protected config: BKTConfig

  constructor(config: BKTConfig) {
    let inputWrapperSdkVersion = config.wrapperSdkVersion
    let inputWrapperSdkSourceId = config.wrapperSdkSourceId
    if (inputWrapperSdkSourceId === undefined) {
      inputWrapperSdkSourceId = SOURCE_ID_OPEN_FEATURE_JAVASCRIPT
    }
    if (!supportedSourceIds.includes(inputWrapperSdkSourceId)) {
      throw new Error(`Unsupported wrapperSdkSourceId: ${inputWrapperSdkSourceId}`)
    }
    if (inputWrapperSdkSourceId === SOURCE_ID_OPEN_FEATURE_JAVASCRIPT) {
      inputWrapperSdkVersion = SDK_VERSION
    } else if (inputWrapperSdkVersion === undefined) {
      throw new Error('wrapperSdkVersion is required when wrapperSdkSourceId is set')
    }
    const overrideConfig = defineBKTConfig({
      ...config,
      wrapperSdkVersion: inputWrapperSdkVersion,
      wrapperSdkSourceId: inputWrapperSdkSourceId,
    })
    this.config = overrideConfig
  }

  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    _context: EvaluationContext,
    _logger: Logger
  ): ResolutionDetails<boolean> {
    const client = this.requiredBKTClient()
    const evaluationDetails = client.booleanVariationDetails(
      flagKey,
      defaultValue,
    )
    return toResolutionDetails(evaluationDetails)
  }

  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    _context: EvaluationContext,
    _logger: Logger
  ): ResolutionDetails<string> {
    const client = this.requiredBKTClient()
    const evaluationDetails = client.stringVariationDetails(
      flagKey,
      defaultValue,
    )
    return toResolutionDetails(evaluationDetails)
  }

  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    _context: EvaluationContext,
    _logger: Logger
  ): ResolutionDetails<number> {
    const client = this.requiredBKTClient()
    const evaluationDetails = client.numberVariationDetails(
      flagKey,
      defaultValue,
    )
    return toResolutionDetails(evaluationDetails)
  }

  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    _context: EvaluationContext,
    _logger: Logger
  ): ResolutionDetails<T> {
    const client = this.requiredBKTClient()
    const evaluationDetails = client.objectVariationDetails(
      flagKey,
      defaultValue,
    )
    if (typeof evaluationDetails.variationValue === 'object') {
      return toResolutionDetailsJsonValue(evaluationDetails)
    }
    return wrongTypeResult(
      defaultValue,
      `Expected object but got ${typeof evaluationDetails.variationValue}`,
    )
  }

  async onContextChange?(
    _oldContext: EvaluationContext,
    newContext: EvaluationContext
  ): Promise<void> {
    // code to handle context change
    // Not support changing the targetingKey after initialization
    // Need to reinitialize the provider
    const user = evaluationContextToBKTUser(newContext)
    const client = this.requiredBKTClient()
    const currentUser = client?.currentUser()
    if (currentUser.id == user.id) {
      client.updateUserAttributes(user.attributes)
      this.events.emit(ClientProviderEvents.Ready)
    } else {
      this.events.emit(ClientProviderEvents.Error)
      throw new InvalidContextError('Changing the targetingKey after initialization is not supported, please reinitialize the provider')
    }
  }

  requiredBKTClient(): BKTClient {
    const client = getBKTClient()
    if (!client) {
      this.events.emit(ClientProviderEvents.Error)
      throw new ProviderNotReadyError('Bucketeer client is not initialized')
    }
    return client
  }

  readonly events = new OpenFeatureEventEmitter()

  async initialize?(context?: EvaluationContext | undefined): Promise<void> {
    if (!context) {
      throw new InvalidContextError('context is required')
    }
    const config = this.config
    const user = evaluationContextToBKTUser(context)

    try {
      await initializeBKTClient(config, user)
      this.events.emit(ClientProviderEvents.Ready)
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutException') {
        // TimeoutException but The BKTClient SDK has been initialized
        this.events.emit(ClientProviderEvents.Ready)
      } else {
        this.events.emit(ClientProviderEvents.Error)
        throw new ProviderFatalError(`Failed to initialize Bucketeer client: ${error}`)
      }
    }
  }
  
  async onClose?(): Promise<void> {
    destroyBKTClient()
  }
}

export function wrongTypeResult<T>(value: T, errorMessage: string): ResolutionDetails<T> {
  return {
    value,
    reason: StandardResolutionReasons.ERROR,
    errorCode: ErrorCode.TYPE_MISMATCH,
    errorMessage,
  }
}

export default BucketeerProvider
