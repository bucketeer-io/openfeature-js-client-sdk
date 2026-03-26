# React

This document provides instructions on how to use the Bucketeer OpenFeature provider in React applications.

The React provider integrates the [OpenFeature React SDK](https://openfeature.dev/docs/reference/sdks/client/web/react) with the Bucketeer platform, allowing you to seamlessly evaluate feature flags across your web application using OpenFeature's React hooks.

## Installation (React)

```bash
npm install @bucketeer/openfeature-js-client-sdk @openfeature/react-sdk
```

> [!NOTE]
> npm versions 7 and above will automatically install the required peer dependencies: 
> `@openfeature/web-sdk` and `@bucketeer/js-client-sdk`.
> If you get an error about missing peer dependencies, please install them manually:
>
> ```bash
> npm install @openfeature/core @openfeature/web-sdk @bucketeer/js-client-sdk
> ```

## Usage (React)

Please use the [OpenFeature React SDK](https://openfeature.dev/docs/reference/sdks/client/web/react/) to use feature flags in your React application.

### Configuration & Initialization

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
> Changing the `targetingKey` is not supported in the current implementation of the BucketeerProvider. To change the user ID, the Provider must be removed and reinitialized, as demonstrated in the [Web README section](../README.md#update-the-evaluation-context).
