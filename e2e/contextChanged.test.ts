import { suite, test, expect, beforeEach, afterEach, afterAll } from 'vitest'
import {
  defineBKTConfig,
  BKTConfig,
  getBKTClient,
} from '@bucketeer/js-client-sdk'
import { EvaluationDetails, OpenFeature, ProviderEvents, ProviderStatus } from '@openfeature/web-sdk'
import { BucketeerProvider } from '../src/main.browser'
import {
  FEATURE_ID_STRING,
  FEATURE_TAG,
  USER_ID,
} from './constants'

suite('BucketeerProvider - context changed', () => {
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
  })
  
  test('context change success', async () => {
    const initEvaluationContext = {
      targetingKey: USER_ID,
      app_version: '1.2.3',
    }
    await OpenFeature.setContext(initEvaluationContext)
    await OpenFeature.setProviderAndWait(new BucketeerProvider(config))

    expect(OpenFeature.getClient().metadata.providerMetadata.name).equal('Bucketeer Provider')
    expect(OpenFeature.getClient().providerStatus).equal(ProviderStatus.READY)

    const user = getBKTClient()?.currentUser()
    expect(user?.id).to.equal(USER_ID)
    expect(user?.attributes).toStrictEqual({app_version: '1.2.3'})

    // Remove all providers and context before change user
    await OpenFeature.clearProviders()
    await OpenFeature.clearContext()

    const newEvaluationContext = {
      targetingKey: 'new_user_id',
      app_version: '1.2.3',
    }

    await OpenFeature.setContext(newEvaluationContext)
    await OpenFeature.setProviderAndWait(new BucketeerProvider(config))

    const newUser = getBKTClient()?.currentUser()
    expect(newUser?.id).to.equal('new_user_id')
    expect(newUser?.attributes).toStrictEqual({app_version: '1.2.3'})

    const result = OpenFeature.getClient().getStringValue(FEATURE_ID_STRING, 'default')
    expect(result).to.be.a('string')
    expect(result).to.equal('value-1')

    const resultDetails = OpenFeature.getClient().getStringDetails(
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

  test('context change fail', async () => {
    const initEvaluationContext = {
      targetingKey: USER_ID,
      app_version: '1.2.3',
    }
    await OpenFeature.setContext(initEvaluationContext)
    await OpenFeature.setProviderAndWait(new BucketeerProvider(config))

    expect(OpenFeature.getClient().metadata.providerMetadata.name).equal('Bucketeer Provider')
    expect(OpenFeature.getClient().providerStatus).equal(ProviderStatus.READY)

    const user = getBKTClient()?.currentUser()
    expect(user?.id).to.equal(USER_ID)
    expect(user?.attributes).toStrictEqual({app_version: '1.2.3'})

    const newEvaluationContext = {
      targetingKey: 'new_user_id',
      app_version: '1.2.3',
    }

    let capturedErrorMessage: string | undefined = ''
    OpenFeature.getClient().addHandler(ProviderEvents.Error, (eventDetails) => {
      capturedErrorMessage = eventDetails?.message
    })
    await OpenFeature.setContext(newEvaluationContext)

    // Await few milliseconds to let the event propagate
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(OpenFeature.getClient().providerStatus).equal(ProviderStatus.ERROR)
    expect(capturedErrorMessage).toBe(
      'Error running Bucketeer Provider\'s context change handler: Changing the targeting_id after initialization is not supported, please reinitialize the provider'
    )
  })
})