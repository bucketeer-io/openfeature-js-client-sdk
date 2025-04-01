/* eslint-disable @typescript-eslint/no-unused-vars */
import { BKTConfig } from '@bucketeer/js-client-sdk'
import {
  EvaluationContext,
  Hook,
  JsonValue,
  Logger,
  OpenFeatureEventEmitter,
  Provider,
  ResolutionDetails
} from '@openfeature/web-sdk'

// implement the provider interface
class BucketeerProvider implements Provider {
  // Adds runtime validation that the provider is used with the expected SDK
  public readonly runsOn = 'client'
  readonly metadata = {
    name: 'Bucketeer Provider',
  } as const
  // Optional provider managed hooks
  hooks?: Hook[]

  constructor(config: BKTConfig) {
    // constructor code
  }
  

  resolveBooleanEvaluation(flagKey: string, defaultValue: boolean, context: EvaluationContext, logger: Logger): ResolutionDetails<boolean> {
    // code to evaluate a boolean
    throw new Error('Not implemented')
  }
  resolveStringEvaluation(flagKey: string, defaultValue: string, context: EvaluationContext, logger: Logger): ResolutionDetails<string> {
    // code to evaluate a string
    throw new Error('Not implemented')
  }
  resolveNumberEvaluation(flagKey: string, defaultValue: number, context: EvaluationContext, logger: Logger): ResolutionDetails<number> {
    // code to evaluate a number
    throw new Error('Not implemented')
  }
  resolveObjectEvaluation<T extends JsonValue>(flagKey: string, defaultValue: T, context: EvaluationContext, logger: Logger): ResolutionDetails<T> {
    // code to evaluate an object
    throw new Error('Not implemented')
  }

  onContextChange?(oldContext: EvaluationContext, newContext: EvaluationContext): Promise<void> {
    // reconcile the provider's cached flags, if applicable
    throw new Error('Not implemented')
  }

  readonly events = new OpenFeatureEventEmitter()

  initialize?(context?: EvaluationContext | undefined): Promise<void> {
    // code to initialize your provider
    throw new Error('Not implemented')
  }
  onClose?(): Promise<void> {
    // code to shut down your provider
    throw new Error('Not implemented')
  }
}

export default BucketeerProvider