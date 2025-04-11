import {
  BKTClient,
  BKTConfig,
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

// implement the provider interface
class BucketeerProvider implements Provider {
  // Adds runtime validation that the provider is used with the expected SDK
  public readonly runsOn = 'client'
  readonly metadata = {
    name: 'Bucketeer Provider',
  } as const
  // Optional provider managed hooks
  hooks?: Hook[]

  private config: BKTConfig

  constructor(config: BKTConfig) {
    this.config = config
  }

  resolveBooleanEvaluation(
    _flagKey: string,
    _defaultValue: boolean,
    _context: EvaluationContext,
    _logger: Logger
  ): ResolutionDetails<boolean> {
    // code to evaluate a boolean
    const client = this.requiredBKTClient()
    const evaluationDetails = client.booleanVariationDetails(
      _flagKey,
      _defaultValue,
    )
    return toResolutionDetails(evaluationDetails)
  }

  resolveStringEvaluation(
    _flagKey: string,
    _defaultValue: string,
    _context: EvaluationContext,
    _logger: Logger
  ): ResolutionDetails<string> {
    // code to evaluate a string
    const client = this.requiredBKTClient()
    const evaluationDetails = client.stringVariationDetails(
      _flagKey,
      _defaultValue,
    )
    return toResolutionDetails(evaluationDetails)
  }

  resolveNumberEvaluation(
    _flagKey: string,
    _defaultValue: number,
    _context: EvaluationContext,
    _logger: Logger
  ): ResolutionDetails<number> {
    // code to evaluate a number
    const client = this.requiredBKTClient()
    const evaluationDetails = client.numberVariationDetails(
      _flagKey,
      _defaultValue,
    )
    return toResolutionDetails(evaluationDetails)
  }

  resolveObjectEvaluation<T extends JsonValue>(
    _flagKey: string,
    _defaultValue: T,
    _context: EvaluationContext,
    _logger: Logger
  ): ResolutionDetails<T> {
    // code to evaluate an object
    const client = this.requiredBKTClient()
    const evaluationDetails = client.objectVariationDetails(
      _flagKey,
      _defaultValue,
    )
    if (typeof evaluationDetails.variationValue === 'object') {
      return toResolutionDetailsJsonValue(evaluationDetails)
    }
    return wrongTypeResult(
      _defaultValue,
      `Expected object but got ${typeof evaluationDetails.variationValue}`,
    )
  }

  async onContextChange?(
    _oldContext: EvaluationContext,
    newContext: EvaluationContext
  ): Promise<void> {
    // code to handle context change
    // Not support changing the targeting_id after initialization
    // Need to reinitialize the provider
    const user = evaluationContextToBKTUser(newContext)
    const client = this.requiredBKTClient()
    const currentUser = client?.currentUser()
    if (currentUser.id == user.id) {
      client.updateUserAttributes(user.attributes)
      this.events.emit(ClientProviderEvents.Ready)
    } else {
      this.events.emit(ClientProviderEvents.Error)
      throw new InvalidContextError('Changing the targeting_id after initialization is not supported, please reinitialize the provider')
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
    // code to initialize your provider
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
