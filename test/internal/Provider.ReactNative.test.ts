import { describe, it, expect, vi, beforeEach, afterEach, suite } from 'vitest'

import { BKTClient, BKTConfig, getBKTClient, initializeBKTClient } from '@bucketeer/js-client-sdk'
import {
  ClientProviderEvents,
  EvaluationContext,
} from '@openfeature/web-sdk'
import { BucketeerReactNativeProvider, defineBKTConfigForReactNative, SDK_VERSION } from '../../src/main'
import { SOURCE_ID_OPEN_FEATURE_REACT_NATIVE } from '../../src/internal/BucketeerProvider'
import { BKTAsyncKeyValueStore } from '../../src/internal/react_native/AsyncStorage'
import { ReactNativeIdGenerator } from '../../src/internal/react_native/IdGenerator'

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

suite('BucketeerReactNativeProvider', () => {
  let provider: BucketeerReactNativeProvider
  let mockClient: BKTClient
  let mockConfig: BKTConfig
  let mockContext: EvaluationContext

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Create mock objects with all required properties
    mockConfig = defineBKTConfigForReactNative({
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
      expect(provider.metadata.name).toBe('Bucketeer React Native Provider')
      expect(provider.runsOn).toBe('client')
      expect(provider.metadata.version).equal(SDK_VERSION)
    })
  })

  describe('initialization', () => {
    it('should successfully initialize the provider', async () => {
      const emitSpy = vi.spyOn(provider.events, 'emit')

      await provider.initialize?.(mockContext)
      const callArgs = vi.mocked(initializeBKTClient).mock.calls[0]
      const actualConfig = callArgs[0]
      const actualUser = callArgs[1]

      expect(emitSpy).toHaveBeenCalledWith(ClientProviderEvents.Ready)

      expect(actualUser).toEqual({
        id: 'test-user', attributes: {
          email: 'test@example.com',
          role: 'tester'
        }
      })

      const { sdkVersion, sourceId } = actualConfig as unknown as { sdkVersion: string, sourceId: number }
      expect(sourceId).toBeDefined()
      expect(sourceId).toBe(SOURCE_ID_OPEN_FEATURE_REACT_NATIVE)
      expect(sdkVersion).toBeDefined()
      expect(sdkVersion).toBe(SDK_VERSION)

      const storageFactory = actualConfig.storageFactory
      const store = storageFactory('test-key')
      expect(store).toBeDefined()
      expect(store).toBeInstanceOf(BKTAsyncKeyValueStore)
      // check if store implements BKTStorage interface
      expect(typeof store.set).toBe('function')
      expect(typeof store.get).toBe('function')
      expect(typeof store.clear).toBe('function')
      expect(actualConfig.apiKey).toBe('test-api-key')
      expect(actualConfig.apiEndpoint).toBe('http://test-endpoint')
      expect(actualConfig.featureTag).toBe('test-tag')
      expect(actualConfig.eventsFlushInterval).toBe(10000)
      expect(actualConfig.eventsMaxQueueSize).toBe(100)
      expect(actualConfig.pollingInterval).toBe(600000)
      expect(actualConfig.appVersion).toBe('1.0.0')
      expect(actualConfig.userAgent).toBe('Bucketeer React Native Provider')
      expect(actualConfig.fetch).toBeDefined()
      expect(actualConfig.idGenerator).toBeDefined()
      expect(actualConfig.idGenerator).instanceOf(ReactNativeIdGenerator)
      expect(typeof actualConfig.fetch).toBe('function')
    })
  })
})