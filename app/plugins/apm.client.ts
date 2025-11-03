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
  }

  // Provide APM instance to the app
  return {
    provide: {
      apm
    }
  }
})
