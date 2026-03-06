import { 
  toResolutionDetails, 
  toResolutionDetailsJsonValue,
  convertReason,
  getEvaluationError,
} from '../../src/internal/BKTEvaluationDetailExt'
import { BKTEvaluationDetails, BKTValue } from '@bucketeer/js-client-sdk'
import { ErrorCode, JsonValue, ResolutionDetails, StandardResolutionReasons } from '@openfeature/web-sdk'
import { describe, it, expect } from 'vitest'

describe('convertReason', () => {
  it('maps TARGET, RULE, PREREQUISITE correctly', () => {
    expect(convertReason('TARGET')).toBe(StandardResolutionReasons.TARGETING_MATCH)
    expect(convertReason('RULE')).toBe(StandardResolutionReasons.TARGETING_MATCH)
    expect(convertReason('PREREQUISITE')).toBe(StandardResolutionReasons.TARGETING_MATCH)
  })

  it('maps DEFAULT correctly', () => {
    expect(convertReason('DEFAULT')).toBe(StandardResolutionReasons.DEFAULT)
  })

  it('maps OFF_VARIATION correctly', () => {
    expect(convertReason('OFF_VARIATION')).toBe(StandardResolutionReasons.DISABLED)
  })

  it('maps all defined errors to ERROR', () => {
    expect(convertReason('ERROR_FLAG_NOT_FOUND')).toBe(StandardResolutionReasons.ERROR)
    expect(convertReason('ERROR_WRONG_TYPE')).toBe(StandardResolutionReasons.ERROR)
    expect(convertReason('ERROR_USER_ID_NOT_SPECIFIED')).toBe(StandardResolutionReasons.ERROR)
    expect(convertReason('ERROR_FEATURE_FLAG_ID_NOT_SPECIFIED')).toBe(StandardResolutionReasons.ERROR)
    expect(convertReason('ERROR_NO_EVALUATIONS')).toBe(StandardResolutionReasons.ERROR)
    expect(convertReason('ERROR_CACHE_NOT_FOUND')).toBe(StandardResolutionReasons.ERROR)
    expect(convertReason('ERROR_EXCEPTION')).toBe(StandardResolutionReasons.ERROR)
  })

  it('passes non-error reasons through as-is', () => {
    expect(convertReason('CLIENT')).toBe('CLIENT')
    // Intentionally passing an unknown reason string to test the default fallthrough branch.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(convertReason('SOMETHING_ELSE' as any)).toBe('SOMETHING_ELSE')
  })
})

describe('getEvaluationError', () => {
  it('handles ERROR_FLAG_NOT_FOUND correctly', () => {
    expect(getEvaluationError('ERROR_FLAG_NOT_FOUND')).toEqual({
      errorCode: ErrorCode.FLAG_NOT_FOUND,
      errorMessage: 'ERROR_FLAG_NOT_FOUND',
    })
  })

  it('handles ERROR_WRONG_TYPE correctly', () => {
    expect(getEvaluationError('ERROR_WRONG_TYPE')).toEqual({
      errorCode: ErrorCode.TYPE_MISMATCH,
      errorMessage: 'ERROR_WRONG_TYPE',
    })
  })

  it('handles ERROR_USER_ID_NOT_SPECIFIED correctly', () => {
    expect(getEvaluationError('ERROR_USER_ID_NOT_SPECIFIED')).toEqual({
      errorCode: ErrorCode.TARGETING_KEY_MISSING,
      errorMessage: 'ERROR_USER_ID_NOT_SPECIFIED',
    })
  })

  it('handles GENERAL errors correctly', () => {
    const expected = { errorCode: ErrorCode.GENERAL }
    expect(getEvaluationError('ERROR_FEATURE_FLAG_ID_NOT_SPECIFIED')).toMatchObject(expected)
    expect(getEvaluationError('ERROR_NO_EVALUATIONS')).toMatchObject(expected)
    expect(getEvaluationError('ERROR_CACHE_NOT_FOUND')).toMatchObject(expected)
    expect(getEvaluationError('ERROR_EXCEPTION')).toMatchObject(expected)
  })

  it('returns undefined for known non-error reasons', () => {
    expect(getEvaluationError('TARGET')).toBeUndefined()
    expect(getEvaluationError('DEFAULT')).toBeUndefined()
  })
})

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
      reason: StandardResolutionReasons.TARGETING_MATCH,
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
      reason: StandardResolutionReasons.TARGETING_MATCH,
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
      reason: StandardResolutionReasons.DEFAULT,
    })
  })

  it.each([
    { reason: 'TARGET',        expected: StandardResolutionReasons.TARGETING_MATCH },
    { reason: 'RULE',          expected: StandardResolutionReasons.TARGETING_MATCH },
    { reason: 'PREREQUISITE',  expected: StandardResolutionReasons.TARGETING_MATCH },
    { reason: 'DEFAULT',       expected: StandardResolutionReasons.DEFAULT },
    { reason: 'OFF_VARIATION', expected: StandardResolutionReasons.DISABLED },
    { reason: 'CLIENT',        expected: 'CLIENT' },
    { reason: 'UNKNOWN_REASON',expected: 'UNKNOWN_REASON' },
  ])('should map $reason → reason=$expected with no errorCode', ({ reason, expected }) => {
    const evaluationDetails = {
      featureId: 'feature-1',
      featureVersion: 1,
      userId: 'user-123',
      variationId: 'variation-1',
      variationValue: 'some-value',
      variationName: 'some-variant',
      reason: reason
    } as BKTEvaluationDetails<string>
    const result = toResolutionDetails(evaluationDetails)
    expect(result).toEqual({
      value: 'some-value',
      variant: 'some-variant',
      reason: expected,
    })
  })

  it.each([
    { reason: 'ERROR_FLAG_NOT_FOUND',               errorCode: ErrorCode.FLAG_NOT_FOUND },
    { reason: 'ERROR_WRONG_TYPE',                   errorCode: ErrorCode.TYPE_MISMATCH },
    { reason: 'ERROR_USER_ID_NOT_SPECIFIED',        errorCode: ErrorCode.TARGETING_KEY_MISSING },
    { reason: 'ERROR_FEATURE_FLAG_ID_NOT_SPECIFIED',errorCode: ErrorCode.GENERAL },
    { reason: 'ERROR_NO_EVALUATIONS',               errorCode: ErrorCode.GENERAL },
    { reason: 'ERROR_CACHE_NOT_FOUND',              errorCode: ErrorCode.GENERAL },
    { reason: 'ERROR_EXCEPTION',                    errorCode: ErrorCode.GENERAL },
  ])('should map $reason → reason=ERROR, errorCode=$errorCode', ({ reason, errorCode }) => {
    const evaluationDetails = {
      featureId: 'feature-err',
      featureVersion: 0,
      userId: 'user-err',
      variationId: 'var-err',
      variationValue: 'fallback',
      variationName: 'fallback-variant',
      reason: reason,
    } as BKTEvaluationDetails<string>
    const result = toResolutionDetails(evaluationDetails)
    expect(result).toEqual({
      value: 'fallback',
      variant: 'fallback-variant',
      reason: StandardResolutionReasons.ERROR,
      errorCode,
      errorMessage: reason,
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
      reason: StandardResolutionReasons.TARGETING_MATCH,
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
      reason: StandardResolutionReasons.TARGETING_MATCH,
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
      reason: StandardResolutionReasons.DEFAULT,
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
      reason: 'DEFAULT',
    }

    const result = toResolutionDetailsJsonValue<JsonValue>(evaluationDetails)

    expect(result).toEqual({
      value: { key: 'value' },
      variant: 'test-variant',
      reason: StandardResolutionReasons.DEFAULT,
    })
  })

  it.each([
    { reason: 'TARGET',        expected: StandardResolutionReasons.TARGETING_MATCH },
    { reason: 'RULE',          expected: StandardResolutionReasons.TARGETING_MATCH },
    { reason: 'PREREQUISITE',  expected: StandardResolutionReasons.TARGETING_MATCH },
    { reason: 'DEFAULT',       expected: StandardResolutionReasons.DEFAULT },
    { reason: 'OFF_VARIATION', expected: StandardResolutionReasons.DISABLED },
    { reason: 'CLIENT',        expected: 'CLIENT' },
    { reason: 'UNKNOWN_REASON',expected: 'UNKNOWN_REASON' },
  ])('should map $reason → reason=$expected with no errorCode', ({ reason, expected }) => {
    const evaluationDetails = {
      featureId: 'feature-1',
      featureVersion: 1,
      userId: 'user-123',
      variationId: 'variation-1',
      variationValue: { key: 'value' },
      variationName: 'some-variant',
      reason: reason,
    } as BKTEvaluationDetails<BKTValue>
    const result = toResolutionDetailsJsonValue<JsonValue>(evaluationDetails)
    expect(result).toEqual({
      value: { key: 'value' },
      variant: 'some-variant',
      reason: expected,
    })
  })

  it.each([
    { reason: 'ERROR_FLAG_NOT_FOUND',               errorCode: ErrorCode.FLAG_NOT_FOUND },
    { reason: 'ERROR_WRONG_TYPE',                   errorCode: ErrorCode.TYPE_MISMATCH },
    { reason: 'ERROR_USER_ID_NOT_SPECIFIED',        errorCode: ErrorCode.TARGETING_KEY_MISSING },
    { reason: 'ERROR_FEATURE_FLAG_ID_NOT_SPECIFIED',errorCode: ErrorCode.GENERAL },
    { reason: 'ERROR_NO_EVALUATIONS',               errorCode: ErrorCode.GENERAL },
    { reason: 'ERROR_CACHE_NOT_FOUND',              errorCode: ErrorCode.GENERAL },
    { reason: 'ERROR_EXCEPTION',                    errorCode: ErrorCode.GENERAL },
  ])('should map $reason → reason=ERROR, errorCode=$errorCode', ({ reason, errorCode }) => {
    const evaluationDetails = {
      featureId: 'feature-err',
      featureVersion: 0,
      userId: 'user-err',
      variationId: 'var-err',
      variationValue: { fallback: true },
      variationName: 'fallback-variant',
      reason: reason,
    } as BKTEvaluationDetails<BKTValue>
    const result = toResolutionDetailsJsonValue<JsonValue>(evaluationDetails)
    expect(result).toEqual({
      value: { fallback: true },
      variant: 'fallback-variant',
      reason: StandardResolutionReasons.ERROR,
      errorCode,
      errorMessage: reason,
    })
  })
})

