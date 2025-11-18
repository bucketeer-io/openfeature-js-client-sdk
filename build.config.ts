import { defineBuildConfig } from 'unbuild'
import packageJson from './package.json'

export default defineBuildConfig({
  replace: {
    __BKT_SDK_VERSION__: JSON.stringify(packageJson.version),
  },
})
