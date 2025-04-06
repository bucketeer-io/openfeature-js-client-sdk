import { BKTValue } from '@bucketeer/js-client-sdk'
import { FlagValue } from '@openfeature/web-sdk'

function toBKTValue(value: FlagValue): BKTValue {
  return value
}

export { toBKTValue }