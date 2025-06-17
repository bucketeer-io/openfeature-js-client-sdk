import {
  BKTClient,
  BKTConfig,
  defineBKTConfig,
  destroyBKTClient,
  getBKTClient,
  initializeBKTClient,
} from '@bucketeer/js-client-sdk'
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
  ProviderNotReadyError,
  ResolutionDetails,
  StandardResolutionReasons,
} from '@openfeature/web-sdk'
import { evaluationContextToBKTUser } from './EvaluationContext'
import { toResolutionDetails, toResolutionDetailsJsonValue } from './BKTEvaluationDetailExt'
import { SDK_VERSION } from '../version'

const SOURCE_ID_OPEN_FEATURE_JAVASCRIPT = 102

// implement the provider interface
class BucketeerProvider implements Provider {
  // Adds runtime validation that the provider is used with the expected SDK
  public readonly runsOn = 'client'
  readonly metadata = {
    name: 'Bucketeer Provider',
    version: SDK_VERSION,
  } as const
  // Optional provider managed hooks
  hooks?: Hook[]

  private config: BKTConfig

  constructor(config: BKTConfig) {
    const overrideConfig = defineBKTConfig({
      ...config,
      wrapperSdkVersion: SDK_VERSION,
      wrapperSdkSourceId: SOURCE_ID_OPEN_FEATURE_JAVASCRIPT,
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
