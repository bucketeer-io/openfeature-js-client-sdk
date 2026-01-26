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

  /**
   * Resolves an object (or array) flag value with strict type validation.
   *
   * ⚠️ TYPE SAFETY REQUIREMENTS:
   * - Primitive types (string, number, boolean) are explicitly rejected to ensure type safety.
   *
   * - For primitive types, use the corresponding methods on the OpenFeature Client: `getBooleanValue`, `getStringValue`, `getNumberValue`, or their `Details` variants.
   *
   * ⚠️ NESTED TYPE CAVEAT:
   * - While the top-level type (Array vs Object) is validated, the internal structure
   *   (e.g., array element types or object property keys/types) cannot be validated at the provider level due to type erasure.
   *
   * - Always use additional runtime validation (type guards, Zod, etc.) before accessing nested properties.
   *
   * @example
   * // Provider validates: result is array, default is array ✓
   * const result = client.getObjectDetails<string[]>(flagKey, ['default'])
   *
   * // But provider CANNOT validate element types ⚠️
   * // Use type guard before accessing:
   * if (Array.isArray(result.value) && result.value.every(x => typeof x === 'string')) {
   *   result.value.forEach(str => str.toUpperCase()) // Now safe
   * }
   */
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

    // Step 1: Check for null (special case where typeof null === 'object')
    if (evaluationDetails.variationValue === null) {
      return wrongTypeResult(defaultValue, 'Expected object but got null')
    }

    // Step 2: Verify the value is an object or array (reject primitives)
    if (typeof evaluationDetails.variationValue !== 'object') {
      return wrongTypeResult(
        defaultValue,
        `Expected object but got ${typeof evaluationDetails.variationValue}`,
      )
    }

    // Note: At this point we've validated the top-level type (array vs object).
    // However, DUE TO TYPE ERASURE, we cannot validate:
    // - Array element types (e.g., string[] vs number[])
    // - Object property shapes (e.g., {name: string} vs {age: number})
    const resultIsJsonArray = Array.isArray(evaluationDetails.variationValue)
    const defaultIsJsonArray = Array.isArray(defaultValue)

    // Step 4: Enforce type consistency between default and returned value
    if (resultIsJsonArray !== defaultIsJsonArray) {
      return wrongTypeResult(
        defaultValue,
        `Expected ${defaultIsJsonArray ? 'array' : 'object'} but got ${
          resultIsJsonArray ? 'array' : 'object'
        }`,
      )
    }

    // Step 5: Type validation passed, return the result
    return toResolutionDetailsJsonValue(evaluationDetails)
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
