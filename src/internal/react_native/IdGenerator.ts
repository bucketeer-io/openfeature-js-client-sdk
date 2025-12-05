import uuid from 'react-native-uuid'

class ReactNativeIdGenerator {
  newId(): string {
    return uuid.v4()
  }
}

export { ReactNativeIdGenerator }
