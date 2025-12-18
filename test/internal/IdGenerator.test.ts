import { describe, beforeEach, it, expect } from 'vitest'
import { ReactNativeIdGenerator } from '../../src/internal/react_native/IdGenerator'


describe('ReactNativeIdGenerator', () => {
  let idGenerator: ReactNativeIdGenerator

  beforeEach(() => {
    idGenerator = new ReactNativeIdGenerator()
  })

  describe('newId', () => {
    it('should generate a valid UUID string', () => {
      const result = idGenerator.newId()

      expect(typeof result).toBe('string')
      expect(result).toBeTruthy()
      expect(result.length).toBeGreaterThan(0)
    })

    it('should generate different UUIDs on subsequent calls', () => {
      const result1 = idGenerator.newId()
      const result2 = idGenerator.newId()
      const result3 = idGenerator.newId()

      expect(result1).not.toBe(result2)
      expect(result2).not.toBe(result3)
      expect(result1).not.toBe(result3)

      // All should be valid strings
      expect(typeof result1).toBe('string')
      expect(typeof result2).toBe('string')
      expect(typeof result3).toBe('string')
    })

    it('should generate UUIDs that match UUID v4 format', () => {
      const result = idGenerator.newId()

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      // where x is any hexadecimal digit and y is one of 8, 9, A, or B
      const uuidV4Regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

      expect(result).toMatch(uuidV4Regex)
    })

    it('should handle multiple instances independently', () => {
      const idGenerator1 = new ReactNativeIdGenerator()
      const idGenerator2 = new ReactNativeIdGenerator()

      const result1 = idGenerator1.newId()
      const result2 = idGenerator2.newId()

      expect(result1).not.toBe(result2)
      expect(typeof result1).toBe('string')
      expect(typeof result2).toBe('string')
    })

    it('should generate unique IDs across many calls', () => {
      const generatedIds = new Set<string>()
      const numberOfIds = 100

      for (let i = 0; i < numberOfIds; i++) {
        const id = idGenerator.newId()
        expect(generatedIds.has(id)).toBe(false) // Should not have duplicates
        generatedIds.add(id)
      }

      expect(generatedIds.size).toBe(numberOfIds)
    })
  })
})
