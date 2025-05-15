import { JsonValue, ResolutionDetails } from '@openfeature/web-sdk'
import { BKTEvaluationDetails, BKTValue } from 'bkt-js-client-sdk'

function toResolutionDetails<T extends BKTValue>(
  evaluationDetails: BKTEvaluationDetails<T>
): ResolutionDetails<T> {
  const { variationValue, variationName, reason } = evaluationDetails
  return {
    value: variationValue as T,
    variant: variationName,
    reason: reason,
  } satisfies ResolutionDetails<T>
}

function toResolutionDetailsJsonValue<T extends JsonValue>(
  evaluationDetails: BKTEvaluationDetails<BKTValue>
): ResolutionDetails<T> {
  const { variationValue, variationName, reason } = evaluationDetails
  const jsonValue = variationValue as T
  return {
    value: jsonValue,
    variant: variationName,
    reason: reason,
  } satisfies ResolutionDetails<T>
}

export { toResolutionDetails, toResolutionDetailsJsonValue }

