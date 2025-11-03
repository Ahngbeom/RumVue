// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // TypeScript configuration
  typescript: {
    tsConfig: {
      compilerOptions: {
        types: ['node']
      }
    }
  },

  // Runtime config for APM settings
  runtimeConfig: {
    public: {
      apmServerUrl: process.env.NUXT_PUBLIC_APM_SERVER_URL || 'http://localhost:8200',
      apmServiceName: process.env.NUXT_PUBLIC_APM_SERVICE_NAME || 'rumvue-demo',
      apmServiceVersion: process.env.NUXT_PUBLIC_APM_SERVICE_VERSION || '1.0.0',
      apmEnvironment: process.env.NUXT_PUBLIC_APM_ENVIRONMENT || 'development'
    }
  }
})
