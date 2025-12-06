import type { BKTStorage } from 'bkt-js-client-sdk'
import { BKTAsyncKeyValueStore } from './AsyncStorage'

async function createReactNativeStorageFactory(): Promise<
  | (<T>(key: string) => BKTStorage<T>)
  | undefined
> {
  try {
    // Check if AsyncStorage is available
    // Use dynamic import to avoid import errors when the module is not installed
    const AsyncStorageModule = await import('@react-native-async-storage/async-storage')
    const AsyncStorage = AsyncStorageModule.default
    if (!AsyncStorage) {
      return undefined
    }

    // Return factory that creates AsyncKeyValueStore with AsyncStorage
    return <T>(key: string): BKTStorage<T> => {
      return new BKTAsyncKeyValueStore<T>(key, AsyncStorage)
    }
  } catch (_) {
    console.warn(
      'AsyncStorage is not available. ' +
        'This likely means that @react-native-async-storage/async-storage is not installed or not properly linked. ' +
        'If you are using Expo, try re-installing the Bucketeer React Native SDK and re-running "pod install". ' +
        'If you are not using Expo, ensure that @react-native-async-storage/async-storage is added as a dependency and run "pod install" for auto-linking. ' +
        'See https://github.com/react-native-async-storage/async-storage and the SDK documentation for more information.'
    )
    return undefined
  }
}

export { createReactNativeStorageFactory }
