# Bucketeer - OpenFeature JS provider for Android clients

This is the official JS OpenFeature provider for accessing your feature flags with [Bucketeer](https://bucketeer.io/).

[Bucketeer](https://bucketeer.io) is an open-source platform created by [CyberAgent](https://www.cyberagent.co.jp/en/) to help teams make better decisions, reduce deployment lead time and release risk through feature flags. Bucketeer offers advanced features like dark launches and staged rollouts that perform limited releases based on user attributes, devices, and other segments.

In conjunction with the [OpenFeature SDK](https://openfeature.dev/docs/reference/concepts/provider) you will be able to evaluate your feature flags in your web applications.

> [!WARNING]
> This is a beta version. Breaking changes may be introduced before general release.

For documentation related to flags management in Bucketeer, refer to the [Bucketeer documentation website](https://docs.bucketeer.io/sdk/client-side/javascript).

## Installation


## Usage

### Initialize the provider

Bucketeer provider needs to be created and then set in the global OpenFeatureAPI.

```typescript

```

See our [documentation](https://docs.bucketeer.io/sdk/client-side/android) for more SDK configuration.

The evaluation context allows the client to specify contextual data that Bucketeer uses to evaluate the feature flags.

The `targetingKey` is the user ID (Unique ID) and cannot be empty.

### Update the Evaluation Context

You can update the evaluation context with the new attributes if the user attributes change.

```typescript

```

> [!WARNING]
> Changing the `targetingKey` is not supported in the current implementation of the BucketeerProvider.

To change the user ID, the BucketeerProvider must be removed and reinitialized.

```typescript
// Shut down the provider first

// Remove the provider

// Reinitialize the provider with new targetingKey
```

### Evaluate a feature flag

After the provider is set and the provider's status is `OpenFeatureEvents.ProviderReady`, you can evaluate a feature flag using OpenFeatureAPI.

```typescript

```

> [!WARNING]
> Value.date is not supported in the current implementation of the BucketeerProvider.

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