import { BKTConfig, defineBKTConfig, RawBKTConfig } from '@bucketeer/js-client-sdk'
import { ReactNativeIdGenerator } from './IdGenerator'

export const defineBKTConfigForReactNative = (config: RawBKTConfig): BKTConfig => {
  const overrideConfig: RawBKTConfig = {
    ...config,
    // idGenerator is required in React Native environment
    idGenerator: new ReactNativeIdGenerator(),
  }
  return defineBKTConfig(overrideConfig)
}