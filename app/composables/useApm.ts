/**
 * Composable for accessing Elastic APM functionality
 * Provides convenient methods for custom instrumentation
 */
export const useApm = () => {
  const { $apm } = useNuxtApp()

  /**
   * Start a custom transaction
   * @param name - Transaction name
   * @param type - Transaction type (e.g., 'user-interaction', 'api-call')
   */
  const startTransaction = (name: string, type = 'custom') => {
    if ($apm) {
      return $apm.startTransaction(name, type)
    }
    return null
  }

  /**
   * Start a custom span within the current transaction
   * @param name - Span name
   * @param type - Span type (e.g., 'db.query', 'external.http')
   */
  const startSpan = (name: string, type = 'custom') => {
    if ($apm) {
      return $apm.startSpan(name, type)
    }
    return null
  }

  /**
   * Set user context for tracking
   * @param user - User information
   */
  const setUserContext = (user: { id?: string; username?: string; email?: string }) => {
    if ($apm) {
      $apm.setUserContext(user)
    }
  }

  /**
   * Add custom context to current transaction
   * @param context - Custom context data
   */
  const setCustomContext = (context: Record<string, any>) => {
    if ($apm) {
      $apm.setCustomContext(context)
    }
  }

  /**
   * Add labels/tags to current transaction
   * @param labels - Key-value pairs for labeling
   */
  const addLabels = (labels: Record<string, string | number | boolean>) => {
    if ($apm) {
      $apm.addLabels(labels)
    }
  }

  /**
   * Capture an error
   * @param error - Error object or message
   */
  const captureError = (error: Error | string) => {
    if ($apm) {
      $apm.captureError(error)
    }
  }

  return {
    apm: $apm,
    startTransaction,
    startSpan,
    setUserContext,
    setCustomContext,
    addLabels,
    captureError
  }
}
