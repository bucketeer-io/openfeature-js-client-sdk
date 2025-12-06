import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BKTAsyncStorageError, BKTAsyncKeyValueStore } from '../../src/internal/react_native/AsyncStorage'

/**
 * UNIT TESTS for BKTAsyncKeyValueStore and BKTAsyncStorageError
 *
 * Purpose: Test the business logic and behavior of storage classes using
 * the mocked AsyncStorage from React Native.
 *
 * These tests verify:
 * 1. Data storage, retrieval, and serialization logic
 * 2. Error handling for various failure scenarios
 * 3. Support for different data types (string, number, object, array)
 * 4. Edge cases (null values, invalid JSON, storage failures)
 * 5. BKTAsyncStorageError class behavior
 */

// Mock AsyncStorage interface
const mockAsyncStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}

describe('BKTAsyncStorageError', () => {
  it('should create error with correct properties', () => {
    const error = new BKTAsyncStorageError('Test message', 'test-key', 'set')

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('BKTAsyncStorageError')
    expect(error.message).toBe('Test message')
    expect(error.key).toBe('test-key')
    expect(error.operation).toBe('set')
  })
})

describe('BKTAsyncKeyValueStore', () => {
  let store: BKTAsyncKeyValueStore<unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    store = new BKTAsyncKeyValueStore('test-key', mockAsyncStorage)
  })

  describe('set method', () => {
    it('should store string values correctly', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined)

      await store.set('test-value')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('test-key', '"test-value"')
    })

    it('should store number values correctly', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined)

      await store.set(42)

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('test-key', '42')
    })

    it('should store object values correctly', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined)
      const obj = { id: 1, name: 'test' }

      await store.set(obj)

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(obj))
    })

    it('should store array values correctly', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined)
      const arr = [1, 2, 3]

      await store.set(arr)

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(arr))
    })

    it('should store null values by removing the item', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue(undefined)

      await store.set(null)

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('test-key')
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled()
    })

    it('should throw BKTAsyncStorageError when setItem fails', async () => {
      const error = new Error('Storage full')
      mockAsyncStorage.setItem.mockRejectedValue(error)

      await expect(store.set('test-value')).rejects.toThrow(BKTAsyncStorageError)
      
      try {
        await store.set('test-value')
      } catch (e: any) {
        expect(e).toBeInstanceOf(BKTAsyncStorageError)
        expect(e.key).toBe('test-key')
        expect(e.operation).toBe('set')
        expect(e.message).toContain('Storage full')
      }
    })

    it('should throw BKTAsyncStorageError when removeItem fails for null value', async () => {
      const error = new Error('Remove failed')
      mockAsyncStorage.removeItem.mockRejectedValue(error)

      await expect(store.set(null)).rejects.toThrow(BKTAsyncStorageError)
      
      try {
        await store.set(null)
      } catch (e: any) {
        expect(e).toBeInstanceOf(BKTAsyncStorageError)
        expect(e.key).toBe('test-key')
        expect(e.operation).toBe('set')
        expect(e.message).toContain('Remove failed')
      }
    })

    it('should handle non-Error exceptions', async () => {
      mockAsyncStorage.setItem.mockRejectedValue('String error')

      await expect(store.set('test-value')).rejects.toThrow(BKTAsyncStorageError)
      
      try {
        await store.set('test-value')
      } catch (e: any) {
        expect(e).toBeInstanceOf(BKTAsyncStorageError)
        expect(e.message).toContain('String error')
      }
    })
  })

  describe('get method', () => {
    it('should retrieve string values correctly', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('"test-value"')

      const result = await store.get()

      expect(result).toBe('test-value')
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('test-key')
    })

    it('should retrieve number values correctly', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('42')

      const result = await store.get()

      expect(result).toBe(42)
    })

    it('should retrieve object values correctly', async () => {
      const obj = { id: 1, name: 'test' }
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(obj))

      const result = await store.get()

      expect(result).toEqual(obj)
    })

    it('should retrieve array values correctly', async () => {
      const arr = [1, 2, 3]
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(arr))

      const result = await store.get()

      expect(result).toEqual(arr)
    })

    it('should return null when no value is stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null)

      const result = await store.get()

      expect(result).toBeNull()
    })

    it('should throw BKTAsyncStorageError when getItem fails', async () => {
      const error = new Error('Storage unavailable')
      mockAsyncStorage.getItem.mockRejectedValue(error)

      await expect(store.get()).rejects.toThrow(BKTAsyncStorageError)
      
      try {
        await store.get()
      } catch (e: any) {
        expect(e).toBeInstanceOf(BKTAsyncStorageError)
        expect(e.key).toBe('test-key')
        expect(e.operation).toBe('get')
        expect(e.message).toContain('Storage unavailable')
      }
    })

    it('should throw BKTAsyncStorageError when JSON parsing fails', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json')

      await expect(store.get()).rejects.toThrow(BKTAsyncStorageError)
      
      try {
        await store.get()
      } catch (e: any) {
        expect(e).toBeInstanceOf(BKTAsyncStorageError)
        expect(e.key).toBe('test-key')
        expect(e.operation).toBe('get')
      }
    })

    it('should include JSON parsing error in message', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('{invalid json')

      await expect(store.get()).rejects.toThrow(BKTAsyncStorageError)
      
      try {
        await store.get()
      } catch (e: any) {
        expect(e.message).toContain('Failed to get value for key "test-key"')
        // The exact error message depends on the JS engine, but it should be a SyntaxError
        // Node 20: "Expected property name or '}' in JSON at position 1" or similar
        // We just check that it contains the prefix we added
      }
    })
  })

  describe('clear method', () => {
    it('should call removeItem with correct key', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue(undefined)

      await store.clear()

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('test-key')
    })

    it('should throw BKTAsyncStorageError when removeItem fails', async () => {
      const error = new Error('Clear failed')
      mockAsyncStorage.removeItem.mockRejectedValue(error)

      await expect(store.clear()).rejects.toThrow(BKTAsyncStorageError)
      
      try {
        await store.clear()
      } catch (e: any) {
        expect(e).toBeInstanceOf(BKTAsyncStorageError)
        expect(e.key).toBe('test-key')
        expect(e.operation).toBe('clear')
        expect(e.message).toContain('Clear failed')
      }
    })

    it('should handle non-Error exceptions in clear', async () => {
      mockAsyncStorage.removeItem.mockRejectedValue('String error')

      await expect(store.clear()).rejects.toThrow(BKTAsyncStorageError)
      
      try {
        await store.clear()
      } catch (e: any) {
        expect(e).toBeInstanceOf(BKTAsyncStorageError)
        expect(e.message).toContain('String error')
      }
    })
  })

  describe('generic type support', () => {
    it('should work with string types', async () => {
      const stringStore = new BKTAsyncKeyValueStore<string>('string-key', mockAsyncStorage)
      mockAsyncStorage.setItem.mockResolvedValue(undefined)
      mockAsyncStorage.getItem.mockResolvedValue('"hello"')

      await stringStore.set('hello')
      const result = await stringStore.get()

      expect(result).toBe('hello')
    })

    it('should work with number types', async () => {
      const numberStore = new BKTAsyncKeyValueStore<number>('number-key', mockAsyncStorage)
      mockAsyncStorage.setItem.mockResolvedValue(undefined)
      mockAsyncStorage.getItem.mockResolvedValue('123')

      await numberStore.set(123)
      const result = await numberStore.get()

      expect(result).toBe(123)
    })

    it('should work with complex object types', async () => {
      interface User {
        id: number
        name: string
        preferences: string[]
      }

      const userStore = new BKTAsyncKeyValueStore<User>('user-key', mockAsyncStorage)
      const user: User = { id: 1, name: 'John', preferences: ['dark-mode', 'notifications'] }

      mockAsyncStorage.setItem.mockResolvedValue(undefined)
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(user))

      await userStore.set(user)
      const result = await userStore.get()

      expect(result).toEqual(user)
    })
  })

  describe('instance isolation', () => {
    it('should create independent instances with different keys', () => {
      const store1 = new BKTAsyncKeyValueStore('key1', mockAsyncStorage)
      const store2 = new BKTAsyncKeyValueStore('key2', mockAsyncStorage)

      expect(store1).not.toBe(store2)
    })
  })
})
