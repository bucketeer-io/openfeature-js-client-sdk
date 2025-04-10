import { suite, test, expect, beforeEach, afterEach, afterAll } from 'vitest'
import {
  defineBKTConfig,
  BKTConfig,
} from '@bucketeer/js-client-sdk'
import { EvaluationDetails, JsonValue, OpenFeature, ProviderStatus } from '@openfeature/web-sdk'
import { BucketeerProvider } from '../src/main.browser'
import { 
  FEATURE_ID_BOOLEAN,
  FEATURE_ID_DOUBLE, 
  FEATURE_ID_INT, 
  FEATURE_ID_JSON, 
  FEATURE_ID_STRING, 
  FEATURE_TAG, 
  USER_ID,
} from './constants'

suite('BucketeerProvider', () => {
  let config: BKTConfig
  afterAll(() => {
    OpenFeature.close()
  })

  afterEach(() => {
    OpenFeature.clearContext()
    OpenFeature.clearProviders()
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

    OpenFeature.setContext(context)
    const provider = new BucketeerProvider(config)
    await OpenFeature.setProviderAndWait(provider)

    const client = OpenFeature.getClient()
    expect(client.metadata.providerMetadata.name).equal('Bucketeer Provider')
    expect(client.providerStatus).equal(ProviderStatus.READY)
  })

  suite('boolean evaluation', () => {
    test('boolean evaluation', async () => {
      const client = OpenFeature.getClient()
      const result = client.getBooleanValue(FEATURE_ID_BOOLEAN, false)
      expect(result).to.be.a('boolean')
      expect(result).to.equal(true)

      const resultDetails = client.getBooleanDetails(
        FEATURE_ID_BOOLEAN,
        false,
      )
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

      const resultDetails = client.getNumberDetails(
        FEATURE_ID_INT,
        0,
      )
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

      const resultDetails = client.getNumberDetails(
        FEATURE_ID_DOUBLE,
        0.0,
      )
      expect(resultDetails).to.be.an('object')
      expect(resultDetails).toStrictEqual({
        flagKey: FEATURE_ID_DOUBLE,
        flagMetadata: {},
        reason: 'DEFAULT',
        value: 2.1,
        variant: 'variation 2.1',
      } satisfies EvaluationDetails<number>)

    })

    test('object evaluation', async () => {
      const client = OpenFeature.getClient()
      const result = client.getObjectValue(
        FEATURE_ID_JSON,
        { default: 'value' },
      )
      expect(result).to.be.an('object')
      expect(result).to.deep.equal({ key: 'value-1' })

      const resultDetails = client.getObjectDetails(
        FEATURE_ID_JSON,
        { default: 'value' },
      )
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
})