import { describe, it, expect, vi } from 'vitest'
import { defineBKTConfigForReactNative } from '../../src/internal/react_native/defineBKTConfigForReactNative'
import { defineBKTConfig } from 'bkt-js-client-sdk'
import { ReactNativeIdGenerator } from '../../src/internal/react_native/IdGenerator'

// Mock dependencies
vi.mock('bkt-js-client-sdk', () => ({
  defineBKTConfig: vi.fn((config) => config),
}))

describe('defineBKTConfigForReactNative', () => {
  it('should call defineBKTConfig with the correct config including ReactNativeIdGenerator', () => {
    const rawConfig = {
      apiKey: 'test-api-key',
      apiEndpoint: 'https://test.bucketeer.io',
      featureTag: 'test-tag',
      appVersion: '1.0.0',
    }

    defineBKTConfigForReactNative(rawConfig)

    expect(defineBKTConfig).toHaveBeenCalledWith(expect.objectContaining({
      ...rawConfig,
      // Should inject ReactNativeIdGenerator
      idGenerator: expect.any(ReactNativeIdGenerator),
    }))
  })
})
