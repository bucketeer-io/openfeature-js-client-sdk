/* eslint-disable semi */
import { OpenFeature, OpenFeatureProvider } from '@openfeature/react-sdk';
import { defineBKTConfig } from 'bkt-js-client-sdk';
import { StyleSheet, Text, View } from 'react-native';
import { BucketeerReactNativeProvider } from '@bucketeer/openfeature-js-client-sdk';
import React, { Suspense } from 'react';

const API_ENDPOINT =
  process.env.EXPO_PUBLIC_BKT_API_ENDPOINT || 'https://api.bucketeer.io';
const API_KEY = process.env.EXPO_PUBLIC_BKT_API_KEY || 'api-key';
const FEATURE_TAG = process.env.EXPO_PUBLIC_FEATURE_TAG || 'feature-tag';

const config = defineBKTConfig({
  apiEndpoint: API_ENDPOINT,
  apiKey: API_KEY,
  featureTag: FEATURE_TAG,
  appVersion: '1.2.3',
  fetch: fetch,
});

const initEvaluationContext = {
  targetingKey: 'USER_ID',
  app_version: '1.2.3',
};

(async () => {
  await OpenFeature.setContext(initEvaluationContext);
  const provider = new BucketeerReactNativeProvider(config);
  OpenFeature.setProvider(provider);
})();

function FallbackComponent() {
  return (
    <View style={styles.container}>
      <Text>Loading feature flags...</Text>
    </View>
  );
}

function HomeScreen() {
  const client = OpenFeature.getClient();
  const isNewFeatureEnabled = client.getBooleanValue('new-home-screen', false);

  if (!isNewFeatureEnabled) {
    return (
      <View style={styles.container}>
        <Text>Welcome to the Home Screen v1 (Old)</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text>Welcome to the Home Screen v2 (New)</Text>
    </View>
  );
}

export default function App() {
  return (
    <OpenFeatureProvider>
      <Suspense fallback={<FallbackComponent />}>
        <HomeScreen></HomeScreen>
      </Suspense>
    </OpenFeatureProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
