# Changelog

## [0.0.4](https://github.com/bucketeer-io/openfeature-js-client-sdk/compare/v0.0.3...v0.0.4) (2025-12-23)

### Features

* add fixed 5-second evaluation event deduplication ([#298](https://github.com/bucketeer-io/javascript-client-sdk/issues/298)) ([f336314](https://github.com/bucketeer-io/javascript-client-sdk/commit/f3363146275b4f4d67dc1e9b7de6b20a8dbb5270))


### Bug Fixes

* duplicate event submissions when sendEvents is called multiple times concurrently ([#296](https://github.com/bucketeer-io/javascript-client-sdk/issues/296)) ([3d582f8](https://github.com/bucketeer-io/javascript-client-sdk/commit/3d582f8ba308352c918b2668495e59c002017607))


### Build System

* update js sdk to 2.5.0 ([#16](https://github.com/bucketeer-io/openfeature-js-client-sdk/issues/16)) ([8c19ff6](https://github.com/bucketeer-io/openfeature-js-client-sdk/commit/8c19ff6e0a39d6a279d2162839faa7ad8ff6d809))

## [0.0.3](https://github.com/bucketeer-io/openfeature-js-client-sdk/compare/v0.0.2...v0.0.3) (2025-11-19)


### Features

* add auto page lifecycle for flushing events to prevent data loss ([#271](https://github.com/bucketeer-io/javascript-client-sdk/issues/271)) ([9c4b6e5](https://github.com/bucketeer-io/javascript-client-sdk/commit/9c4b6e550d488c755eeeb639b2b5cc9b3f52fd92))


### Bug Fixes

* cache is not being updated after the second poll in some cases ([#268](https://github.com/bucketeer-io/javascript-client-sdk/issues/268)) ([a190e12](https://github.com/bucketeer-io/javascript-client-sdk/commit/a190e126166bc088d121f0c1f1a79ea841481e0d))


### Miscellaneous

* auto retry on deployment-related 499 errors ([#265](https://github.com/bucketeer-io/javascript-client-sdk/issues/265)) ([e924bff](https://github.com/bucketeer-io/javascript-client-sdk/commit/e924bffd5e35f7461fbff0f27f6e0ed185f999b6))

### Build System

* **deps:** update @bucketeer/js-client-sdk peer dependency range ([#12](https://github.com/bucketeer-io/openfeature-js-client-sdk/issues/12)) ([8b6975f](https://github.com/bucketeer-io/openfeature-js-client-sdk/commit/8b6975f4c75202db969e59a4b797d4cc5827dd72))

## [0.0.2](https://github.com/bucketeer-io/openfeature-js-client-sdk/compare/v0.0.1...v0.0.2) (2025-11-18)


### Bug Fixes

* uncaught reference error for  __BKT_SDK_VERSION__ in build output ([#8](https://github.com/bucketeer-io/openfeature-js-client-sdk/issues/8)) ([58b69ce](https://github.com/bucketeer-io/openfeature-js-client-sdk/commit/58b69ce3f91f73d1bf656756ab5f41b83c994e1c))

## [0.0.1](https://github.com/bucketeer-io/openfeature-js-client-sdk/compare/v0.0.1...v0.0.1) (2025-06-17)


### Features

* openfeature provider implementation ([#7](https://github.com/bucketeer-io/openfeature-js-client-sdk/issues/7)) ([08c3d6e](https://github.com/bucketeer-io/openfeature-js-client-sdk/commit/08c3d6ebe64bc65caafb1dc063c04ba4cda390c4))
