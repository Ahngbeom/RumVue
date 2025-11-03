/**
 * APM Tracking Helper Composable
 *
 * Simplifies APM instrumentation by providing high-level helper functions
 * that automatically handle transaction lifecycle and error handling.
 *
 * @example
 * ```typescript
 * const { trackClick, trackApiCall } = useApmTracking()
 *
 * // Before: 10 lines of boilerplate
 * const handleClick = () => {
 *   const transaction = startTransaction('Button Click', 'user-interaction')
 *   clickCount.value++
 *   if (transaction) {
 *     transaction.addLabels({ ... })
 *     setTimeout(() => transaction.end(), 100)
 *   }
 * }
 *
 * // After: 3 lines with helper
 * const handleClick = trackClick('Button Click', () => {
 *   clickCount.value++
 * })
 * ```
 */

export const useApmTracking = () => {
  const { startTransaction, captureError } = useApm()

  /**
   * Generic handler wrapper that creates a transaction around any function
   *
   * @param name - Transaction name (will appear in APM UI)
   * @param handler - The actual function to execute
   * @param options - Additional configuration
   * @returns Wrapped function with same signature as original
   */
  const trackHandler = <T extends (...args: any[]) => any>(
    name: string,
    handler: T,
    options?: {
      type?: string
      labels?: Record<string, any>
      context?: Record<string, any>
      minDuration?: number
    }
  ): T => {
    return ((...args: any[]) => {
      const transaction = startTransaction(
        name,
        options?.type || 'user-interaction'
      )

      // Add labels if provided
      if (transaction && options?.labels) {
        transaction.addLabels(options.labels)
      }

      // Add custom context if provided
      if (options?.context) {
        const { setCustomContext } = useApm()
        setCustomContext(options.context)
      }

      const endTransaction = () => {
        if (transaction) {
          const minDuration = options?.minDuration ?? 100
          setTimeout(() => {
            transaction.end()
          }, minDuration)
        }
      }

      try {
        const result = handler(...args)

        // Handle async functions (Promises)
        if (result instanceof Promise) {
          return result
            .then((value) => {
              endTransaction()
              return value
            })
            .catch((error) => {
              captureError(error)
              if (transaction) transaction.end()
              throw error
            })
        }

        // Sync function
        endTransaction()
        return result
      } catch (error) {
        captureError(error)
        if (transaction) transaction.end()
        throw error
      }
    }) as T
  }

  /**
   * Track button click events
   *
   * @example
   * ```typescript
   * const handleClick = trackClick('Submit Button', () => {
   *   form.submit()
   * })
   * ```
   */
  const trackClick = (
    name: string,
    handler: (...args: any[]) => void | Promise<void>,
    additionalLabels?: Record<string, any>
  ) => {
    return trackHandler(name, handler, {
      type: 'user-interaction',
      labels: {
        interaction_type: 'click',
        ...additionalLabels
      }
    })
  }

  /**
   * Track API calls with automatic success/failure tracking
   *
   * @example
   * ```typescript
   * const fetchUsers = () => trackApiCall('Fetch Users', async () => {
   *   const response = await fetch('/api/users')
   *   return response.json()
   * })
   * ```
   */
  const trackApiCall = async <T>(
    name: string,
    apiCall: () => Promise<T>,
    options?: {
      endpoint?: string
      method?: string
    }
  ): Promise<T> => {
    const transaction = startTransaction(name, 'api-call')

    const startTime = performance.now()

    try {
      const result = await apiCall()
      const duration = Math.round(performance.now() - startTime)

      if (transaction) {
        transaction.addLabels({
          api_success: true,
          api_duration_ms: duration,
          ...(options?.endpoint && { api_endpoint: options.endpoint }),
          ...(options?.method && { api_method: options.method })
        })
      }

      return result
    } catch (error) {
      const duration = Math.round(performance.now() - startTime)

      if (transaction) {
        transaction.addLabels({
          api_success: false,
          api_duration_ms: duration,
          ...(options?.endpoint && { api_endpoint: options.endpoint }),
          ...(options?.method && { api_method: options.method })
        })
      }

      captureError(error as Error)
      throw error
    } finally {
      if (transaction) {
        setTimeout(() => transaction.end(), 100)
      }
    }
  }

  /**
   * Track form submission events
   *
   * @example
   * ```typescript
   * const handleSubmit = trackFormSubmit('Login Form', () => {
   *   login(credentials)
   * }, {
   *   form_id: 'login',
   *   has_data: true
   * })
   * ```
   */
  const trackFormSubmit = (
    name: string,
    handler: (...args: any[]) => void | Promise<void>,
    formData?: Record<string, any>
  ) => {
    return trackHandler(name, handler, {
      type: 'form-submit',
      labels: {
        interaction_type: 'form_submit',
        has_data: !!formData,
        field_count: formData ? Object.keys(formData).length : 0
      },
      context: formData ? { form_data: formData } : undefined
    })
  }

  /**
   * Track input field changes (debounced to avoid too many transactions)
   *
   * @example
   * ```typescript
   * const handleNameInput = trackInput('Name Field', (value) => {
   *   userName.value = value
   * })
   * ```
   */
  const trackInput = (
    name: string,
    handler: (value: any) => void,
    debounceMs: number = 500
  ) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    return (value: any) => {
      // Clear previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // Debounce: only track after user stops typing
      timeoutId = setTimeout(() => {
        trackHandler(
          name,
          () => handler(value),
          {
            type: 'user-interaction',
            labels: {
              interaction_type: 'input',
              has_value: !!value
            }
          }
        )()
      }, debounceMs)
    }
  }

  /**
   * Track navigation/route changes
   *
   * @example
   * ```typescript
   * const handleNavigation = trackNavigation('Go to Dashboard', () => {
   *   navigateTo('/dashboard')
   * })
   * ```
   */
  const trackNavigation = (
    name: string,
    handler: () => void | Promise<void>,
    destination?: string
  ) => {
    return trackHandler(name, handler, {
      type: 'navigation',
      labels: {
        interaction_type: 'navigation',
        ...(destination && { destination })
      }
    })
  }

  /**
   * Track storage operations (localStorage, sessionStorage)
   *
   * @example
   * ```typescript
   * const saveSettings = trackStorage('Save Settings', () => {
   *   localStorage.setItem('theme', 'dark')
   * }, { operation: 'save', key: 'theme' })
   * ```
   */
  const trackStorage = (
    name: string,
    handler: () => void | Promise<void>,
    metadata?: {
      operation?: 'save' | 'load' | 'delete' | 'clear'
      key?: string
      storageType?: 'local' | 'session'
    }
  ) => {
    return trackHandler(name, handler, {
      type: 'storage-operation',
      labels: {
        interaction_type: 'storage',
        ...metadata
      }
    })
  }

  /**
   * Track async operations with custom spans
   *
   * @example
   * ```typescript
   * await trackAsync('Complex Operation', async () => {
   *   await step1()
   *   await step2()
   *   await step3()
   * })
   * ```
   */
  const trackAsync = async <T>(
    name: string,
    asyncOperation: () => Promise<T>,
    options?: {
      type?: string
      labels?: Record<string, any>
    }
  ): Promise<T> => {
    const transaction = startTransaction(
      name,
      options?.type || 'async-operation'
    )

    try {
      const result = await asyncOperation()

      if (transaction && options?.labels) {
        transaction.addLabels(options.labels)
      }

      return result
    } catch (error) {
      captureError(error as Error)
      throw error
    } finally {
      if (transaction) {
        setTimeout(() => transaction.end(), 100)
      }
    }
  }

  /**
   * Create a transaction that can be manually controlled
   * Useful for long-running operations or multiple steps
   *
   * @example
   * ```typescript
   * const tx = createTransaction('Multi-Step Process')
   * try {
   *   await step1()
   *   tx.addLabel('step1_complete', true)
   *   await step2()
   *   tx.addLabel('step2_complete', true)
   * } finally {
   *   tx.end()
   * }
   * ```
   */
  const createTransaction = (
    name: string,
    type: string = 'custom'
  ) => {
    const transaction = startTransaction(name, type)

    return {
      transaction,
      addLabel: (key: string, value: string | number | boolean) => {
        if (transaction) {
          transaction.addLabels({ [key]: value })
        }
      },
      addLabels: (labels: Record<string, any>) => {
        if (transaction) {
          transaction.addLabels(labels)
        }
      },
      end: () => {
        if (transaction) {
          transaction.end()
        }
      }
    }
  }

  return {
    // Core
    trackHandler,

    // Convenience methods
    trackClick,
    trackApiCall,
    trackFormSubmit,
    trackInput,
    trackNavigation,
    trackStorage,
    trackAsync,

    // Advanced
    createTransaction
  }
}
