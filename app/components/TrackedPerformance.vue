<template>
  <div class="tracked-performance">
    <div class="perf-header">
      <h3>{{ title }}</h3>
      <span class="component-badge">{{ componentName }}</span>
    </div>

    <div class="perf-metrics" v-if="showMetrics">
      <div class="metric-card">
        <div class="metric-label">Render Time</div>
        <div class="metric-value">
          {{ metrics.renderTime.toFixed(2) }}ms
        </div>
      </div>

      <div class="metric-card" v-if="'memory' in metrics && metrics.memory">
        <div class="metric-label">Memory</div>
        <div class="metric-value">
          {{ metrics.memory.usedMB }}MB / {{ metrics.memory.totalMB }}MB
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Updates</div>
        <div class="metric-value">
          {{ metrics.updateCount }}
        </div>
      </div>

      <div class="metric-card" v-if="metrics.updateCount > 0">
        <div class="metric-label">Avg Update Time</div>
        <div class="metric-value">
          {{ metrics.avgUpdateTime.toFixed(2) }}ms
        </div>
      </div>
    </div>

    <div class="perf-body">
      <slot></slot>
      <!-- Hidden trigger to force component update -->
      <span style="display: none;">{{ updateTrigger }}</span>
    </div>

    <div class="perf-footer" v-if="showActions">
      <RumButton size="sm" @click="forceUpdate">
        Force Update
      </RumButton>
      <RumButton size="sm" @click="logMetrics">
        Log Metrics
      </RumButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  showMetrics?: boolean
  showActions?: boolean
}>()

const {
  componentName,
  getPerformanceMetrics
} = useComponentTracking({
  trackLifecycle: true,
  trackProps: true,
  trackPerformance: false  // Don't track performance of the tracker itself!
})

// Manual performance tracking to avoid infinite loop
const metrics = ref({
  renderTime: 0,
  updateCount: 0,
  lastUpdateTime: 0,
  totalUpdateTime: 0,
  avgUpdateTime: 0,
  memory: undefined as any
})

// Track mount time
const mountStartTime = ref(0)

onBeforeMount(() => {
  mountStartTime.value = performance.now()
})

onMounted(() => {
  const renderTime = performance.now() - mountStartTime.value

  // Collect memory info
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

  metrics.value = {
    renderTime,
    updateCount: 0,
    lastUpdateTime: 0,
    totalUpdateTime: 0,
    avgUpdateTime: 0,
    memory
  }
})

// Force update to test update performance
const updateTrigger = ref(0)

const forceUpdate = () => {
  const startTime = performance.now()
  updateTrigger.value++

  // Measure update time after render completes
  nextTick(() => {
    const updateTime = performance.now() - startTime
    const newUpdateCount = metrics.value.updateCount + 1
    const newTotalUpdateTime = metrics.value.totalUpdateTime + updateTime

    metrics.value = {
      ...metrics.value,
      updateCount: newUpdateCount,
      lastUpdateTime: updateTime,
      totalUpdateTime: newTotalUpdateTime,
      avgUpdateTime: newTotalUpdateTime / newUpdateCount
    }
  })
}

// Log current metrics to console
const logMetrics = () => {
  console.log(`[${componentName}] Performance Metrics:`, metrics.value)

  // Also check Performance API entries
  const measures = performance.getEntriesByType('measure')
    .filter(entry => entry.name.includes(componentName))

  if (measures.length > 0) {
    console.log(`[${componentName}] Performance Measures:`, measures)
  }
}
</script>

<style scoped>
.tracked-performance {
  border: 2px solid #3498db;
  border-radius: 12px;
  background: white;
  margin: 1rem 0;
  box-shadow: 0 4px 6px rgba(52, 152, 219, 0.15);
}

.perf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 2px solid #3498db;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.perf-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: white;
}

.component-badge {
  background: rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.perf-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.metric-card {
  background: white;
  padding: 0.75rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
}

.metric-label {
  font-size: 0.75rem;
  color: #7f8c8d;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2c3e50;
  font-family: 'Courier New', monospace;
}

.perf-body {
  padding: 1.5rem;
}

.perf-footer {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
  display: flex;
  gap: 0.5rem;
}
</style>
