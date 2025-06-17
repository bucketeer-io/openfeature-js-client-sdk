import {
  defineBKTConfig,
} from '@bucketeer/js-client-sdk'
import { OpenFeature } from '@openfeature/web-sdk'
import { BucketeerProvider } from '../dist/main'

const FEATURE_TAG = 'feature-tag' // replace here
const STRING_FEATURE_ID = 'feature-js-e2e-string' // replace here

export default async function start(root: HTMLElement) {
  const logsEl = root.querySelector('#logs')

  function log(message: string) {
    if (logsEl) {
      logsEl.innerHTML += message + '<br/>'
    }
    console.log(message)
  }

  const config = defineBKTConfig({
    apiEndpoint: import.meta.env.VITE_BKT_API_ENDPOINT,
    apiKey: import.meta.env.VITE_BKT_API_KEY,
    featureTag: FEATURE_TAG,
    appVersion: '1.2.3',
    fetch: window.fetch,
  })

  const context = {
    targetingKey: 'user_id_1',
    // you can also set custom attributes
    // key: 'value'
  }

  log('initialize OpenFeature')
  OpenFeature.setContext(context)
  const provider = new BucketeerProvider(config)
  try {
    await OpenFeature.setProviderAndWait(provider)
    log('BucketeerProvider is ready')
    const client = OpenFeature.getClient()
    log('BucketeerProvider client is ready')
    const value = client.getStringValue(STRING_FEATURE_ID, 'default')
    log(`BucketeerProvider getStringValue: ${value}`)
  } catch (error) {
    log(`initialization failed: ${error}`)
  }
}