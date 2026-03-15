import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('createReactNativeIdGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  describe('when react-native-uuid is available', () => {
    it('should return a generator instance with newId method that calls uuid.v4', async () => {
      const expectedId = 'mocked-uuid-1234-5678'
      const v4Mock = vi.fn().mockReturnValue(expectedId)
      
      vi.doMock('react-native-uuid', () => {
        return {
          default: {
            v4: v4Mock,
          },
        }
      })

      const { createReactNativeIdGenerator } = await import('../../src/internal/react_native/IdGeneratorFactory')
      const generator = await createReactNativeIdGenerator()
      
      expect(generator).toBeDefined()
      expect(typeof generator?.newId).toBe('function')
      
      if (generator) {
        const id = generator.newId()
        expect(v4Mock).toHaveBeenCalledTimes(1)
        expect(id).toBe(expectedId)
      }

      vi.doUnmock('react-native-uuid')
    })
  })

  describe('when react-native-uuid is not available', () => {
    it('should return undefined when import fails', async () => {
      vi.doMock('react-native-uuid', () => {
        throw new Error('Module not found')
      })

      const { createReactNativeIdGenerator } = await import('../../src/internal/react_native/IdGeneratorFactory')
      const generator = await createReactNativeIdGenerator()

      expect(generator).toBeUndefined()

      vi.doUnmock('react-native-uuid')
    })

    it('should return undefined when react-native-uuid default export is missing', async () => {
      vi.doMock('react-native-uuid', () => ({
        default: undefined
      }))

      const { createReactNativeIdGenerator } = await import('../../src/internal/react_native/IdGeneratorFactory')
      const generator = await createReactNativeIdGenerator()

      expect(generator).toBeUndefined()
      
      vi.doUnmock('react-native-uuid')
    })
  })
})
