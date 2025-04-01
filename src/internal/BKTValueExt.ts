import { BKTValue } from "@bucketeer/js-client-sdk";
import { FlagValue } from "@openfeature/web-sdk";

function toBKTValue(value: FlagValue): BKTValue {
  return value;
}

function toValue(value: BKTValue): FlagValue {
  return value;
}

export { toBKTValue, toValue };