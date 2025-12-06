import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createReactNativeStorageFactory } from '../../src/internal/react_native/AsyncStorageFactory'

/**
 * UNIT TESTS for createReactNativeStorageFactory
 *
 * Purpose: Test the factory function that creates storage instances for React Native.
 *
 * These tests verify:
 * 1. Factory creation when AsyncStorage is available
 * 2. Factory returns storage instances with correct interface
 * 3. Factory handles missing AsyncStorage gracefully
 * 4. Multiple storage instances can be created with different keys
 * 5. Console warnings are shown when AsyncStorage is unavailable
 */

describe('createReactNativeStorageFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  describe('when AsyncStorage is available', () => {
    it('should return a factory function', async () => {
      const factory = await createReactNativeStorageFactory()
      expect(typeof factory).toBe('function')
    })

    it('should create storage instances with correct methods', async () => {
      const factory = await createReactNativeStorageFactory()
      if (!factory) {
        throw new Error('Factory should not be undefined')
      }

      const store = factory('test-key')
      expect(store).toBeDefined()
      expect(typeof store.set).toBe('function')
      expect(typeof store.get).toBe('function')
      expect(typeof store.clear).toBe('function')
    })

    it('should create multiple storage instances with different keys', async () => {
      const factory = await createReactNativeStorageFactory()
      if (!factory) {
        throw new Error('Factory should not be undefined')
      }

      const store1 = factory('key1')
      const store2 = factory('key2')

      expect(store1).toBeDefined()
      expect(store2).toBeDefined()
      expect(store1).not.toBe(store2)
    })

    it('should create storage instances with generic type support', async () => {
      const factory = await createReactNativeStorageFactory()
      if (!factory) {
        throw new Error('Factory should not be undefined')
      }

      interface TestData {
        id: string
        value: number
      }

      const stringStore = factory<string>('string-key')
      const objectStore = factory<TestData>('object-key')
      const arrayStore = factory<string[]>('array-key')

      expect(stringStore).toBeDefined()
      expect(objectStore).toBeDefined()
      expect(arrayStore).toBeDefined()
    })
  })

  describe('when AsyncStorage is not available', () => {
    it('should return undefined and show warning when import fails', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Mock the dynamic import to throw an error
      vi.doMock('@react-native-async-storage/async-storage', () => {
        throw new Error('Module not found')
      })

      // Re-import the factory function with the mock in place
      const { createReactNativeStorageFactory: mockedFactory } = await import(
        '../../src/internal/react_native/AsyncStorageFactory'
      )

      const factory = await mockedFactory()

      expect(factory).toBeUndefined()
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('AsyncStorage is not available')
      )
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('@react-native-async-storage/async-storage is not installed')
      )
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('pod install')
      )

      consoleWarnSpy.mockRestore()
      vi.doUnmock('@react-native-async-storage/async-storage')
    })

    it('should return undefined when AsyncStorage default export is missing', async () => {
      // Mock the module to return an object without default export
      vi.doMock('@react-native-async-storage/async-storage', () => ({
        default: null
      }))

      // Re-import the factory function with the mock in place
      const { createReactNativeStorageFactory: mockedFactory } = await import(
        '../../src/internal/react_native/AsyncStorageFactory'
      )

      const factory = await mockedFactory()

      expect(factory).toBeUndefined()
      
      vi.doUnmock('@react-native-async-storage/async-storage')
    })
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
  })
})
