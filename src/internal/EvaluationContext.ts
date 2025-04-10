import { BKTUser, defineBKTUser } from '@bucketeer/js-client-sdk'
import { EvaluationContext, EvaluationContextValue, TargetingKeyMissingError } from '@openfeature/web-sdk'

function evaluationContextToBKTUser(
  evaluationContext: EvaluationContext,
): BKTUser {
  const targetingKey = evaluationContext.targetingKey
  if (!targetingKey) {
    throw new TargetingKeyMissingError('targetingKey is required')
  }
  
  // Create a customAttributes object by converting EvaluationContext to Record<string, string>
  const customAttributes: Record<string, string> = {}
  
  // Process all properties from evaluationContext
  Object.entries(evaluationContext).forEach(([key, value]) => {
    // Skip targetingKey as it's used as the user ID
    if (key === 'targetingKey') {
      return
    }
    
    // Convert the value to string based on its type
    customAttributes[key] = convertContextValueToString(value)
  })
  
  const user = defineBKTUser({
    id: targetingKey,
    customAttributes,
  })
  return user
}

/**
 * Converts an EvaluationContextValue to a string
 */
function convertContextValueToString(value: EvaluationContextValue): string {
  if (value === null || value === undefined) {
    return ''
  }
  
  if (value instanceof Date) {
    return value.toISOString()
  }
  
  if (Array.isArray(value)) {
    return JSON.stringify(value)
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  
  // Handle primitive values
  return String(value)
}

export { evaluationContextToBKTUser, convertContextValueToString }