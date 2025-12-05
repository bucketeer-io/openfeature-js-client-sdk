import { defineBuildConfig } from 'unbuild'
import packageJson from './package.json'

export default defineBuildConfig({
  // Explicitly define entry points to isolate environment-specific code (Node, Browser, React Native)
  entries: ['./src/main', './src/main.browser', './src/main.react-native'],
  // Generate TypeScript type definitions (.d.ts) for all entry points
  declaration: true,
  rollup: {
    // Emit CommonJS (.cjs) for compatibility with older bundlers like Metro (React Native)
    emitCJS: true,
  },
  replace: {
    __BKT_SDK_VERSION__: JSON.stringify(packageJson.version),
  },
})
