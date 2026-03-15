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
  - [Installation (React)](#installation-react)
  - [Usage (React)](#usage-react)
- [React Native](#react-native)
  - [Installation (React Native)](#installation-react-native)
  - [Usage (React Native)](#usage-react-native)
- [Contributing](#contributing)
- [Development](#development)
- [License](#license)

---

## Web (JavaScript / TypeScript)

### Installation (Web)

```bash
npm install @bucketeer/openfeature-js-client-sdk
```

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

### Installation (React)

```bash
npm install @bucketeer/openfeature-js-client-sdk @openfeature/react-sdk
```

> [!NOTE]
> npm versions 7 and above will automatically install the required peer dependencies: 
> `@openfeature/web-sdk` and `@bucketeer/js-client-sdk`.
> If you got an error about missing peer dependencies, please install them manually:
>
> ```bash
> npm install @openfeature/core @openfeature/web-sdk @bucketeer/js-client-sdk
> ```

### Usage (React)

Please use the [OpenFeature React SDK](https://openfeature.dev/docs/reference/sdks/client/web/react/) to use feature flags in your React application.

#### Configuration & Initialization

Use `defineBKTConfig` to create your configuration and set up the `OpenFeatureProvider`.

```typescript
import { OpenFeatureProvider, OpenFeature } from '@openfeature/react-sdk';
import { defineBKTConfig, BucketeerReactProvider } from '@bucketeer/openfeature-js-client-sdk';

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

// Note: There is no need to await setProvider in React,
// because provider initialization is handled internally by the OpenFeature React SDK.

function App() {
  return (
    <OpenFeatureProvider>
      <YourApp />
    </OpenFeatureProvider>
  )
}
```

See our [documentation](https://docs.bucketeer.io/sdk/client-side/javascript#configuring-client) for more SDK configuration.

#### Evaluate a feature flag

The OpenFeature React SDK provides hooks for evaluating feature flags.

```typescript
import { useBooleanFlagValue, useStringFlagValue, useNumberFlagValue, useObjectFlagValue } from '@openfeature/react-sdk';

// boolean flag
const flagValueBool = useBooleanFlagValue('my-feature-flag', false);

// string flag
const flagValueStr = useStringFlagValue('my-feature-flag', 'default-value');

// number flag
const flagValueNum = useNumberFlagValue('my-number-flag', 0);

// object flag
const flagValueObj = useObjectFlagValue('my-object-flag', {});
```

More details can be found in the [OpenFeature React SDK documentation](https://openfeature.dev/docs/reference/sdks/client/web/react#usage).

#### Update the Evaluation Context

The evaluation context allows the client to specify contextual data that Bucketeer uses to evaluate feature flags.
The `targetingKey` is the user ID (Unique ID) and cannot be empty.

You can update the evaluation context with the new attributes if the user attributes change.

```typescript
import { OpenFeature } from '@openfeature/react-sdk';

const newEvaluationContext = {
  targetingKey: 'USER_ID',
  app_version: '2.0.0',
  age: 25,
  country: 'US',
}
await OpenFeature.setContext(newEvaluationContext)
```

> [!WARNING]
> Changing the `targetingKey` is not supported in the current implementation of the BucketeerProvider. To change the user ID, the Provider must be removed and reinitialized exactly as demonstrated in the [Web section above](#update-the-evaluation-context).

---

## React Native

### Installation (React Native)

```bash
npm install @bucketeer/openfeature-js-client-sdk @openfeature/react-sdk
```

> [!NOTE]
> npm versions 7 and above will automatically install the required peer dependencies.
> If you got an error about missing peer dependencies, please install them manually:
>
> ```bash
> npm install @openfeature/core @openfeature/web-sdk @bucketeer/js-client-sdk
> ```

> [!IMPORTANT]
> The Bucketeer React Native provider relies on `@react-native-async-storage/async-storage` for local caching and `react-native-uuid` for generating IDs for Bucketeer SDK events.
>
> **Expo Users:**
> Simply installing the Bucketeer OpenFeature JS provider is sufficient.
> No additional steps are required for Android.
> For iOS, navigate to the iOS folder and run `pod install`.
> ```bash
> cd ios && pod install  # For iOS
> ```
>
> **Non-Expo Users:**
> You must explicitly install `@react-native-async-storage/async-storage` and `react-native-uuid` as direct dependencies in your project. 
> No additional steps are required for Android.
> For iOS, navigate to the iOS folder and run `pod install`.
> This is necessary because React Native's auto-linking feature does not support transitive dependencies (see [CLI Issue #1347](https://github.com/react-native-community/cli/issues/1347)).
>
> ```bash
> npm install @react-native-async-storage/async-storage react-native-uuid
> cd ios && pod install  # For iOS
> ```
>
> **Note on Optional Peer Dependencies:**
> These dependencies are marked as **optional** peer dependencies in `package.json` to avoid forcing Web and Node.js consumers to install packages they don't need. However, `BucketeerReactNativeProvider` will throw a `ProviderFatalError` if `react-native-uuid` is missing at runtime, as it is strictly required for the React Native environment.
>
> If `@react-native-async-storage/async-storage` is not installed, the SDK will gracefully fall back to in-memory storage.
>
> For more details, see: https://react-native-async-storage.github.io/async-storage/docs/install/

### Usage (React Native)

Please use the [OpenFeature React SDK](https://openfeature.dev/docs/reference/sdks/client/web/react/) to use feature flags in your React Native application.

#### Configuration & Initialization

Use `defineBKTConfig` to create your configuration and set up the `OpenFeatureProvider`. Make sure to use the global `fetch` API.

```typescript
import { OpenFeatureProvider, OpenFeature } from '@openfeature/react-sdk';
import { defineBKTConfig, BucketeerReactNativeProvider } from '@bucketeer/openfeature-js-client-sdk';

const config = defineBKTConfig({
  apiEndpoint: 'BUCKETEER_API_ENDPOINT',
  apiKey: 'BUCKETEER_API_KEY',
  featureTag: 'FEATURE_TAG',
  appVersion: '1.2.3',
  fetch: fetch, // Use global fetch in React Native
})

const initEvaluationContext = {
  targetingKey: 'USER_ID',
  app_version: '1.2.3',
}
await OpenFeature.setContext(initEvaluationContext)
const provider = new BucketeerReactNativeProvider(config)
OpenFeature.setProvider(provider)

// Note: There is no need to await setProvider in React Native,
// because provider initialization is handled internally by the OpenFeature React SDK.

function App() {
  return (
    <OpenFeatureProvider>
      <YourApp />
    </OpenFeatureProvider>
  )
}
```

See our [documentation](https://docs.bucketeer.io/sdk/client-side/javascript#configuring-client) for more SDK configuration.

> [!IMPORTANT]
> In the React Native environment, any `idGenerator` or `storageFactory` provided in the configuration will be **ignored**. The `BucketeerReactNativeProvider` automatically provides specialized React Native implementations for these during initialization.


#### Evaluate a feature flag

The OpenFeature React SDK provides hooks for evaluating feature flags.

```typescript
import { useBooleanFlagValue, useStringFlagValue, useNumberFlagValue, useObjectFlagValue } from '@openfeature/react-sdk';

// boolean flag
const flagValueBool = useBooleanFlagValue('my-feature-flag', false);

// string flag
const flagValueStr = useStringFlagValue('my-feature-flag', 'default-value');

// number flag
const flagValueNum = useNumberFlagValue('my-number-flag', 0);

// object flag
const flagValueObj = useObjectFlagValue('my-object-flag', {});
```

More details can be found in the [OpenFeature React SDK documentation](https://openfeature.dev/docs/reference/sdks/client/web/react#usage).

#### Update the Evaluation Context

The evaluation context allows the client to specify contextual data that Bucketeer uses to evaluate feature flags.
The `targetingKey` is the user ID (Unique ID) and cannot be empty.

You can update the evaluation context with the new attributes if the user attributes change.

```typescript
import { OpenFeature } from '@openfeature/react-sdk';

const newEvaluationContext = {
  targetingKey: 'USER_ID',
  app_version: '2.0.0',
  age: 25,
  country: 'US',
}
await OpenFeature.setContext(newEvaluationContext)
```

> [!WARNING]
> Changing the `targetingKey` is not supported in the current implementation of the BucketeerProvider. To change the user ID, the Provider must be removed and reinitialized exactly as demonstrated in the [Web section above](#update-the-evaluation-context).

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