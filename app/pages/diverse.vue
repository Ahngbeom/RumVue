<template>
  <div class="container">
    <h1>Diverse Interactions</h1>
    <p>다양한 브라우저 사용자 상호작용 예제</p>

    <NuxtLink to="/" class="back-link">← Back to Home</NuxtLink>

    <div class="section">
      <h2>1. API Calls</h2>
      <p>API 요청이 자동으로 추적됩니다 (HTTP spans).</p>
      <div class="button-group">
        <RumButton variant="primary" :loading="loading" @click="fetchUsers">
          {{ loading ? 'Loading...' : 'Fetch Users' }}
        </RumButton>
        <RumButton variant="primary" :loading="loading" @click="fetchPosts">
          {{ loading ? 'Loading...' : 'Fetch Posts' }}
        </RumButton>
      </div>
      <div v-if="apiData" class="data-box">
        <h4>API Response:</h4>
        <pre>{{ JSON.stringify(apiData, null, 2) }}</pre>
      </div>
      <div v-if="apiError" class="error-box">
        Error: {{ apiError }}
      </div>
    </div>

    <div class="section">
      <h2>2. Timer Operations</h2>
      <p>비동기 작업과 타이머 추적</p>
      <div class="timer-controls">
        <RumButton :disabled="timerRunning" @click="startTimer">
          Start Timer (3s)
        </RumButton>
        <RumButton variant="danger" :disabled="!timerRunning" @click="stopTimer">
          Stop Timer
        </RumButton>
      </div>
      <div class="timer-display">
        <p>Timer Status: <strong>{{ timerRunning ? 'Running' : 'Stopped' }}</strong></p>
        <p>Elapsed: <strong>{{ elapsedTime }}s</strong></p>
        <p>Completions: <strong>{{ timerCompletions }}</strong></p>
      </div>
    </div>

    <div class="section">
      <h2>3. Error Tracking</h2>
      <p>에러와 예외 상황 추적</p>
      <div class="button-group">
        <RumButton variant="warning" @click="throwSyncError">
          Trigger Sync Error
        </RumButton>
        <RumButton variant="warning" @click="throwAsyncError">
          Trigger Async Error
        </RumButton>
        <RumButton variant="warning" @click="simulateNetworkError">
          Simulate Network Error
        </RumButton>
      </div>
      <div v-if="errorMessage" class="error-box">
        {{ errorMessage }}
      </div>
    </div>

    <div class="section">
      <h2>4. Local Storage Operations</h2>
      <p>로컬 스토리지 작업 추적</p>
      <div class="storage-controls">
        <input
          v-model="storageKey"
          type="text"
          placeholder="Key"
          class="input small"
        />
        <input
          v-model="storageValue"
          type="text"
          placeholder="Value"
          class="input small"
        />
        <RumButton @click="saveToStorage">Save</RumButton>
        <RumButton @click="loadFromStorage">Load</RumButton>
        <RumButton variant="danger" @click="clearStorage">Clear</RumButton>
      </div>
      <div v-if="storageData" class="data-box small">
        <strong>Loaded:</strong> {{ storageData }}
      </div>
    </div>

    <div class="section">
      <h2>5. Performance Measurement</h2>
      <p>무거운 계산 작업 성능 추적</p>
      <div class="button-group">
        <RumButton variant="primary" :loading="computing" @click="runHeavyComputation">
          {{ computing ? 'Computing...' : 'Run Heavy Computation' }}
        </RumButton>
      </div>
      <div v-if="computeResult" class="data-box">
        <p>Result: {{ computeResult.value }}</p>
        <p>Time taken: {{ computeResult.time }}ms</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { startTransaction, startSpan, captureError, addLabels, setCustomContext } = useApm()

// API Calls
const loading = ref(false)
const apiData = ref<any>(null)
const apiError = ref<string>('')

const fetchUsers = async () => {
  // Start a transaction for this API call
  const transaction = startTransaction('Fetch Users', 'user-interaction')

  loading.value = true
  apiError.value = ''
  apiData.value = null

  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users?_limit=3')
    const data = await response.json()
    apiData.value = data

    if (transaction) {
      transaction.addLabels({
        api_endpoint: 'users',
        response_count: data.length,
        http_status: response.status
      })
    }
  } catch (error: any) {
    apiError.value = error.message
    captureError(error)
  } finally {
    loading.value = false
    if (transaction) transaction.end()
  }
}

const fetchPosts = async () => {
  // Start a transaction for this API call
  const transaction = startTransaction('Fetch Posts', 'user-interaction')

  loading.value = true
  apiError.value = ''
  apiData.value = null

  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=3')
    const data = await response.json()
    apiData.value = data

    if (transaction) {
      transaction.addLabels({
        api_endpoint: 'posts',
        response_count: data.length,
        http_status: response.status
      })
    }
  } catch (error: any) {
    apiError.value = error.message
    captureError(error)
  } finally {
    loading.value = false
    if (transaction) transaction.end()
  }
}

// Timer Operations
const timerRunning = ref(false)
const elapsedTime = ref(0)
const timerCompletions = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null
let timerTransaction: any = null

const startTimer = () => {
  // Start a transaction for the timer operation
  timerTransaction = startTransaction('Timer Operation', 'user-interaction')

  timerRunning.value = true
  elapsedTime.value = 0

  const span = startSpan('timer-operation', 'custom')

  timerInterval = setInterval(() => {
    elapsedTime.value++

    if (elapsedTime.value >= 3) {
      stopTimer()
      timerCompletions.value++

      if (span) {
        span.end()
      }

      if (timerTransaction) {
        timerTransaction.addLabels({
          timer_completed: true,
          completion_count: timerCompletions.value,
          elapsed_time: elapsedTime.value
        })
        timerTransaction.end()
        timerTransaction = null
      }
    }
  }, 1000)
}

const stopTimer = () => {
  timerRunning.value = false
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  if (timerTransaction) {
    timerTransaction.addLabels({
      timer_stopped: true,
      elapsed_time: elapsedTime.value
    })
    timerTransaction.end()
    timerTransaction = null
  }
}

// Error Tracking
const errorMessage = ref<string>('')

const throwSyncError = () => {
  // Start a transaction for this interaction
  const transaction = startTransaction('Sync Error Test', 'user-interaction')

  try {
    errorMessage.value = ''
    throw new Error('This is a synchronous error for testing')
  } catch (error: any) {
    errorMessage.value = error.message
    captureError(error)
    console.error('Caught sync error:', error)

    if (transaction) {
      transaction.addLabels({
        error_type: 'sync',
        error_caught: true
      })
    }
  } finally {
    if (transaction) transaction.end()
  }
}

const throwAsyncError = async () => {
  // Start a transaction for this interaction
  const transaction = startTransaction('Async Error Test', 'user-interaction')

  try {
    errorMessage.value = ''
    await new Promise((_, reject) => {
      setTimeout(() => reject(new Error('This is an async error for testing')), 500)
    })
  } catch (error: any) {
    errorMessage.value = error.message
    captureError(error)
    console.error('Caught async error:', error)

    if (transaction) {
      transaction.addLabels({
        error_type: 'async',
        error_caught: true
      })
    }
  } finally {
    if (transaction) transaction.end()
  }
}

const simulateNetworkError = async () => {
  // Start a transaction for this interaction
  const transaction = startTransaction('Network Error Test', 'user-interaction')

  try {
    errorMessage.value = ''
    const response = await fetch('https://jsonplaceholder.typicode.com/invalid-endpoint')
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`)
    }
  } catch (error: any) {
    errorMessage.value = error.message
    captureError(error)
    console.error('Network error:', error)

    if (transaction) {
      transaction.addLabels({
        error_type: 'network',
        error_caught: true
      })
    }
  } finally {
    if (transaction) transaction.end()
  }
}

// Local Storage
const storageKey = ref('demo-key')
const storageValue = ref('demo-value')
const storageData = ref<string>('')

const saveToStorage = () => {
  // Start a transaction for this interaction
  const transaction = startTransaction('Storage Save', 'user-interaction')
  const span = startSpan('localStorage.setItem', 'storage')

  try {
    localStorage.setItem(storageKey.value, storageValue.value)
    storageData.value = `Saved: ${storageKey.value} = ${storageValue.value}`

    if (transaction) {
      transaction.addLabels({
        storage_operation: 'save',
        key: storageKey.value
      })
    }
  } catch (error: any) {
    captureError(error)
  } finally {
    if (span) span.end()
    if (transaction) transaction.end()
  }
}

const loadFromStorage = () => {
  // Start a transaction for this interaction
  const transaction = startTransaction('Storage Load', 'user-interaction')
  const span = startSpan('localStorage.getItem', 'storage')

  try {
    const value = localStorage.getItem(storageKey.value)
    storageData.value = value ? `Loaded: ${storageKey.value} = ${value}` : 'Key not found'

    if (transaction) {
      transaction.addLabels({
        storage_operation: 'load',
        key: storageKey.value,
        found: !!value
      })
    }
  } catch (error: any) {
    captureError(error)
  } finally {
    if (span) span.end()
    if (transaction) transaction.end()
  }
}

const clearStorage = () => {
  // Start a transaction for this interaction
  const transaction = startTransaction('Storage Clear', 'user-interaction')
  const span = startSpan('localStorage.clear', 'storage')

  try {
    localStorage.removeItem(storageKey.value)
    storageData.value = 'Cleared'

    if (transaction) {
      transaction.addLabels({
        storage_operation: 'clear'
      })
    }
  } catch (error: any) {
    captureError(error)
  } finally {
    if (span) span.end()
    if (transaction) transaction.end()
  }
}

// Heavy Computation
const computing = ref(false)
const computeResult = ref<{ value: number; time: number } | null>(null)

const runHeavyComputation = async () => {
  // Start a transaction for this interaction
  const transaction = startTransaction('Heavy Computation', 'user-interaction')

  computing.value = true
  computeResult.value = null

  const span = startSpan('heavy-computation', 'custom')
  const startTime = performance.now()

  // Simulate heavy computation
  await new Promise(resolve => setTimeout(resolve, 100))

  let result = 0
  for (let i = 0; i < 10000000; i++) {
    result += Math.sqrt(i)
  }

  const endTime = performance.now()
  const timeTaken = Math.round(endTime - startTime)

  computeResult.value = {
    value: Math.round(result),
    time: timeTaken
  }

  if (span) span.end()

  if (transaction) {
    transaction.addLabels({
      computation_time: timeTaken,
      computation_result: result
    })
    transaction.end()
  }

  computing.value = false
}

// Cleanup
onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})

// Track page view
onMounted(() => {
  console.log('Diverse Interactions page mounted')
  addLabels({
    page_type: 'diverse_interactions'
  })
})
</script>

<style scoped>
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

.back-link {
  display: inline-block;
  margin-bottom: 2rem;
  color: #005571;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.section {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.section h2 {
  margin-top: 0;
  color: #2c3e50;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.data-box {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.data-box.small {
  max-height: 100px;
}

.data-box pre {
  margin: 0;
  font-size: 0.875rem;
}

.error-box {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.timer-controls {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}

.timer-display {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 4px;
}

.timer-display p {
  margin: 0.5rem 0;
}

.storage-controls {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.input {
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.input.small {
  flex: 1;
  min-width: 150px;
}

.input:focus {
  outline: none;
  border-color: #005571;
}
</style>
