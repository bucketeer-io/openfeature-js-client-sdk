export interface RNIdGenerator {
  newId(): string
}

async function createReactNativeIdGenerator(): Promise<RNIdGenerator | undefined> {
  try {
    const uuidModule = await import('react-native-uuid')
    const uuid = uuidModule.default
    if (!uuid) return undefined
    return {
      newId(): string {
        return uuid.v4() as string
      },
    }
  } catch (_) {
    return undefined
  }
}

export { createReactNativeIdGenerator }

