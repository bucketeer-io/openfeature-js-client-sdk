// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createReactNativeStorageFactory } from '../../../src/internal/react_native/AsyncStorageFactory'

/**
 * INTEGRATION TESTS for createReactNativeStorageFactory
 *
 * Purpose: Test the factory function that creates storage instances for React Native
 * without mocking the underlying storage module.
 *
 * Why this works without mocks:
 * 1. The @react-native-async-storage/async-storage package is included in devDependencies.
 * 2. Vitest is able to resolve and dynamically import the actual package from node_modules.
 * 3. Both @react-native-async-storage/async-storage and our wrapper are universal/isomorphic,
 *    meaning they can run in a web/DOM environment as well as React Native.
 * 4. We use the 'happy-dom' environment to provide the necessary browser globals (like window)
 *    that the library expects, allowing us to verify the real implementation logic.
 */
describe('createReactNativeStorageFactory (Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  describe('storage instance behavior', () => {
    it('should allow storage instances to be used independently', async () => {
      const factory = await createReactNativeStorageFactory()
      if (!factory) {
        throw new Error('Factory should not be undefined')
      }

      const store1 = factory<string>('key1')
      const store2 = factory<number>('key2')

      // Both instances should be functional
      expect(store1).toBeDefined()
      expect(store2).toBeDefined()

      // They should have independent keys
      expect(store1).not.toBe(store2)
    })

    it('should create new instances each time factory is called', async () => {
      const factory = await createReactNativeStorageFactory()
      if (!factory) {
        throw new Error('Factory should not be undefined')
      }

      const store1 = factory('same-key')
      const store2 = factory('same-key')

      // Even with the same key, they should be different instances
      expect(store1).not.toBe(store2)
    })

    it('should be able to store and retrieve values from the real storage', async () => {
      const factory = await createReactNativeStorageFactory()
      if (!factory) {
        throw new Error('Factory should not be undefined')
      }

      const store = factory<string>('test-integration-key')
      
      // Test setting a value
      await store.set('hello-world')

      // Test getting a value
      const value = await store.get()
      expect(value).toBe('hello-world')
      
      // Test clearing a value
      await store.clear()
      const clearedValue = await store.get()
      expect(clearedValue).toBeNull()
    })
  })
})
