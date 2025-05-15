import { toResolutionDetails, toResolutionDetailsJsonValue } from '../../src/internal/BKTEvaluationDetailExt'
import { BKTEvaluationDetails, BKTValue } from 'bkt-js-client-sdk'
import { JsonValue, ResolutionDetails } from '@openfeature/web-sdk'
import { describe, it, expect } from 'vitest'

describe('toResolutionDetails', () => {
  it('should correctly transform BKTEvaluationDetails to ResolutionDetails', () => {
    const evaluationDetails: BKTEvaluationDetails<string> = {
      featureId: 'feature-1',
      featureVersion: 1,
      userId: 'user-123',
      variationId: 'variation-1',
      variationValue: 'test-value',
      variationName: 'test-variant',
      reason: 'TARGET',
    }

    const result: ResolutionDetails<string> = toResolutionDetails(evaluationDetails)

    expect(result).toEqual({
      value: 'test-value',
      variant: 'test-variant',
      reason: 'TARGET',
    })
  })

  it('should handle numeric variation values', () => {
    const evaluationDetails: BKTEvaluationDetails<number> = {
      featureId: 'feature-2',
      featureVersion: 2,
      userId: 'user-456',
      variationId: 'variation-2',
      variationValue: 42,
      variationName: 'test-variant',
      reason: 'RULE',
    }

    const result: ResolutionDetails<number> = toResolutionDetails(evaluationDetails)

    expect(result).toEqual({
      value: 42,
      variant: 'test-variant',
      reason: 'RULE',
    })
  })

  it('should handle boolean variation values', () => {
    const evaluationDetails: BKTEvaluationDetails<boolean> = {
      featureId: 'feature-3',
      featureVersion: 3,
      userId: 'user-789',
      variationId: 'variation-3',
      variationValue: true,
      variationName: 'test-variant',
      reason: 'DEFAULT',
    }

    const result: ResolutionDetails<boolean> = toResolutionDetails(evaluationDetails)

    expect(result).toEqual({
      value: true,
      variant: 'test-variant',
      reason: 'DEFAULT',
    })
  })
})

describe('toResolutionDetailsJsonValue', () => {
  it('should correctly transform BKTEvaluationDetails to ResolutionDetails with string JsonValue', () => {
    const evaluationDetails: BKTEvaluationDetails<string> = {
      featureId: 'feature-1',
      featureVersion: 1,
      userId: 'user-123',
      variationId: 'variation-1',
      variationValue: 'test-value',
      variationName: 'test-variant',
      reason: 'TARGET',
    }

    const result = toResolutionDetailsJsonValue<string>(evaluationDetails)

    expect(result).toEqual({
      value: 'test-value',
      variant: 'test-variant',
      reason: 'TARGET',
    })
  })

  it('should correctly transform BKTEvaluationDetails to ResolutionDetails with number JsonValue', () => {
    const evaluationDetails: BKTEvaluationDetails<number> = {
      featureId: 'feature-2',
      featureVersion: 2,
      userId: 'user-456',
      variationId: 'variation-2',
      variationValue: 42,
      variationName: 'test-variant',
      reason: 'RULE',
    }

    const result = toResolutionDetailsJsonValue<number>(evaluationDetails)

    expect(result).toEqual({
      value: 42,
      variant: 'test-variant',
      reason: 'RULE',
    })
  })

  it('should correctly transform BKTEvaluationDetails to ResolutionDetails with boolean JsonValue', () => {
    const evaluationDetails: BKTEvaluationDetails<boolean> = {
      featureId: 'feature-3',
      featureVersion: 3,
      userId: 'user-789',
      variationId: 'variation-3',
      variationValue: true,
      variationName: 'test-variant',
      reason: 'DEFAULT',
    }

    const result = toResolutionDetailsJsonValue<boolean>(evaluationDetails)

    expect(result).toEqual({
      value: true,
      variant: 'test-variant',
      reason: 'DEFAULT',
    })
  })

  it('should correctly transform BKTEvaluationDetails to ResolutionDetails with object JsonValue', () => {
    const evaluationDetails: BKTEvaluationDetails<BKTValue> = {
      featureId: 'feature-4',
      featureVersion: 4,
      userId: 'user-101',
      variationId: 'variation-4',
      variationValue: { key: 'value' },
      variationName: 'test-variant',
      reason: 'CLIENT',
    }

    const result = toResolutionDetailsJsonValue<JsonValue>(evaluationDetails)

    expect(result).toEqual({
      value: { key: 'value' },
      variant: 'test-variant',
      reason: 'CLIENT',
    })
  })
})
