import { init as initApm } from '@elastic/apm-rum'
import { ApmVuePlugin } from '@elastic/apm-rum-vue'
import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'

export default defineNuxtPlugin((nuxtApp) => {
  // Get runtime config
  const config = useRuntimeConfig()

  // Initialize Elastic APM RUM agent
  const apm = initApm({
    // Service name - identifies your application in Kibana
    serviceName: config.public.apmServiceName as string,
    
    // Server URL - from environment variables or default
    serverUrl: config.public.apmServerUrl as string,

    // Service version - useful for tracking deployments
    serviceVersion: config.public.apmServiceVersion as string,

    // Environment - helps distinguish between dev/staging/prod
    environment: config.public.apmEnvironment as string,

    // Enable distributed tracing (tracks requests across services)
    distributedTracing: true,

    // Enable distributed tracing origins for CORS
    distributedTracingOrigins: ['http://localhost:3000'],

    // Transaction sample rate (1.0 = 100% of transactions)
    transactionSampleRate: 1.0,

    // Enable page load metrics
    pageLoadTransactionName: 'page-load',

    // Enable long tasks monitoring (tasks taking >50ms)
    breakdownMetrics: true,

    // Enable instrumentation for user interactions
    instrument: true,

    // Enable logging for debugging
    logLevel: 'debug'
  })

  // Install the Vue plugin for automatic route change tracking
  if (apm) {
    nuxtApp.vueApp.use(ApmVuePlugin, {
      apm,
      config: {
        router: nuxtApp.$router
      }
    })

    // Install global error handler for component tracking
    nuxtApp.vueApp.config.errorHandler = (err, instance, info) => {
      console.error('[APM] Vue Error Handler:', err, info)

      // Get component information
      let componentName = 'Unknown'
      let componentHierarchy: string[] = []

      if (instance) {
        // Get component name
        componentName =
          instance.$options?.name ||
          instance.$options?.__name ||
          (instance.$options as any)?.displayName ||
          'AnonymousComponent'

        // Build component hierarchy
        let current: typeof instance | null = instance
        while (current) {
          const name =
            current.$options?.name ||
            current.$options?.__name ||
            'AnonymousComponent'
          componentHierarchy.unshift(name)
          current = current.$parent
        }
      }

      const hierarchyPath = componentHierarchy.join(' > ')

      // Set component context
      apm.setCustomContext({
        vue_error: {
          component_name: componentName,
          component_hierarchy: componentHierarchy,
          hierarchy_path: hierarchyPath,
          error_info: info,
          timestamp: new Date().toISOString()
        }
      })

      // Add labels for filtering
      apm.addLabels({
        error_type: 'vue_component_error',
        error_component: componentName,
        error_hierarchy: hierarchyPath,
        error_info: info
      })

      // Capture the error
      apm.captureError(err instanceof Error ? err : new Error(String(err)))

      // Re-throw the error so Vue can still handle it
      throw err
    }

    // Install global warning handler
    nuxtApp.vueApp.config.warnHandler = (msg, instance, trace) => {
      console.warn('[APM] Vue Warning:', msg, trace)

      let componentName = 'Unknown'
      if (instance) {
        componentName =
          instance.$options?.name ||
          instance.$options?.__name ||
          'AnonymousComponent'
      }

      apm.addLabels({
        warning_type: 'vue_component_warning',
        warning_component: componentName
      })
    }
  }

  // Provide APM instance to the app
  return {
    provide: {
      apm
    }
  }
})
