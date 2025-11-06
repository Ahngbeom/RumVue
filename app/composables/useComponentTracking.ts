/**
 * Composable for tracking Vue components in Elastic APM
 * Automatically tracks component lifecycle, hierarchy, and breadcrumbs
 */

import type { ComponentInternalInstance } from 'vue'

interface ComponentBreadcrumb {
  name: string
  timestamp: number
  props?: Record<string, any>
  route?: string
}

// Global breadcrumb trail
const componentBreadcrumbs: ComponentBreadcrumb[] = []
const MAX_BREADCRUMBS = 20

/**
 * Get component name from Vue component instance
 */
const getComponentName = (instance: ComponentInternalInstance | null): string => {
  if (!instance) return 'Unknown'

  // Try different ways to get component name
  const name =
    instance.type?.name ||
    instance.type?.__name ||
    (instance.type as any)?.displayName ||
    'AnonymousComponent'

  return name
}

/**
 * Get component hierarchy path
 */
const getComponentHierarchy = (instance: ComponentInternalInstance | null): string[] => {
  const hierarchy: string[] = []
  let current = instance

  while (current) {
    const name = getComponentName(current)
    hierarchy.unshift(name)
    current = current.parent
  }

  return hierarchy
}

/**
 * Sanitize props for APM (remove functions, circular refs, etc.)
 */
const sanitizeProps = (props: any): Record<string, any> => {
  if (!props || typeof props !== 'object') return {}

  const sanitized: Record<string, any> = {}

  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined) {
      sanitized[key] = value
    } else if (typeof value === 'function') {
      sanitized[key] = '[Function]'
    } else if (typeof value === 'object') {
      try {
        // Try to serialize, but catch circular references
        JSON.stringify(value)
        sanitized[key] = value
      } catch {
        sanitized[key] = '[Object]'
      }
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Add component to breadcrumb trail
 */
const addComponentBreadcrumb = (
  name: string,
  props?: Record<string, any>,
  route?: string
) => {
  componentBreadcrumbs.push({
    name,
    timestamp: Date.now(),
    props: props ? sanitizeProps(props) : undefined,
    route
  })

  // Keep only last N breadcrumbs
  if (componentBreadcrumbs.length > MAX_BREADCRUMBS) {
    componentBreadcrumbs.shift()
  }
}

/**
 * Get recent component breadcrumbs
 */
export const getComponentBreadcrumbs = (limit = 10): ComponentBreadcrumb[] => {
  return componentBreadcrumbs.slice(-limit)
}

/**
 * Performance metrics interface
 */
interface PerformanceMetrics {
  renderTime: number
  updateCount: number
  lastUpdateTime: number
  totalUpdateTime: number
  avgUpdateTime: number
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
    usedMB: number
    totalMB: number
  }
}

/**
 * Main composable for component tracking
 */
export const useComponentTracking = (options: {
  trackLifecycle?: boolean
  trackProps?: boolean
  trackPerformance?: boolean
  componentName?: string
} = {}) => {
  const {
    trackLifecycle = true,
    trackProps = true,
    trackPerformance = false,
    componentName: customName
  } = options

  const { addLabels, setCustomContext, startSpan } = useApm()
  const route = useRoute()
  const instance = getCurrentInstance()

  if (!instance) {
    console.warn('useComponentTracking must be called within setup()')
    return {
      componentName: 'Unknown',
      hierarchy: [],
      hierarchyPath: '',
      trackAction: () => null,
      trackError: () => {},
      getComponentInfo: () => ({}),
      getComponentBreadcrumbs: (limit = 10) => getComponentBreadcrumbs(limit),
      getPerformanceMetrics: () => ({
        renderTime: 0,
        updateCount: 0,
        lastUpdateTime: 0,
        totalUpdateTime: 0,
        avgUpdateTime: 0
      }),
      performanceMetrics: shallowReadonly(shallowRef({
        renderTime: 0,
        updateCount: 0,
        lastUpdateTime: 0,
        totalUpdateTime: 0,
        avgUpdateTime: 0
      }))
    }
  }

  const componentName = customName || getComponentName(instance)
  const hierarchy = getComponentHierarchy(instance)
  const hierarchyPath = hierarchy.join(' > ')

  // Add to breadcrumb trail
  if (trackProps && instance.props) {
    addComponentBreadcrumb(componentName, instance.props, route.path)
  } else {
    addComponentBreadcrumb(componentName, undefined, route.path)
  }

  // Track component mount
  if (trackLifecycle) {
    onMounted(() => {
      addLabels({
        component_name: componentName,
        component_hierarchy: hierarchyPath,
        component_lifecycle: 'mounted'
      })

      setCustomContext({
        component: {
          name: componentName,
          hierarchy: hierarchy,
          route: route.path,
          mounted_at: new Date().toISOString()
        }
      })

      console.log(`[APM] Component mounted: ${componentName}`, {
        hierarchy: hierarchyPath,
        route: route.path
      })
    })

    // Track component unmount
    onUnmounted(() => {
      addLabels({
        component_name: componentName,
        component_lifecycle: 'unmounted'
      })

      console.log(`[APM] Component unmounted: ${componentName}`)
    })
  }

  // Performance tracking
  // Use shallowRef to prevent deep reactivity that causes infinite loops
  const performanceMetrics = shallowRef<PerformanceMetrics>({
    renderTime: 0,
    updateCount: 0,
    lastUpdateTime: 0,
    totalUpdateTime: 0,
    avgUpdateTime: 0
  })

  if (trackPerformance) {
    let mountStartTime = 0
    let updateStartTime = 0
    let renderSpan: any = null
    let isUpdating = false // Flag to prevent recursive updates

    // Track render start
    onBeforeMount(() => {
      mountStartTime = performance.now()
      renderSpan = startSpan(`Render: ${componentName}`, 'component-render')

      // Create performance mark
      try {
        performance.mark(`${componentName}-render-start`)
      } catch (e) {
        // Ignore if mark already exists
      }
    })

    // Track render complete
    onMounted(() => {
      const renderTime = performance.now() - mountStartTime

      // Create performance mark and measure
      try {
        performance.mark(`${componentName}-render-end`)
        performance.measure(
          `${componentName}-render`,
          `${componentName}-render-start`,
          `${componentName}-render-end`
        )
      } catch (e) {
        // Ignore if mark/measure fails
      }

      // Collect memory info (Chrome/Edge only)
      const memoryInfo = (performance as any).memory
      let memory = undefined
      if (memoryInfo) {
        memory = {
          usedJSHeapSize: memoryInfo.usedJSHeapSize,
          totalJSHeapSize: memoryInfo.totalJSHeapSize,
          jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
          usedMB: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024 * 100) / 100,
          totalMB: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024 * 100) / 100
        }
      }

      // Update with new object (shallowRef requires replacement)
      performanceMetrics.value = {
        renderTime,
        updateCount: 0,
        lastUpdateTime: 0,
        totalUpdateTime: 0,
        avgUpdateTime: 0,
        memory
      }

      // Add to APM
      addLabels({
        component_name: componentName,
        render_time_ms: Math.round(renderTime),
        has_memory_api: !!memoryInfo
      })

      setCustomContext({
        component_performance: {
          name: componentName,
          hierarchy: hierarchyPath,
          render_time_ms: renderTime,
          memory,
          timestamp: new Date().toISOString()
        }
      })

      // End render span
      if (renderSpan) {
        renderSpan.end()
      }

      console.log(`[Performance] ${componentName} rendered:`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        memory: memory
          ? `${memory.usedMB}MB / ${memory.totalMB}MB`
          : 'N/A'
      })
    })

    // Track updates
    onBeforeUpdate(() => {
      // Skip if already updating (prevent infinite loop)
      if (isUpdating) return

      updateStartTime = performance.now()

      try {
        performance.mark(`${componentName}-update-${performanceMetrics.value.updateCount}-start`)
      } catch (e) {
        // Ignore
      }
    })

    onUpdated(() => {
      // Skip if already updating (prevent infinite loop)
      if (isUpdating) return

      isUpdating = true

      // Use nextTick to update metrics after current render cycle
      nextTick(() => {
        const updateTime = performance.now() - updateStartTime
        const current = performanceMetrics.value
        const newUpdateCount = current.updateCount + 1
        const newTotalUpdateTime = current.totalUpdateTime + updateTime

        // Create new object (shallowRef requires replacement)
        performanceMetrics.value = {
          renderTime: current.renderTime,
          updateCount: newUpdateCount,
          lastUpdateTime: updateTime,
          totalUpdateTime: newTotalUpdateTime,
          avgUpdateTime: newTotalUpdateTime / newUpdateCount,
          memory: current.memory
        }

        try {
          performance.mark(`${componentName}-update-${newUpdateCount - 1}-end`)
          performance.measure(
            `${componentName}-update-${newUpdateCount - 1}`,
            `${componentName}-update-${newUpdateCount - 1}-start`,
            `${componentName}-update-${newUpdateCount - 1}-end`
          )
        } catch (e) {
          // Ignore
        }

        addLabels({
          component_name: componentName,
          update_time_ms: Math.round(updateTime),
          update_count: newUpdateCount
        })

        console.log(`[Performance] ${componentName} updated:`, {
          updateTime: `${updateTime.toFixed(2)}ms`,
          updateCount: newUpdateCount,
          avgUpdateTime: `${(newTotalUpdateTime / newUpdateCount).toFixed(2)}ms`
        })

        isUpdating = false
      })
    })
  }

  /**
   * Get current performance metrics
   */
  const getPerformanceMetrics = (): PerformanceMetrics => {
    return { ...performanceMetrics.value }
  }

  /**
   * Track a custom action within this component
   */
  const trackAction = (actionName: string, metadata?: Record<string, any>) => {
    const span = startSpan(`${componentName}: ${actionName}`, 'component-action')

    addLabels({
      component_name: componentName,
      component_action: actionName,
      component_hierarchy: hierarchyPath
    })

    if (metadata) {
      setCustomContext({
        component_action: {
          component: componentName,
          action: actionName,
          metadata,
          timestamp: new Date().toISOString()
        }
      })
    }

    return span
  }

  /**
   * Track an error with component context
   */
  const trackError = (error: Error | string, additionalContext?: Record<string, any>) => {
    const { captureError } = useApm()

    // Add component context to error
    setCustomContext({
      error_component: {
        name: componentName,
        hierarchy: hierarchy,
        hierarchy_path: hierarchyPath,
        route: route.path,
        breadcrumbs: getComponentBreadcrumbs(10),
        ...additionalContext
      }
    })

    addLabels({
      error_component: componentName,
      error_hierarchy: hierarchyPath
    })

    console.error(`[APM] Error in component: ${componentName}`, {
      error,
      hierarchy: hierarchyPath,
      breadcrumbs: getComponentBreadcrumbs(5)
    })

    captureError(error)
  }

  /**
   * Get current component information
   */
  const getComponentInfo = () => {
    return {
      name: componentName,
      hierarchy,
      hierarchyPath,
      route: route.path,
      breadcrumbs: getComponentBreadcrumbs(10)
    }
  }

  return {
    componentName,
    hierarchy,
    hierarchyPath,
    trackAction,
    trackError,
    getComponentInfo,
    getComponentBreadcrumbs,
    getPerformanceMetrics,
    performanceMetrics: shallowReadonly(performanceMetrics)
  }
}
