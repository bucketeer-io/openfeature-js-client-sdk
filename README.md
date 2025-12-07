# Bucketeer - OpenFeature JS provider for a web clients

This is the official JS OpenFeature provider for accessing your feature flags with [Bucketeer](https://bucketeer.io/).

[Bucketeer](https://bucketeer.io) is an open-source platform created by [CyberAgent](https://www.cyberagent.co.jp/en/) to help teams make better decisions, reduce deployment lead time and release risk through feature flags. Bucketeer offers advanced features like dark launches and staged rollouts that perform limited releases based on user attributes, devices, and other segments.

In conjunction with the [OpenFeature SDK](https://openfeature.dev/docs/reference/concepts/provider) you will be able to evaluate your feature flags in your web applications.

> [!WARNING]
> This is a beta version. Breaking changes may be introduced before general release.

For documentation related to flags management in Bucketeer, refer to the [Bucketeer documentation website](https://docs.bucketeer.io/sdk/client-side/javascript).

## Installation

```bash
npm install @bucketeer/openfeature-js-client-sdk
```

This will automatically install the required peer dependencies: `@openfeature/web-sdk` and `@bucketeer/js-client-sdk`.

## Usage

### Initialize the provider

Bucketeer provider needs to be created and then set in the global OpenFeatureAPI.

#### Web

```typescript
import { OpenFeature } from '@openfeature/web-sdk';
import { defineBKTConfig } from '@bucketeer/js-client-sdk'
import { BucketeerProvider } from '@bucketeer/openfeature-js-client-sdk';

const config = defineBKTConfig({
  apiEndpoint: 'BUCKETEER_API_ENDPOINT',
  apiKey: 'BUCKETEER_API_KEY',
  featureTag: 'FEATURE_TAG',
  appVersion: '1.2.3',
  fetch: window.fetch,
})

const initEvaluationContext = {
  targetingKey: 'USER_ID',
  app_version: '1.2.3',
}
await OpenFeature.setContext(initEvaluationContext)
const provider = new BucketeerProvider(config)
await OpenFeature.setProviderAndWait(provider)
```

#### React

We recommend using the [OpenFeature React SDK](https://openfeature.dev/docs/reference/sdks/client/web/react/) to use feature flags in your React application.

```typescript
import { OpenFeatureProvider, OpenFeature } from '@openfeature/react-sdk';
import { defineBKTConfig } from '@bucketeer/js-client-sdk'
import { BucketeerReactProvider } from '@bucketeer/openfeature-js-client-sdk';

const config = defineBKTConfig({
  apiEndpoint: 'BUCKETEER_API_ENDPOINT',
  apiKey: 'BUCKETEER_API_KEY',
  featureTag: 'FEATURE_TAG',
  appVersion: '1.2.3',
  fetch: window.fetch,
})

const initEvaluationContext = {
  targetingKey: 'USER_ID',
  app_version: '1.2.3',
}
await OpenFeature.setContext(initEvaluationContext)
const provider = new BucketeerReactProvider(config)
OpenFeature.setProvider(provider)

function App() {
  return (
    <OpenFeatureProvider>
      <YourApp />
    </OpenFeatureProvider>
  )
}
```

#### React Native

We recommend using the [OpenFeature React SDK](https://openfeature.dev/docs/reference/sdks/client/web/react/) to use feature flags in your React Native application.

> [!IMPORTANT]
> For React Native, you must install `@react-native-async-storage/async-storage` to enable local caching, and `react-native-uuid` to generate IDs for Bucketeer SDK events.
> ```bash
> npm install @react-native-async-storage/async-storage react-native-uuid
> ```
> If `@react-native-async-storage/async-storage` is not installed, the SDK will fall back to in-memory storage.

```typescript
import { OpenFeatureProvider, OpenFeature } from '@openfeature/react-sdk';
import { defineBKTConfig } from '@bucketeer/js-client-sdk'
import { BucketeerReactNativeProvider } from '@bucketeer/openfeature-js-client-sdk';

const config = defineBKTConfig({
  apiEndpoint: 'BUCKETEER_API_ENDPOINT',
  apiKey: 'BUCKETEER_API_KEY',
  featureTag: 'FEATURE_TAG',
  appVersion: '1.2.3',
  fetch: fetch, // Use global fetch
})

const initEvaluationContext = {
  targetingKey: 'USER_ID',
  app_version: '1.2.3',
}
await OpenFeature.setContext(initEvaluationContext)
const provider = new BucketeerReactNativeProvider(config)
OpenFeature.setProvider(provider)

function App() {
  return (
    <OpenFeatureProvider>
      <YourApp />
    </OpenFeatureProvider>
  )
}
```

See our [documentation](https://docs.bucketeer.io/sdk/client-side/android) for more SDK configuration.

The evaluation context allows the client to specify contextual data that Bucketeer uses to evaluate the feature flags.

The `targetingKey` is the user ID (Unique ID) and cannot be empty.

### Update the Evaluation Context

You can update the evaluation context with the new attributes if the user attributes change.

```typescript
const newEvaluationContext = {
  targetingKey: 'USER_ID',
  app_version: '2.0.0',
  age: 25,
  country: 'US',
}
await OpenFeature.setContext(newEvaluationContext)
```

> [!WARNING]
> Changing the `targetingKey` is not supported in the current implementation of the BucketeerProvider.

To change the user ID, the BucketeerProvider must be removed and reinitialized.

```typescript
await OpenFeature.clearProviders()
await OpenFeature.clearContext()

// Reinitialize the provider with new targetingKey
const newEvaluationContext = {
  targetingKey: 'USER_ID_NEW',
  app_version: '2.0.0',
  age: 25,
  country: 'US',
}

const config = defineBKTConfig({
  apiEndpoint: 'BUCKETEER_API_ENDPOINT',
  apiKey: 'BUCKETEER_API_KEY',
  featureTag: 'FEATURE_TAG',
  appVersion: '1.2.3',
  fetch: window.fetch,
})

await OpenFeature.setContext(newEvaluationContext)
const provider = new BucketeerProvider(config)
await OpenFeature.setProviderAndWait(provider)
```

### Evaluate a feature flag

After the provider is set and the provider's status is `ClientProviderEvents.Ready`, you can evaluate a feature flag using OpenFeatureAPI.

```typescript
const client = OpenFeature.getClient();

// boolean flag
const flagValue = client.getBooleanValue('my-feature-flag', false);

// string flag
const flagValue = client.getStringValue('my-feature-flag', 'default-value');

// number flag
const flagValue = client.getNumberValue('my-feature-flag', 0);

// object flag
const flagValue = client.getObjectValue('my-feature-flag', {});

```

## Contributing

We would ❤️ for you to contribute to Bucketeer and help improve it! Anyone can use and enjoy it!

Please follow our contribution guide [here](https://docs.bucketeer.io/contribution-guide/).

## Development

### Environment

- pnpm
  - enable it via `corepack enable`
- Node.js
  - check `./.node-version`

You need `.env` file to provide api secrets.
Just copy `env.template` and rename it to `.env`, then update it with your secrets.


## License

Apache License 2.0, see [LICENSE](https://github.com/bucketeer-io/ios-client-sdk/blob/main/LICENSE).