import { JsonValue, ResolutionDetails } from '@openfeature/web-sdk'
import { BKTEvaluationDetails, BKTValue } from '@bucketeer/js-client-sdk'

function toResolutionDetails<T extends BKTValue>(
  evaluationDetails: BKTEvaluationDetails<T>
): ResolutionDetails<T> {
  const { variationValue, variationName, reason } = evaluationDetails
  return {
    value: variationValue,
    variant: variationName,
    reason: reason,
  } satisfies ResolutionDetails<T>
}

function toResolutionDetailsFlagValue<T extends JsonValue>(
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

export { toResolutionDetails, toResolutionDetailsFlagValue }

