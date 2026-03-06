import {
  ErrorCode,
  JsonValue,
  ResolutionDetails,
  StandardResolutionReasons,
} from '@openfeature/web-sdk'
import { BKTEvaluationDetails, BKTValue } from '@bucketeer/js-client-sdk'

type BKTReason = BKTEvaluationDetails<BKTValue>['reason']

function convertReason(reason: BKTReason): string {
  switch (reason) {
    case 'TARGET':
    case 'PREREQUISITE':
    case 'RULE':
      return StandardResolutionReasons.TARGETING_MATCH
    case 'DEFAULT':
      return StandardResolutionReasons.DEFAULT
    case 'OFF_VARIATION':
      return StandardResolutionReasons.DISABLED
    case 'ERROR_FLAG_NOT_FOUND':
    case 'ERROR_WRONG_TYPE':
    case 'ERROR_USER_ID_NOT_SPECIFIED':
    case 'ERROR_FEATURE_FLAG_ID_NOT_SPECIFIED':
    case 'ERROR_NO_EVALUATIONS':
    case 'ERROR_CACHE_NOT_FOUND':
    case 'ERROR_EXCEPTION':
      return StandardResolutionReasons.ERROR
    default:
      // Note: any unknown future reasons will also pass through here
      // and will not be mapped to the standard ERROR reason.
      return reason
  }
}

type EvaluationError = {
  errorCode: ErrorCode
  errorMessage: string
}

function getEvaluationError(reason: BKTReason): EvaluationError | undefined {
  switch (reason) {
    case 'ERROR_FLAG_NOT_FOUND':
      return { errorCode: ErrorCode.FLAG_NOT_FOUND, errorMessage: reason }
    case 'ERROR_WRONG_TYPE':
      return { errorCode: ErrorCode.TYPE_MISMATCH, errorMessage: reason }
    case 'ERROR_USER_ID_NOT_SPECIFIED':
      return { errorCode: ErrorCode.TARGETING_KEY_MISSING, errorMessage: reason }
    case 'ERROR_FEATURE_FLAG_ID_NOT_SPECIFIED':
    case 'ERROR_NO_EVALUATIONS':
    case 'ERROR_CACHE_NOT_FOUND':
    case 'ERROR_EXCEPTION':
      return { errorCode: ErrorCode.GENERAL, errorMessage: reason }
    default:
      // Known non-error reasons (e.g. TARGET, DEFAULT, RULE) produce no error.
      // Note: any unknown future reasons will also return undefined here
      // and will not produce an errorCode or errorMessage.
      return undefined
  }
}

function toResolutionDetails<T extends BKTValue>(
  evaluationDetails: BKTEvaluationDetails<T>
): ResolutionDetails<T> {
  const { variationValue, variationName, reason } = evaluationDetails
  const result: ResolutionDetails<T> = {
    value: variationValue as T,
    variant: variationName,
    reason: convertReason(reason),
  }
  const error = getEvaluationError(reason)
  if (error !== undefined) {
    result.errorCode = error.errorCode
    result.errorMessage = error.errorMessage
  }
  return result
}

function toResolutionDetailsJsonValue<T extends JsonValue>(
  evaluationDetails: BKTEvaluationDetails<BKTValue>
): ResolutionDetails<T> {
  const { variationValue, variationName, reason } = evaluationDetails
  const result: ResolutionDetails<T> = {
    value: variationValue as T,
    variant: variationName,
    reason: convertReason(reason),
  }
  const error = getEvaluationError(reason)
  if (error !== undefined) {
    result.errorCode = error.errorCode
    result.errorMessage = error.errorMessage
  }
  return result
}

export {
  toResolutionDetails,
  toResolutionDetailsJsonValue,
  convertReason,
  getEvaluationError,
}
