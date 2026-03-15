# React Native Integration Tests

This directory contains integration tests designed specifically for the React Native implementation components.

## Purpose

The primary goal of these tests is to verify the behavior of modules that interact with actual React Native dependencies (like `@react-native-async-storage/async-storage` and `react-native-uuid`) **without using mocks**. We want to ensure that our wrappers (`AsyncStorageFactory` and `IdGeneratorFactory`) correctly instantiate and interact with the real, underlying modules.

## How it works

These tests work in standard, non-React Native testing environments (like Web or Node) because the underlying dependencies are practically isomorphic or universal. Furthermore, modern React Native applications can be compiled and run directly on the web (e.g., via React Native Web), making DOM-based testing highly relevant:

- `react-native-uuid`: This is a pure JavaScript module. Even though it's designed for React Native, it functions perfectly well without a real React Native runtime.
- `@react-native-async-storage/async-storage`: This module can run in web/DOM environments (which we provide using Vitest's `happy-dom` environment).

Vitest dynamially imports these from the `devDependencies` ensuring we are verifying against the actual packages our users will install.

## Why they are excluded from Node tests

You might notice in `vitest-node.config.ts` that `test/internal/integration/**` is specifically excluded from the Node.js test run (`pnpm test:node`). 

While certain dependencies (like `react-native-uuid` used in `IdGeneratorFactory`) *can* run in a Node environment just fine, it conceptually doesn't make sense to run React Native specific integration tests there. The node tests are meant to focus on standard, core JS SDK logic.

By isolating these React Native integration tests (and relying on the web/DOM test suite or explicit commands), we maintain a clear separation of concerns in our test environments without polluting the pure Node testing suite.
