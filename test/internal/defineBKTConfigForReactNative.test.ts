import { describe, it, expect } from 'vitest'
import {
  defineBKTConfigForReactNative,
  REACT_NATIVE_PLACEHOLDER_ID_GENERATOR,
} from '../../src/internal/react_native/defineBKTConfigForReactNative'

const validBaseConfig = {
  apiKey: 'test-api-key',
  apiEndpoint: 'http://test-endpoint',
  appVersion: '1.0.0',
  fetch: globalThis.fetch ?? (() => Promise.resolve(new Response())),
}

describe('defineBKTConfigForReactNative', () => {
  describe('idGenerator handling', () => {
    it('should not require idGenerator in the input config', () => {
      // The native SDK's defineBKTConfig would throw here if called directly.
      // defineBKTConfigForReactNative injects a placeholder to satisfy the guard.
      expect(() => defineBKTConfigForReactNative(validBaseConfig)).not.toThrow()
    })

    it('should always inject the placeholder idGenerator into the returned config', () => {
      const config = defineBKTConfigForReactNative(validBaseConfig)
      expect(config.idGenerator).toBe(REACT_NATIVE_PLACEHOLDER_ID_GENERATOR)
    })

    it('should override any user-provided idGenerator with the placeholder', () => {
      // idGenerator is always managed internally — user-provided values are
      // always overridden by the placeholder, and later by the provider's initialize().
      const customGenerator = { newId: () => 'custom-id' }
      const config = defineBKTConfigForReactNative({
        ...validBaseConfig,
        idGenerator: customGenerator,
      })
      expect(config.idGenerator).toBe(REACT_NATIVE_PLACEHOLDER_ID_GENERATOR)
      expect(config.idGenerator).not.toBe(customGenerator)
    })
  })

  describe('REACT_NATIVE_PLACEHOLDER_ID_GENERATOR', () => {
    it('should throw a descriptive error if newId() is called before initialize()', () => {
      expect(() => REACT_NATIVE_PLACEHOLDER_ID_GENERATOR.newId()).toThrowError(
        /defineBKTConfigForReactNative placeholder idGenerator was called/,
      )
    })

    it('error message should mention that setProvider must be called', () => {
      expect(() => REACT_NATIVE_PLACEHOLDER_ID_GENERATOR.newId()).toThrowError(
        /OpenFeature\.setProvider\(\) is called/,
      )
    })
  })

  describe('required field validation', () => {
    it('should throw when apiKey is missing', () => {
      expect(() =>
        defineBKTConfigForReactNative({ ...validBaseConfig, apiKey: '' }),
      ).toThrowError(/apiKey is required/)
    })

    it('should throw when apiEndpoint is missing', () => {
      expect(() =>
        defineBKTConfigForReactNative({ ...validBaseConfig, apiEndpoint: '' }),
      ).toThrowError(/apiEndpoint is required/)
    })

    it('should throw when apiEndpoint is not a valid URL', () => {
      expect(() =>
        defineBKTConfigForReactNative({ ...validBaseConfig, apiEndpoint: 'not-a-url' }),
      ).toThrowError(/apiEndpoint is invalid/)
    })

    it('should throw when appVersion is missing', () => {
      expect(() =>
        defineBKTConfigForReactNative({ ...validBaseConfig, appVersion: '' }),
      ).toThrowError(/appVersion is required/)
    })
  })

  describe('config field pass-through', () => {
    it('should correctly pass through all provided config fields', () => {
      const config = defineBKTConfigForReactNative({
        ...validBaseConfig,
        featureTag: 'my-tag',
        eventsMaxQueueSize: 200,
        appVersion: '2.0.0',
        userAgent: 'custom-agent',
      })

      expect(config.apiKey).toBe('test-api-key')
      expect(config.apiEndpoint).toBe('http://test-endpoint')
      expect(config.featureTag).toBe('my-tag')
      expect(config.eventsMaxQueueSize).toBe(200)
      expect(config.appVersion).toBe('2.0.0')
      expect(config.userAgent).toBe('custom-agent')
    })

    it('should apply SDK defaults for omitted optional fields', () => {
      const config = defineBKTConfigForReactNative(validBaseConfig)

      expect(config.featureTag).toBe('')
      expect(config.eventsMaxQueueSize).toBe(50)
      // pollingInterval below minimum is clamped to 600000ms
      expect(config.pollingInterval).toBe(600000)
      // eventsFlushInterval below minimum is clamped to 10000ms
      expect(config.eventsFlushInterval).toBe(10000)
    })
  })
})
