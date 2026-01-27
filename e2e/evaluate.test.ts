import { suite, test, expect, beforeEach, afterEach, afterAll } from 'vitest'
import { defineBKTConfig, BKTConfig } from '@bucketeer/js-client-sdk'
import {
  EvaluationDetails,
  JsonValue,
  OpenFeature,
  ProviderStatus,
} from '@openfeature/web-sdk'
import { BucketeerProvider, SDK_VERSION } from '../dist/main'
import {
  FEATURE_ID_BOOLEAN,
  FEATURE_ID_DOUBLE,
  FEATURE_ID_INT,
  FEATURE_ID_JSON,
  FEATURE_ID_STRING,
  FEATURE_TAG,
  USER_ID,
} from './constants'

suite('BucketeerProvider - evaluation', () => {
  let config: BKTConfig
  afterAll(() => {
    OpenFeature.close()
  })

  afterEach(async () => {
    await OpenFeature.clearProviders()
    await OpenFeature.clearContext()
    localStorage.clear()
  })

  beforeEach(async () => {
    config = defineBKTConfig({
      apiEndpoint: import.meta.env.VITE_BKT_API_ENDPOINT,
      apiKey: import.meta.env.VITE_BKT_API_KEY,
      featureTag: FEATURE_TAG,
      appVersion: '1.2.3',
      fetch: window.fetch,
    })

    const context = {
      targetingKey: USER_ID,
      app_version: '1.2.3',
    }

    await OpenFeature.setContext(context)
    const provider = new BucketeerProvider(config)
    await OpenFeature.setProviderAndWait(provider)

    const client = OpenFeature.getClient()
    expect(client.metadata.providerMetadata.name).equal('Bucketeer Provider')
    expect(client.providerStatus).equal(ProviderStatus.READY)
    // Check that SDK_VERSION is defined
    expect(SDK_VERSION).not.toBeUndefined()
    expect(SDK_VERSION).toMatch(/^\d+\.\d+\.\d+(-.+)?$/)
    expect(client.metadata.providerMetadata.version).equal(SDK_VERSION)
  })

  suite('evaluation', () => {
    test('boolean evaluation', async () => {
      const client = OpenFeature.getClient()
      const result = client.getBooleanValue(FEATURE_ID_BOOLEAN, false)
      expect(result).to.be.a('boolean')
      expect(result).to.equal(true)

      const resultDetails = client.getBooleanDetails(FEATURE_ID_BOOLEAN, false)
      expect(resultDetails).to.be.an('object')
      expect(resultDetails).toStrictEqual({
        flagKey: FEATURE_ID_BOOLEAN,
        flagMetadata: {},
        reason: 'DEFAULT',
        value: true,
        variant: 'variation true',
      } satisfies EvaluationDetails<boolean>)
    })

    test('string evaluation', async () => {
      const client = OpenFeature.getClient()
      const result = client.getStringValue(FEATURE_ID_STRING, 'default')
      expect(result).to.be.a('string')
      expect(result).to.equal('value-1')

      const resultDetails = client.getStringDetails(
        FEATURE_ID_STRING,
        'default',
      )
      expect(resultDetails).to.be.an('object')
      expect(resultDetails).toStrictEqual({
        flagKey: FEATURE_ID_STRING,
        flagMetadata: {},
        reason: 'DEFAULT',
        value: 'value-1',
        variant: 'variation 1',
      } satisfies EvaluationDetails<string>)
    })

    test('int evaluation', async () => {
      const client = OpenFeature.getClient()
      const result = client.getNumberValue(FEATURE_ID_INT, 0)
      expect(result).to.be.a('number')
      expect(result).to.equal(10)

      const resultDetails = client.getNumberDetails(FEATURE_ID_INT, 0)
      expect(resultDetails).to.be.an('object')
      expect(resultDetails).toStrictEqual({
        flagKey: FEATURE_ID_INT,
        flagMetadata: {},
        reason: 'DEFAULT',
        value: 10,
        variant: 'variation 10',
      } satisfies EvaluationDetails<number>)
    })

    test('double evaluation', async () => {
      const client = OpenFeature.getClient()
      const result = client.getNumberValue(FEATURE_ID_DOUBLE, 0.0)
      expect(result).to.be.a('number')
      expect(result).to.equal(2.1)

      const resultDetails = client.getNumberDetails(FEATURE_ID_DOUBLE, 0.0)
      expect(resultDetails).to.be.an('object')
      expect(resultDetails).toStrictEqual({
        flagKey: FEATURE_ID_DOUBLE,
        flagMetadata: {},
        reason: 'DEFAULT',
        value: 2.1,
        variant: 'variation 2.1',
      } satisfies EvaluationDetails<number>)
    })

    // We don't have an e2e array flag set up in the Bucketeer test backend yet; we’ll add it when one is available.
    // For now, we test getting object from a plain object flag
    test('object evaluation', async () => {
      const client = OpenFeature.getClient()
      const result = client.getObjectValue(FEATURE_ID_JSON, {
        default: 'value',
      })
      expect(result).to.be.an('object')
      expect(result).to.deep.equal({ key: 'value-1' })

      const resultDetails = client.getObjectDetails(FEATURE_ID_JSON, {
        default: 'value',
      })
      expect(resultDetails).to.be.an('object')
      expect(resultDetails).toStrictEqual({
        flagKey: FEATURE_ID_JSON,
        flagMetadata: {},
        reason: 'DEFAULT',
        value: { key: 'value-1' },
        variant: 'variation 1',
      } satisfies EvaluationDetails<JsonValue>)
    })
  })

  suite('object evaluation - type validation', () => {
    test('should return error when defaultValue is a primitive (string|number|boolean|null)', async () => {
      const client = OpenFeature.getClient()
      const cases = [
        {
          value: 'invalid-string-default',
          expectedMessage:
            'Default value must be an object or array but got string',
        },
        {
          value: 123,
          expectedMessage:
            'Default value must be an object or array but got number',
        },
        {
          value: true,
          expectedMessage:
            'Default value must be an object or array but got boolean',
        },
        {
          value: null,
          expectedMessage:
            'Default value must be an object or array but got null',
        },
      ]

      for (const c of cases) {
        const resultDetails = client.getObjectDetails(FEATURE_ID_JSON, c.value)

        expect(resultDetails).to.be.an('object')
        expect(resultDetails.value).equal(c.value)
        expect(resultDetails.reason).equal('ERROR')
        expect(resultDetails.errorCode).equal('TYPE_MISMATCH')
        expect(resultDetails.errorMessage).include(c.expectedMessage)
      }
    })

    // We don't have an e2e array flag set up in the Bucketeer test backend yet; we’ll add it when one is available.
    // For now, we test getting array from a plain object flag
    test('should return a default value when trying to get array from a plain object flag', async () => {
      const client = OpenFeature.getClient()
      const arrayDefault = [
        { id: 1, name: 'item1', tags: ['a', 'b'] },
        { id: 2, name: 'item2', tags: ['c', 'd'] },
      ]

      const result = client.getObjectValue(FEATURE_ID_JSON, arrayDefault)
      expect(result).to.be.an('array')

      const resultDetails = client.getObjectDetails(
        FEATURE_ID_JSON,
        arrayDefault,
      )
      expect(resultDetails).to.be.an('object')
      expect(resultDetails.reason).equal('ERROR')
      expect(resultDetails.errorCode).equal('TYPE_MISMATCH')
      expect(resultDetails.errorMessage).include(
        'Expected array but got object',
      )
      expect(resultDetails.value).to.deep.equal(arrayDefault)
    })

    test('should return a default value when trying to get object from primitive flags', async () => {
      // The Bucketeer JS SDK's objectVariationDetails
      // guarantees it returns an object or array (it returns the default value if the flag type doesn't match)
      const client = OpenFeature.getClient()
      const primitiveFlags = [
        FEATURE_ID_BOOLEAN,
        FEATURE_ID_INT,
        FEATURE_ID_STRING,
      ]

      for (const flag of primitiveFlags) {
        const resultDetails = client.getObjectDetails(flag, {
          default: 'fallback',
        })

        expect(resultDetails).to.be.an('object')
        expect(resultDetails.reason).equal('CLIENT')
        expect(resultDetails.errorCode).toBeUndefined()
        expect(resultDetails.errorMessage).toBeUndefined()
        expect(resultDetails.value).to.deep.equal({ default: 'fallback' })
      }
    })
  })
})
