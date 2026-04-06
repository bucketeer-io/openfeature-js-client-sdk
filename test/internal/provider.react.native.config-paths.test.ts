// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initializeBKTClient } from '@bucketeer/js-client-sdk'
import { ProviderFatalError } from '@openfeature/web-sdk'
import { BucketeerReactNativeProvider } from '../../src/internal/react_native/BucketeerReactNativeProvider'
import { defineBKTConfigForReactNative } from '../../src/internal/react_native/defineBKTConfigForReactNative'
import { createReactNativeIdGenerator } from '../../src/internal/react_native/IdGeneratorFactory'

vi.mock('@bucketeer/js-client-sdk', async () => {
  const actual = await vi.importActual('@bucketeer/js-client-sdk')
  return {
    ...actual,
    initializeBKTClient: vi.fn(),
    getBKTClient: vi.fn(),
    destroyBKTClient: vi.fn(),
  }
})

vi.mock('../../src/internal/react_native/IdGeneratorFactory', () => ({
  createReactNativeIdGenerator: vi.fn(),
}))

vi.mock('../../src/internal/react_native/AsyncStorageFactory', () => ({
  createReactNativeStorageFactory: vi.fn().mockResolvedValue(vi.fn()),
}))

const validRawConfig = {
  apiKey: 'test-api-key',
  apiEndpoint: 'http://test-endpoint',
  appVersion: '1.0.0',
  fetch: globalThis.fetch ?? (() => Promise.resolve(new Response())),
}

const mockContext = {
  targetingKey: 'test-user',
}

describe('BucketeerReactNativeProvider — config paths', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(initializeBKTClient).mockResolvedValue(undefined)
  })

  describe('standard path: defineBKTConfigForReactNative', () => {
    it('should initialize successfully when idGenerator is available', async () => {
      const mockIdGenerator = { newId: () => 'mock-id' }
      vi.mocked(createReactNativeIdGenerator).mockResolvedValue(mockIdGenerator)

      const config = defineBKTConfigForReactNative(validRawConfig)
      const provider = new BucketeerReactNativeProvider(config)
      await provider.initialize?.(mockContext)

      const actualConfig = vi.mocked(initializeBKTClient).mock.calls[0][0]
      expect(actualConfig.idGenerator).toBe(mockIdGenerator)
    })

    it('should throw ProviderFatalError when idGenerator is missing', async () => {
      vi.mocked(createReactNativeIdGenerator).mockResolvedValue(undefined)

      const config = defineBKTConfigForReactNative(validRawConfig)
      const provider = new BucketeerReactNativeProvider(config)

      await expect(provider.initialize?.(mockContext)).rejects.toThrow(ProviderFatalError)
    })
  })
})
