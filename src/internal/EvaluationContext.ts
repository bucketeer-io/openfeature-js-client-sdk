import { BKTUser, defineBKTUser } from '@bucketeer/js-client-sdk'
import { EvaluationContext } from '@openfeature/web-sdk'

function evaluationContextToBKTUser(
  evaluationContext: EvaluationContext,
): BKTUser {
  const targetingKey = evaluationContext.targetingKey
  if (!targetingKey) {
    throw new Error('targetingKey is required')
  }
  return defineBKTUser({
    id: targetingKey,
    customAttributes: {
     
    },
  })
}

export { evaluationContextToBKTUser }