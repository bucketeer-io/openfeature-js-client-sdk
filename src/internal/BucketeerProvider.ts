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
  ProviderMetadata,
  ProviderNotReadyError,
  ResolutionDetails,
  StandardResolutionReasons,
} from '@openfeature/web-sdk'
import { evaluationContextToBKTUser } from './EvaluationContext'
import { toResolutionDetails, toResolutionDetailsJsonValue } from './BKTEvaluationDetailExt'
import { SDK_VERSION } from '../version'

export const SOURCE_ID_OPEN_FEATURE_JAVASCRIPT = 102
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
    // Note: Validation errors are intentionally thrown from the constructor.
    // These guard against developer misconfiguration (e.g. unsupported wrapperSdkSourceId,
    // missing wrapperSdkVersion), not runtime failures. Failing fast here surfaces misuse
    // at development time rather than silently deferring it to initialize().

    // Extract configuration values, defaulting to the OpenFeature JavaScript source ID
    const {
      wrapperSdkSourceId = SOURCE_ID_OPEN_FEATURE_JAVASCRIPT,
      wrapperSdkVersion,
    } = config

    // Determine the correct SDK version based on the source ID
    const finalSdkVersion =
      wrapperSdkSourceId === SOURCE_ID_OPEN_FEATURE_JAVASCRIPT
        ? SDK_VERSION
        : wrapperSdkVersion

    // Validate that the source ID is supported
    if (!supportedSourceIds.includes(wrapperSdkSourceId)) {
      throw new ProviderFatalError(`Unsupported wrapperSdkSourceId: ${wrapperSdkSourceId}`)
    }

    // Validate that the SDK version is defined for non-JavaScript source IDs
    if (finalSdkVersion === undefined) {
      throw new ProviderFatalError(
        `wrapperSdkVersion is required when wrapperSdkSourceId is a non-JavaScript value (received: ${wrapperSdkSourceId})`,
      )
    }

    // Note: defineBKTConfig is called here and potentially in subclasses.
    // This is intentional: defineBKTConfig is idempotent on already-normalized input,
    // and this ensures the configuration is always correctly validated and normalized
    // with the latest overrides in this layer.
    this.config = defineBKTConfig({
      ...config,
      wrapperSdkVersion: finalSdkVersion,
      wrapperSdkSourceId: wrapperSdkSourceId,
    })
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
   * Resolves an object or array value from a feature flag.
   *
   * STRICT TYPE VALIDATION:
   * - This method ONLY supports object types (JSON objects and arrays).
   * - Primitive types (string, number, boolean, null) are explicitly rejected to ensure type safety.
   * - For primitive types, use the corresponding methods on the OpenFeature Client: `getBooleanValue`, `getStringValue`, `getNumberValue`, or their `Details` variants.
   *
   * NESTED TYPE CAVEAT:
   * - While the top-level type (Array vs Object) is validated, the internal structure
   *   (e.g., array element types or object property keys/types) cannot be validated at the provider level due to type erasure.
   * - Always use additional runtime validation (type guards, Zod, etc.) before accessing nested properties.
   *
   * @example
   * // Provider validates: result is array, default is array ✓
   * const result = client.getObjectDetails<string[]>(flagKey, ['default'])
   *
   * // But provider CANNOT validate element types
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
    const expectedTopLevelType = Array.isArray(defaultValue) ? 'array' : 'object'

    // Early guard: Verify that defaultValue itself is an object or array
    // This enforces the "ONLY supports object types" contract even if the caller
    // attempts to pass a primitive as the default value.
    if (defaultValue === null || typeof defaultValue !== 'object') {
      return wrongTypeResult(
        defaultValue,
        `Default value must be an object or array but got ${
          defaultValue === null ? 'null' : typeof defaultValue
        }`,
      )
    }

    const evaluationDetails = client.objectVariationDetails(
      flagKey,
      defaultValue,
    )

    const variationValue = evaluationDetails.variationValue

    // Step 1: Verify the value is a valid non-null object type (object or array).
    // While the Bucketeer SDK implementation ensures variationValue is never null when
    // a valid default is provided, we explicitly check for null to protect against
    // the 'typeof null === "object"' quirk in JavaScript.
    if (variationValue !== null && typeof variationValue === 'object') {
      // Step 2: Distinguish between arrays and plain objects
      // Note: At this point we've validated the top-level type (array vs object).
      // However, DUE TO TYPE ERASURE, we cannot validate:
      // - Array element types (e.g., string[] vs number[])
      // - Object property shapes (e.g., {name: string} vs {age: number})
      const resultIsJsonArray = Array.isArray(variationValue)
      const defaultIsJsonArray = Array.isArray(defaultValue)

      // Step 3: Enforce type consistency between default and returned value
      if (resultIsJsonArray !== defaultIsJsonArray) {
        return wrongTypeResult(
          defaultValue,
          `Expected ${expectedTopLevelType} but got ${resultIsJsonArray ? 'array' : 'object'}`,
        )
      }

      // Top-level structure is consistent - return the result
      return toResolutionDetailsJsonValue(evaluationDetails)
    }

    // Step 4: Reject all other types (null, string, number, boolean)
    // This prevents runtime crashes when users specify a generic <T> that doesn't
    // match the actual value returned by the backend.
    // Note: This branch should be unreachable in production because the Bucketeer JS SDK's objectVariationDetails
    // guarantees it returns an object or array (it returns the default value if the flag
    // type doesn't match). However, we keep this as a safety fallback if the SDK behavior changes.
    const actualType = variationValue === null ? 'null' : typeof variationValue
    return wrongTypeResult(defaultValue, `Expected ${expectedTopLevelType} but got ${actualType}`)
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
