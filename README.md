# Bucketeer - OpenFeature JS provider

This is the official JS OpenFeature provider for accessing your feature flags with [Bucketeer](https://bucketeer.io/).

[Bucketeer](https://bucketeer.io) is an open-source platform created by [CyberAgent](https://www.cyberagent.co.jp/en/) to help teams make better decisions, reduce deployment lead time and release risk through feature flags. Bucketeer offers advanced features like dark launches and staged rollouts that perform limited releases based on user attributes, devices, and other segments.

In conjunction with the [OpenFeature SDK](https://openfeature.dev/docs/reference/concepts/provider) you will be able to evaluate your feature flags in your web, React, and React Native applications.

> [!WARNING]
> This is a beta version. Breaking changes may be introduced before general release.

For documentation related to flags management in Bucketeer, refer to the [Bucketeer documentation website](https://docs.bucketeer.io/sdk/client-side/javascript).

## Table of Contents

- [Web (JavaScript / TypeScript)](#web-javascript--typescript)
  - [Installation (Web)](#installation-web)
  - [Usage (Web)](#usage-web)
- [React](#react)
- [React Native](#react-native)
- [Contributing](#contributing)
- [Development](#development)
- [License](#license)

---

## Web (JavaScript / TypeScript)

### Installation (Web)

```bash
npm install @bucketeer/openfeature-js-client-sdk
```

> [!NOTE]
> npm versions 7 and above will automatically install the required peer dependencies: 
> `@openfeature/web-sdk` and `@bucketeer/js-client-sdk`.
> If you got an error about missing peer dependencies, please install them manually:
>
> ```bash
> npm install @openfeature/core @openfeature/web-sdk @bucketeer/js-client-sdk
> ```


### Usage (Web)

#### Configuration

Use `defineBKTConfig` to create your configuration.

```typescript
import { defineBKTConfig } from '@bucketeer/openfeature-js-client-sdk';

const config = defineBKTConfig({
  apiEndpoint: 'BUCKETEER_API_ENDPOINT',
  apiKey: 'BUCKETEER_API_KEY',
  featureTag: 'FEATURE_TAG',
  appVersion: '1.2.3',
  fetch: window.fetch,
})
```

See our [documentation](https://docs.bucketeer.io/sdk/client-side/javascript#configuring-client) for more SDK configuration.

#### Initialization

Initialize and set the Bucketeer provider to OpenFeature.

```typescript
import { OpenFeature } from '@openfeature/web-sdk';
import { defineBKTConfig, BucketeerProvider } from '@bucketeer/openfeature-js-client-sdk';

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

#### Evaluate a feature flag

After the provider is set and the provider's status is `ClientProviderEvents.Ready`, you can evaluate a feature flag using the OpenFeature client.

```typescript
const client = OpenFeature.getClient();

// boolean flag
const flagValueBool = client.getBooleanValue('my-feature-flag', false);

// string flag
const flagValueStr = client.getStringValue('my-feature-flag', 'default-value');

// number flag
const flagValueNum = client.getNumberValue('my-number-flag', 0);

// object flag
const flagValueObj = client.getObjectValue('my-object-flag', {});
```

More details can be found in the [OpenFeature Web SDK documentation](https://openfeature.dev/docs/reference/sdks/client/web/#usage).

#### Update the Evaluation Context

The evaluation context allows the client to specify contextual data that Bucketeer uses to evaluate feature flags.
The `targetingKey` is the user ID (Unique ID) and cannot be empty.

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

---

## React

For React instructions, please see our [React documentation](https://github.com/bucketeer-io/openfeature-js-client-sdk/blob/main/docs/react.md).

---

## React Native

For React Native instructions, please see our [React Native documentation](https://github.com/bucketeer-io/openfeature-js-client-sdk/blob/main/docs/react-native.md).

---

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