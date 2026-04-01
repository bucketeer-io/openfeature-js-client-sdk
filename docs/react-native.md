# React Native

This document provides instructions on how to use the Bucketeer OpenFeature provider in React Native applications.

The React Native provider integrates the [OpenFeature React SDK](https://openfeature.dev/docs/reference/sdks/client/web/react) with the Bucketeer platform, allowing you to seamlessly evaluate feature flags across your mobile application using OpenFeature's React hooks.

Under the hood, this provider automatically handles React Native specific details such as utilizing `@react-native-async-storage/async-storage` for robust local caching and `react-native-uuid` for internal event generation, providing an optimal and out-of-the-box feature flagging experience tailored for iOS and Android environments.

> [!WARNING]
> This is a beta version. Breaking changes may be introduced before general release.

## Installation (React Native)

```bash
npm install @bucketeer/openfeature-js-client-sdk @openfeature/react-sdk
```

> [!NOTE]
> npm versions 7 and above will automatically install the required peer dependencies.
> If you get an error about missing peer dependencies, please install them manually:
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

## Usage (React Native)

Please use the [OpenFeature React SDK](https://openfeature.dev/docs/reference/sdks/client/web/react/) to use feature flags in your React Native application.

### Configuration & Initialization

> [!WARNING]
> Make sure not to use defineConfig in the React Native environment, as it is not supported.

Use `defineBKTConfigForReactNative` to create your configuration and set up the `OpenFeatureProvider`. Make sure to use the global `fetch` API.

```typescript
import { OpenFeatureProvider, OpenFeature } from '@openfeature/react-sdk';
import { defineBKTConfigForReactNative, BucketeerReactNativeProvider } from '@bucketeer/openfeature-js-client-sdk';

const config = defineBKTConfigForReactNative({
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

### Evaluate a feature flag

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

### Update the Evaluation Context

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
> Changing the `targetingKey` is not supported in the current implementation of the BucketeerReactNativeProvider. To change the user ID, the Provider must be removed and reinitialized, as demonstrated in the [Web README section](../README.md#update-the-evaluation-context).
