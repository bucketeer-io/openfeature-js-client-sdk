import { describe, it, expect, vi, beforeEach, afterEach, suite } from 'vitest'

import { BKTClient, BKTConfig, getBKTClient, initializeBKTClient, defineBKTConfig } from 'bkt-js-client-sdk'
import {
  ClientProviderEvents,
  EvaluationContext,
} from '@openfeature/web-sdk'
import { BucketeerReactNativeProvider } from '../../src/main'
import { SOURCE_ID_OPEN_FEATURE_REACT_NATIVE } from '../../src/internal/BucketeerProvider'
import { BKTAsyncKeyValueStore } from '../../src/internal/react_native/AsyncStorage'


// Only mock specific functions instead of the entire module
vi.mock('bkt-js-client-sdk', async () => {
  const actual = await vi.importActual('bkt-js-client-sdk')
  return {
    ...actual,
    getBKTClient: vi.fn(),
    initializeBKTClient: vi.fn(),
    destroyBKTClient: vi.fn()
  }
})

suite('BucketeerReactNativeProvider', () => {
  let provider: BucketeerReactNativeProvider
  let mockClient: BKTClient
  let mockConfig: BKTConfig
  let mockContext: EvaluationContext

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Create mock objects with all required properties
    mockConfig = defineBKTConfig({
      apiKey: 'test-api-key',
      apiEndpoint: 'http://test-endpoint',
      featureTag: 'test-tag',
      eventsFlushInterval: 30,
      eventsMaxQueueSize: 100,
      pollingInterval: 60,
      appVersion: '1.0.0',
      userAgent: 'test-agent',
      fetch: vi.fn(),
      storageFactory: vi.fn(),
    })

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
    provider = new BucketeerReactNativeProvider(mockConfig)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('metadata', () => {
    it('should have correct metadata', () => {
      expect(provider.metadata.name).toBe('Bucketeer React Provider')
      expect(provider.runsOn).toBe('client')
    })
  })

  describe('initialization', () => {
    it('should successfully initialize the provider', async () => {
      const emitSpy = vi.spyOn(provider.events, 'emit')

      await provider.initialize?.(mockContext)
      const callArgs = vi.mocked(initializeBKTClient).mock.calls[0]
      const expectedConfig = callArgs[0]
      const expectedUser = callArgs[1]

      expect(expectedConfig).toEqual(expectedConfig)
      expect(expectedUser).toEqual({
        id: 'test-user', attributes: {
          email: 'test@example.com',
          role: 'tester'
        }
      })

      expect(emitSpy).toHaveBeenCalledWith(ClientProviderEvents.Ready)

      const { sdkVersion, sourceId } = expectedConfig as unknown as { sdkVersion: string, sourceId: number }
      expect(sourceId).toBeDefined()
      expect(sourceId).toBe(SOURCE_ID_OPEN_FEATURE_REACT_NATIVE)
      expect(sdkVersion).toBeDefined()
      expect(sdkVersion).toBe(__BKT_SDK_VERSION__)

      const storageFactory = expectedConfig.storageFactory
      const store = storageFactory('test-key')
      expect(store).toBeDefined()
      expect(store).toBeInstanceOf(BKTAsyncKeyValueStore)
      // check if store implements BKTStorage interface
      expect(typeof store.set).toBe('function')
      expect(typeof store.get).toBe('function')
      expect(typeof store.clear).toBe('function')
      expect(expectedConfig.apiKey).toBe('test-api-key')
      expect(expectedConfig.apiEndpoint).toBe('http://test-endpoint')
      expect(expectedConfig.featureTag).toBe('test-tag')
      expect(expectedConfig.eventsFlushInterval).toBe(10000)
      expect(expectedConfig.eventsMaxQueueSize).toBe(100)
      expect(expectedConfig.pollingInterval).toBe(600000)
      expect(expectedConfig.appVersion).toBe('1.0.0')
      expect(expectedConfig.userAgent).toBe('Bucketeer React Native Open Feature Provider')
      expect(expectedConfig.fetch).toBeDefined()
      expect(typeof expectedConfig.fetch).toBe('function')
    })
  })
})