import { describe, it, expect, vi, beforeEach, afterEach, suite } from 'vitest'

import { BKTClient, BKTConfig, getBKTClient, initializeBKTClient, defineBKTConfig } from 'bkt-js-client-sdk'
import {
  ClientProviderEvents,
  EvaluationContext,
} from '@openfeature/web-sdk'
import { BucketeerReactProvider } from '../../src/main'
import { SOURCE_ID_OPEN_FEATURE_REACT } from '../../src/internal/BucketeerProvider'


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

suite('BucketeerReactProvider', () => {
  let provider: BucketeerReactProvider
  let mockClient: BKTClient
  let mockConfig: BKTConfig
  let expectedConfig: BKTConfig
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

    expectedConfig = defineBKTConfig({
      ...mockConfig,
      wrapperSdkVersion: __BKT_SDK_VERSION__,
      wrapperSdkSourceId: SOURCE_ID_OPEN_FEATURE_REACT
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
    provider = new BucketeerReactProvider(mockConfig)
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

      expect(initializeBKTClient).toHaveBeenCalledWith(expectedConfig, {
        id: 'test-user', attributes: {
          email: 'test@example.com',
          role: 'tester'
        }
      })
      expect(emitSpy).toHaveBeenCalledWith(ClientProviderEvents.Ready)

      const { sdkVersion, sourceId } = expectedConfig as unknown as { sdkVersion: string, sourceId: number }
      expect(sourceId).toBeDefined()
      expect(sourceId).toBe(SOURCE_ID_OPEN_FEATURE_REACT)
      expect(sdkVersion).toBeDefined()
      expect(sdkVersion).toBe(__BKT_SDK_VERSION__)
    })
  })
})