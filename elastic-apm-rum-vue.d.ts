declare module '@elastic/apm-rum-vue' {
  import type { Plugin } from 'vue'
  import type { ApmBase } from '@elastic/apm-rum'

  export interface ApmVuePluginOptions {
    apm: ApmBase
    config?: {
      router?: any
    }
  }

  export const ApmVuePlugin: Plugin<[ApmVuePluginOptions]>
}
