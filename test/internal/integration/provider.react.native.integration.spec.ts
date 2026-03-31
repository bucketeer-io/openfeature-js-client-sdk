// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineBKTConfig } from '@bucketeer/js-client-sdk'
import { ProviderFatalError } from '@openfeature/web-sdk'
import { BucketeerReactNativeProvider } from '../../../src/internal/react_native/BucketeerReactNativeProvider'
import { defineBKTConfigForReactNative } from '../../../src/internal/react_native/defineBKTConfigForReactNative'

/**
 * INTEGRATION TESTS for BucketeerReactNativeProvider config paths
 *
 * Purpose: Verify end-to-end initialization behavior for both the standard path
 * (defineBKTConfigForReactNative) and the advanced path (defineBKTConfig with custom idGenerator),
 * using the real react-native-uuid module without mocking IdGeneratorFactory.
 *
 * Why this works without mocks:
 * 1. react-native-uuid is a pure JavaScript module that works in any JS environment.
 * 2. Vitest resolves it from devDependencies, same as a real React Native app would.
 * 3. @bucketeer/js-client-sdk initializeBKTClient is mocked only to prevent real network calls.
 *
 * These tests live in test/internal/integration/ so they run in the browser/DOM
 * Vitest environment and are excluded from the Node test run, consistent with the
 * existing integration test convention.
 */

vi.mock('@bucketeer/js-client-sdk', async () => {
  const actual = await vi.importActual('@bucketeer/js-client-sdk')
  return {
    ...actual,
    initializeBKTClient: vi.fn().mockResolvedValue(undefined),
    getBKTClient: vi.fn(),
    destroyBKTClient: vi.fn(),
  }
})

const validRawConfig = {
  apiKey: 'test-api-key',
  apiEndpoint: 'http://test-endpoint',
  appVersion: '1.0.0',
  fetch: globalThis.fetch ?? (() => Promise.resolve(new Response())),
}

const mockContext = {
  targetingKey: 'test-user',
}

describe('BucketeerReactNativeProvider — config path integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('standard path: defineBKTConfigForReactNative', () => {
    it('should initialize successfully with real react-native-uuid as idGenerator', async () => {
      const config = defineBKTConfigForReactNative(validRawConfig)
      const provider = new BucketeerReactNativeProvider(config)

      // Should not throw — provider loads real react-native-uuid during initialize()
      await expect(provider.initialize?.(mockContext)).resolves.not.toThrow()
    })

    it('should inject a real UUID-generating idGenerator after initialize()', async () => {
      const { initializeBKTClient } = await import('@bucketeer/js-client-sdk')

      const config = defineBKTConfigForReactNative(validRawConfig)
      const provider = new BucketeerReactNativeProvider(config)
      await provider.initialize?.(mockContext)

      const actualConfig = vi.mocked(initializeBKTClient).mock.calls[0][0]
      expect(actualConfig.idGenerator).toBeDefined()
      expect(typeof actualConfig.idGenerator?.newId).toBe('function')

      const id = actualConfig.idGenerator?.newId()
      expect(typeof id).toBe('string')
      expect(id!.length).toBeGreaterThan(0)

      // Should look like a valid UUID v4
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(id).toMatch(uuidV4Regex)
    })

    it('should throw ProviderFatalError when react-native-uuid is not available', async () => {
      // Simulate missing react-native-uuid by stubbing the factory to return undefined
      vi.doMock('../../../src/internal/react_native/IdGeneratorFactory', () => ({
        createReactNativeIdGenerator: vi.fn().mockResolvedValue(undefined),
      }))
      vi.resetModules()

      const { BucketeerReactNativeProvider: FreshProvider } = await import(
        '../../../src/internal/react_native/BucketeerReactNativeProvider'
      )
      const { defineBKTConfigForReactNative: freshDefine } = await import(
        '../../../src/internal/react_native/defineBKTConfigForReactNative'
      )

      const config = freshDefine(validRawConfig)
      const provider = new FreshProvider(config)

      await expect(provider.initialize?.(mockContext)).rejects.toThrow(ProviderFatalError)

      vi.doUnmock('../../../src/internal/react_native/IdGeneratorFactory')
    })
  })

  describe('advanced path: defineBKTConfig with custom idGenerator', () => {
    it('should NOT throw at config time in non-RN environments but WOULD throw in React Native bundles', () => {
      // In a React Native bundle, @bucketeer/js-client-sdk resolves to main.native.ts
      // which enforces idGenerator via a runtime guard. In the Node/browser test environment,
      // it resolves to the base entry which does NOT require idGenerator.
      // defineBKTConfigForReactNative exists to protect users who call it in React Native
      // from hitting this guard — it injects the placeholder so the guard is always satisfied.
      //
      // This test documents that without defineBKTConfigForReactNative, the user would need
      // to provide their own idGenerator when using defineBKTConfig in a React Native app.
      expect(() => defineBKTConfig(validRawConfig)).not.toThrow()
    })

    it('should initialize successfully when a custom idGenerator is provided to defineBKTConfig', async () => {
      const { initializeBKTClient } = await import('@bucketeer/js-client-sdk')

      const customIdCount = { count: 0 }
      const customGenerator = {
        newId: () => `custom-id-${++customIdCount.count}`,
      }

      const config = defineBKTConfig({
        ...validRawConfig,
        idGenerator: customGenerator,
      })
      const provider = new BucketeerReactNativeProvider(config)
      await provider.initialize?.(mockContext)

      // The provider always replaces idGenerator with react-native-uuid internally.
      // The custom generator is NOT preserved — idGenerator is an internal concern.
      const actualConfig = vi.mocked(initializeBKTClient).mock.calls[0][0]
      expect(actualConfig.idGenerator).toBeDefined()
      expect(actualConfig.idGenerator).not.toBe(customGenerator)

      // The real react-native-uuid generator should be used instead
      const id = actualConfig.idGenerator?.newId()
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(id).toMatch(uuidV4Regex)
    })
  })
})
