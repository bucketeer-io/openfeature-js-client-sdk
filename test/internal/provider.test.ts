import { describe, it, expect, vi, beforeEach, afterEach, suite } from 'vitest'
import BucketeerProvider, { wrongTypeResult } from '../../src/internal/BucketeerProvider'
import { BKTClient, BKTConfig, getBKTClient, initializeBKTClient, destroyBKTClient } from '@bucketeer/js-client-sdk'
import { 
  ClientProviderEvents, 
  EvaluationContext, 
  ErrorCode, 
  InvalidContextError, 
  ProviderFatalError,
  ProviderNotReadyError,
  StandardResolutionReasons 
} from '@openfeature/web-sdk'

// Only mock specific functions instead of the entire module
vi.mock('@bucketeer/js-client-sdk', async () => {
  const actual = await vi.importActual('@bucketeer/js-client-sdk')
  return {
    ...actual,
    getBKTClient: vi.fn(),
    initializeBKTClient: vi.fn(),
    destroyBKTClient: vi.fn()
  }
})

suite('BucketeerProvider', () => {
  let provider: BucketeerProvider
  let mockClient: BKTClient
  let mockConfig: BKTConfig
  let mockContext: EvaluationContext

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Create mock objects with all required properties
    mockConfig = {
      apiKey: 'test-api-key',
      apiEndpoint: 'http://test-endpoint',
      featureTag: 'test-tag',
      eventsFlushInterval: 30,
      eventsMaxQueueSize: 100,
      pollingInterval: 60,
      appVersion: '1.0.0',
      userAgent: 'test-agent',
      fetch: vi.fn(),
      storageFactory: vi.fn()
    }

    mockContext = {
      targetingKey: 'test-user',
      email: 'test@example.com',
      role: 'tester'
    }

    // Create mock client with necessary methods
    mockClient = {
      booleanVariationDetails: vi.fn(),
      stringVariationDetails: vi.fn(),
      numberVariationDetails: vi.fn(),
      objectVariationDetails: vi.fn(),
      currentUser: vi.fn(),
      updateUserAttributes: vi.fn()
    } as unknown as BKTClient

    // Setup mock return value for getBKTClient
    vi.mocked(getBKTClient).mockReturnValue(mockClient)

    // Create provider instance
    provider = new BucketeerProvider(mockConfig)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('metadata', () => {
    it('should have correct metadata', () => {
      expect(provider.metadata.name).toBe('Bucketeer Provider')
      expect(provider.runsOn).toBe('client')
    })
  })

  describe('initialization', () => {
    it('should successfully initialize the provider', async () => {
      const emitSpy = vi.spyOn(provider.events, 'emit')

      await provider.initialize?.(mockContext)

      expect(initializeBKTClient).toHaveBeenCalledWith(mockConfig, {
        id: 'test-user', attributes: {
          email: 'test@example.com',
          role: 'tester'
        }
      })
      expect(emitSpy).toHaveBeenCalledWith(ClientProviderEvents.Ready)
    })

    it('should emit ready event even on timeout exception', async () => {
      vi.mocked(initializeBKTClient).mockRejectedValueOnce(
        Object.assign(new Error('Timeout'), { name: 'TimeoutException' })
      )

      const emitSpy = vi.spyOn(provider.events, 'emit')

      await provider.initialize?.(mockContext)

      expect(emitSpy).toHaveBeenCalledWith(ClientProviderEvents.Ready)
    })

    it('should emit error and throw ProviderFatalError on initialization failure', async () => {
      vi.mocked(initializeBKTClient).mockRejectedValueOnce(new Error('Init failed'))
      
      const emitSpy = vi.spyOn(provider.events, 'emit')
      
      try {
        await provider.initialize?.(mockContext)
        // Should not reach here
        expect.fail('Expected provider.initialize to throw')
      } catch (error) {
        expect(error).toBeInstanceOf(ProviderFatalError)
        expect((error as ProviderFatalError).message).toContain('Failed to initialize Bucketeer client')
        expect(emitSpy).toHaveBeenCalledWith(ClientProviderEvents.Error)
      }
    })

    it('should throw InvalidContextError if context is not provided', async () => {
      try {
        await provider.initialize?.()
        // Should not reach here
        expect.fail('Expected provider.initialize to throw')
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidContextError)
        expect((error as InvalidContextError).message).toBe('context is required')
      }
    })
  })

  describe('flag evaluation methods', () => {
    it('should resolve boolean evaluation', () => {
      vi.mocked(mockClient.booleanVariationDetails).mockReturnValue({
        featureId: 'test-feature',
        featureVersion: 1,
        userId: 'test-user',
        variationId: 'var-id',
        variationValue: true,
        variationName: 'true-variant',
        reason: 'TARGET'
      })

      const result = provider.resolveBooleanEvaluation('test-feature', false, mockContext, console)

      expect(mockClient.booleanVariationDetails).toHaveBeenCalledWith('test-feature', false)
      expect(result).toEqual({
        value: true,
        variant: 'true-variant',
        reason: 'TARGET'
      })
    })

    it('should resolve string evaluation', () => {
      vi.mocked(mockClient.stringVariationDetails).mockReturnValue({
        featureId: 'test-feature',
        featureVersion: 1,
        userId: 'test-user',
        variationId: 'var-id',
        variationValue: 'active',
        variationName: 'active-variant',
        reason: 'RULE'
      })

      const result = provider.resolveStringEvaluation('test-feature', 'default', mockContext, console)

      expect(mockClient.stringVariationDetails).toHaveBeenCalledWith('test-feature', 'default')
      expect(result).toEqual({
        value: 'active',
        variant: 'active-variant',
        reason: 'RULE'
      })
    })

    it('should resolve number evaluation', () => {
      vi.mocked(mockClient.numberVariationDetails).mockReturnValue({
        featureId: 'test-feature',
        featureVersion: 1,
        userId: 'test-user',
        variationId: 'var-id',
        variationValue: 42,
        variationName: 'number-variant',
        reason: 'DEFAULT'
      })

      const result = provider.resolveNumberEvaluation('test-feature', 0, mockContext, console)

      expect(mockClient.numberVariationDetails).toHaveBeenCalledWith('test-feature', 0)
      expect(result).toEqual({
        value: 42,
        variant: 'number-variant',
        reason: 'DEFAULT'
      })
    })

    it('should resolve object evaluation', () => {
      vi.mocked(mockClient.objectVariationDetails).mockReturnValue({
        featureId: 'test-feature',
        featureVersion: 1,
        userId: 'test-user',
        variationId: 'var-id',
        variationValue: { key: 'value' },
        variationName: 'object-variant',
        reason: 'CLIENT'
      })

      const result = provider.resolveObjectEvaluation('test-feature', {}, mockContext, console)

      expect(mockClient.objectVariationDetails).toHaveBeenCalledWith('test-feature', {})
      expect(result).toEqual({
        value: { key: 'value' },
        variant: 'object-variant',
        reason: 'CLIENT'
      })
    })

    it('should handle type mismatch in object evaluation', () => {
      vi.mocked(mockClient.objectVariationDetails).mockReturnValue({
        featureId: 'test-feature',
        featureVersion: 1,
        userId: 'test-user',
        variationId: 'var-id',
        variationValue: 'not-an-object',
        variationName: 'wrong-type-variant',
        reason: 'DEFAULT'
      })

      const defaultValue = { default: true }
      const result = provider.resolveObjectEvaluation('test-feature', defaultValue, mockContext, console)

      expect(result).toEqual({
        value: defaultValue,
        reason: StandardResolutionReasons.ERROR,
        errorCode: ErrorCode.TYPE_MISMATCH,
        errorMessage: 'Expected object but got string'
      })
    })
  })

  describe('context handling', () => {
    it('should update user attributes on context change when user ID is the same', async () => {
      vi.mocked(mockClient.currentUser).mockReturnValue({
        id: 'test-user',
        attributes: {}
      })
      const emitSpy = vi.spyOn(provider.events, 'emit')
      
      const newContext = { 
        targetingKey: 'test-user',
        role: 'admin'
      }
      
      await provider.onContextChange?.(mockContext, newContext)
      
      expect(mockClient.updateUserAttributes).toHaveBeenCalledWith({ role: 'admin' })
      expect(emitSpy).toHaveBeenCalledWith(ClientProviderEvents.Ready)
    })
    
    it('should throw InvalidContextError if user ID is different', async () => {
      vi.mocked(mockClient.currentUser).mockReturnValue({
        id: 'test-user',
        attributes: {}
      })
      const emitSpy = vi.spyOn(provider.events, 'emit')
      
      const differentIdContext = { targetingKey: 'different-user' }
      
      try {
        await provider.onContextChange?.(mockContext, differentIdContext)
        // Should not reach here
        expect.fail('Expected onContextChange to throw')
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidContextError)
        expect((error as InvalidContextError).message).toBe('Changing the targeting_id after initialization is not supported, please reinitialize the provider')
        expect(emitSpy).toHaveBeenCalledWith(ClientProviderEvents.Error)
      }
    })
  })

  describe('utility methods', () => {
    it('should throw ProviderNotReadyError if BKTClient is not initialized', () => {
      vi.mocked(getBKTClient).mockReturnValue(null)
      const emitSpy = vi.spyOn(provider.events, 'emit')
      
      try {
        provider.requiredBKTClient()
        expect.fail('Expected requiredBKTClient to throw')
      } catch (error) {
        expect(error).toBeInstanceOf(ProviderNotReadyError)
        expect((error as ProviderNotReadyError).message).toBe('Bucketeer client is not initialized')
        expect(emitSpy).toHaveBeenCalledWith(ClientProviderEvents.Error)
      }
    })

    it('should destroy client on close', async () => {
      await provider.onClose?.()
      expect(destroyBKTClient).toHaveBeenCalled()
    })

    it('should correctly create wrongTypeResult', () => {
      const result = wrongTypeResult('default', 'Type error')

      expect(result).toEqual({
        value: 'default',
        reason: StandardResolutionReasons.ERROR,
        errorCode: ErrorCode.TYPE_MISMATCH,
        errorMessage: 'Type error'
      })
    })
  })
})
