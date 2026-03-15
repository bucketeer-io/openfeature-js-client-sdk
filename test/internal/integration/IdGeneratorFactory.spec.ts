import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createReactNativeIdGenerator } from '../../../src/internal/react_native/IdGeneratorFactory'

/**
 * INTEGRATION TESTS for createReactNativeIdGenerator
 *
 * Purpose: Test the factory function that creates ID generator instances for React Native
 * without mocking the underlying UUID module.
 *
 * Why this works without mocks:
 * 1. The react-native-uuid package is included in devDependencies.
 * 2. Vitest is able to resolve and dynamically import the actual package from node_modules.
 * 3. The react-native-uuid library is universal/isomorphic and works in standard JavaScript 
 *    environments (Node/Web) without requiring a real React Native runtime.
 */
describe('createReactNativeIdGenerator (Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  describe('generator instance behavior', () => {
    it('should generate valid UUIDs using the real react-native-uuid module', async () => {
      const generator = await createReactNativeIdGenerator()
      
      expect(generator).toBeDefined()
      expect(typeof generator?.newId).toBe('function')
      
      if (generator) {
        const id1 = generator.newId()
        const id2 = generator.newId()
        
        // Ensure it's returning strings
        expect(typeof id1).toBe('string')
        expect(typeof id2).toBe('string')
        
        // Ensure they are not empty
        expect(id1.length).toBeGreaterThan(0)
        
        // Ensure consecutive calls generate unique IDs
        expect(id1).not.toBe(id2)
        
        // Ensure it looks like a valid UUID (optional, but good for confidence)
        const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        expect(id1).toMatch(uuidV4Regex)
      }
    })
  })
})
