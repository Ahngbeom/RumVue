<template>
  <div class="container">
    <h1>Complex Interactions</h1>
    <p>복잡한 브라우저 사용자 상호작용 예제</p>

    <NuxtLink to="/" class="back-link">← Back to Home</NuxtLink>

    <div class="section">
      <h2>1. Custom Transactions</h2>
      <p>사용자 정의 트랜잭션으로 복잡한 워크플로우 추적</p>
      <RumButton variant="primary" :loading="workflowRunning" @click="runComplexWorkflow">
        {{ workflowRunning ? 'Running Workflow...' : 'Start Complex Workflow' }}
      </RumButton>
      <div v-if="workflowSteps.length > 0" class="steps-box">
        <h4>Workflow Steps:</h4>
        <div v-for="(step, index) in workflowSteps" :key="index" class="step-item">
          <span :class="['status', step.status]">{{ getStatusIcon(step.status) }}</span>
          {{ step.name }}
          <span v-if="step.duration" class="duration">({{ step.duration }}ms)</span>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>2. Nested Spans</h2>
      <p>중첩된 스팬으로 세부 성능 측정</p>
      <RumButton variant="primary" :loading="nestedRunning" @click="runNestedOperations">
        {{ nestedRunning ? 'Processing...' : 'Run Nested Operations' }}
      </RumButton>
      <div v-if="nestedResults" class="data-box">
        <pre>{{ nestedResults }}</pre>
      </div>
    </div>

    <div class="section">
      <h2>3. User Context Tracking</h2>
      <p>사용자 정보와 컨텍스트 설정</p>
      <div class="form-group">
        <label>User ID:</label>
        <input v-model="userData.id" type="text" class="input" placeholder="user-123" />
      </div>
      <div class="form-group">
        <label>Username:</label>
        <input v-model="userData.username" type="text" class="input" placeholder="john_doe" />
      </div>
      <div class="form-group">
        <label>Email:</label>
        <input v-model="userData.email" type="email" class="input" placeholder="john@example.com" />
      </div>
      <RumButton variant="success" @click="setUser">Set User Context</RumButton>
      <RumButton @click="clearUser">Clear User Context</RumButton>
      <div v-if="userSet" class="success-message">
        User context has been set and will be attached to all subsequent events
      </div>
    </div>

    <div class="section">
      <h2>4. Custom Context & Labels</h2>
      <p>커스텀 메타데이터 추가</p>
      <div class="form-group">
        <label>Feature Flag:</label>
        <select v-model="customContext.featureFlag" class="input">
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>
      <div class="form-group">
        <label>User Tier:</label>
        <select v-model="customContext.userTier" class="input">
          <option value="free">Free</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>
      <div class="form-group">
        <label>A/B Test Variant:</label>
        <select v-model="customContext.abTestVariant" class="input">
          <option value="A">Variant A</option>
          <option value="B">Variant B</option>
        </select>
      </div>
      <RumButton variant="primary" @click="applyCustomContext">Apply Context</RumButton>
      <div v-if="contextApplied" class="success-message">
        Custom context applied to current page session
      </div>
    </div>

    <div class="section">
      <h2>5. Multi-Step Transaction</h2>
      <p>여러 단계를 포함한 복잡한 트랜잭션</p>
      <div class="multi-step-form">
        <div class="step" :class="{ active: currentStep === 1 }">
          <h4>Step 1: User Information</h4>
          <input v-model="multiStepData.name" type="text" class="input" placeholder="Name" />
          <input v-model="multiStepData.email" type="email" class="input" placeholder="Email" />
        </div>
        <div class="step" :class="{ active: currentStep === 2 }">
          <h4>Step 2: Preferences</h4>
          <label>
            <input v-model="multiStepData.newsletter" type="checkbox" />
            Subscribe to newsletter
          </label>
          <label>
            <input v-model="multiStepData.notifications" type="checkbox" />
            Enable notifications
          </label>
        </div>
        <div class="step" :class="{ active: currentStep === 3 }">
          <h4>Step 3: Confirmation</h4>
          <div class="summary">
            <p><strong>Name:</strong> {{ multiStepData.name || 'Not provided' }}</p>
            <p><strong>Email:</strong> {{ multiStepData.email || 'Not provided' }}</p>
            <p><strong>Newsletter:</strong> {{ multiStepData.newsletter ? 'Yes' : 'No' }}</p>
            <p><strong>Notifications:</strong> {{ multiStepData.notifications ? 'Yes' : 'No' }}</p>
          </div>
        </div>
        <div class="step-controls">
          <RumButton :disabled="currentStep === 1" @click="prevStep">
            Previous
          </RumButton>
          <RumButton
            v-if="currentStep < 3"
            variant="primary"
            @click="nextStep"
          >
            Next
          </RumButton>
          <RumButton
            v-else
            variant="success"
            @click="submitMultiStep"
          >
            Submit
          </RumButton>
        </div>
      </div>
      <div v-if="multiStepCompleted" class="success-message">
        Multi-step transaction completed successfully!
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  startTransaction,
  startSpan,
  setUserContext,
  setCustomContext,
  addLabels,
  captureError
} = useApm()

// Complex Workflow
const workflowRunning = ref(false)
const workflowSteps = ref<Array<{
  name: string
  status: 'pending' | 'running' | 'complete' | 'error'
  duration?: number
}>>([])

const getStatusIcon = (status: string) => {
  const icons = {
    pending: '⏱️',
    running: '🔄',
    complete: '✅',
    error: '❌'
  }
  return icons[status as keyof typeof icons] || '❓'
}

const runComplexWorkflow = async () => {
  workflowRunning.value = true
  workflowSteps.value = [
    { name: 'Initialize', status: 'pending' },
    { name: 'Validate Data', status: 'pending' },
    { name: 'Process Records', status: 'pending' },
    { name: 'Generate Report', status: 'pending' },
    { name: 'Finalize', status: 'pending' }
  ]

  const transaction = startTransaction('complex-workflow', 'user-interaction')

  try {
    for (let i = 0; i < workflowSteps.value.length; i++) {
      const step = workflowSteps.value[i]
      if (!step) continue

      step.status = 'running'

      const span = startSpan(step.name, 'workflow-step')
      const startTime = performance.now()

      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500))

      const endTime = performance.now()
      step.duration = Math.round(endTime - startTime)
      step.status = 'complete'

      if (span) span.end()

      addLabels({
        workflow_step: step.name,
        step_number: i + 1,
        step_duration: step.duration
      })
    }

    if (transaction) {
      transaction.end()
    }
  } catch (error: any) {
    captureError(error)
    const currentStep = workflowSteps.value.find(s => s.status === 'running')
    if (currentStep) {
      currentStep.status = 'error'
    }
  } finally {
    workflowRunning.value = false
  }
}

// Nested Operations
const nestedRunning = ref(false)
const nestedResults = ref<string>('')

const runNestedOperations = async () => {
  nestedRunning.value = true
  nestedResults.value = ''

  const transaction = startTransaction('nested-operations', 'custom')

  try {
    // Level 1: Database operation
    const dbSpan = startSpan('database-query', 'db.query')
    await new Promise(resolve => setTimeout(resolve, 300))
    if (dbSpan) dbSpan.end()

    // Level 2: Data processing
    const processSpan = startSpan('process-data', 'custom')

    // Level 3: Transform data
    const transformSpan = startSpan('transform-data', 'custom')
    await new Promise(resolve => setTimeout(resolve, 200))
    if (transformSpan) transformSpan.end()

    // Level 3: Validate data
    const validateSpan = startSpan('validate-data', 'custom')
    await new Promise(resolve => setTimeout(resolve, 150))
    if (validateSpan) validateSpan.end()

    if (processSpan) processSpan.end()

    // Level 2: Cache operation
    const cacheSpan = startSpan('cache-write', 'cache')
    await new Promise(resolve => setTimeout(resolve, 100))
    if (cacheSpan) cacheSpan.end()

    nestedResults.value = JSON.stringify({
      message: 'Nested operations completed successfully',
      operations: [
        'database-query (300ms)',
        '  ↳ process-data',
        '    ↳ transform-data (200ms)',
        '    ↳ validate-data (150ms)',
        '  ↳ cache-write (100ms)'
      ]
    }, null, 2)

    if (transaction) {
      transaction.end()
    }
  } catch (error: any) {
    captureError(error)
  } finally {
    nestedRunning.value = false
  }
}

// User Context
const userData = reactive({
  id: '',
  username: '',
  email: ''
})

const userSet = ref(false)

const setUser = () => {
  setUserContext({
    id: userData.id || undefined,
    username: userData.username || undefined,
    email: userData.email || undefined
  })

  userSet.value = true

  addLabels({
    user_context_set: true
  })

  setTimeout(() => {
    userSet.value = false
  }, 3000)
}

const clearUser = () => {
  setUserContext({})
  userData.id = ''
  userData.username = ''
  userData.email = ''

  addLabels({
    user_context_cleared: true
  })
}

// Custom Context
const customContext = reactive({
  featureFlag: 'enabled',
  userTier: 'free',
  abTestVariant: 'A'
})

const contextApplied = ref(false)

const applyCustomContext = () => {
  setCustomContext({
    feature_flags: {
      new_ui: customContext.featureFlag === 'enabled'
    },
    user_tier: customContext.userTier,
    ab_test: {
      variant: customContext.abTestVariant
    }
  })

  addLabels({
    feature_flag: customContext.featureFlag,
    user_tier: customContext.userTier,
    ab_test_variant: customContext.abTestVariant
  })

  contextApplied.value = true

  setTimeout(() => {
    contextApplied.value = false
  }, 3000)
}

// Multi-Step Transaction
const currentStep = ref(1)
const multiStepData = reactive({
  name: '',
  email: '',
  newsletter: false,
  notifications: false
})
const multiStepCompleted = ref(false)
let multiStepTransaction: any = null

const nextStep = () => {
  if (!multiStepTransaction) {
    multiStepTransaction = startTransaction('multi-step-form', 'user-interaction')
  }

  const span = startSpan(`form-step-${currentStep.value}`, 'form-step')
  currentStep.value++

  addLabels({
    form_step: currentStep.value,
    step_action: 'next'
  })

  if (span) {
    setTimeout(() => span.end(), 100)
  }
}

const prevStep = () => {
  const span = startSpan(`form-step-${currentStep.value}`, 'form-step')
  currentStep.value--

  addLabels({
    form_step: currentStep.value,
    step_action: 'previous'
  })

  if (span) {
    setTimeout(() => span.end(), 100)
  }
}

const submitMultiStep = async () => {
  const span = startSpan('form-submit', 'form-submit')

  // Simulate API submission
  await new Promise(resolve => setTimeout(resolve, 1000))

  setCustomContext({
    multi_step_form: {
      ...multiStepData,
      completed_at: new Date().toISOString()
    }
  })

  addLabels({
    form_completed: true,
    total_steps: 3
  })

  if (span) span.end()
  if (multiStepTransaction) {
    multiStepTransaction.end()
    multiStepTransaction = null
  }

  multiStepCompleted.value = true

  setTimeout(() => {
    multiStepCompleted.value = false
    currentStep.value = 1
  }, 3000)
}

// Track page view
onMounted(() => {
  console.log('Complex Interactions page mounted')
  addLabels({
    page_type: 'complex_interactions'
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

.steps-box {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 4px;
}

.step-item {
  padding: 0.75rem;
  margin: 0.5rem 0;
  background: #f8f9fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status {
  font-size: 1.2rem;
}

.duration {
  margin-left: auto;
  color: #666;
  font-size: 0.875rem;
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

.data-box pre {
  margin: 0;
  font-size: 0.875rem;
  white-space: pre-wrap;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: #005571;
}

.success-message {
  margin-top: 1rem;
  padding: 1rem;
  background: #d4edda;
  color: #155724;
  border-radius: 4px;
}

.multi-step-form {
  margin-top: 1rem;
}

.step {
  padding: 1.5rem;
  background: white;
  border-radius: 4px;
  margin-bottom: 1rem;
  opacity: 0.5;
  transition: all 0.3s;
}

.step.active {
  opacity: 1;
  border: 2px solid #005571;
}

.step h4 {
  margin-top: 0;
}

.step label {
  display: block;
  margin: 0.75rem 0;
  cursor: pointer;
}

.step input[type="checkbox"] {
  margin-right: 0.5rem;
}

.summary {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
}

.summary p {
  margin: 0.5rem 0;
}

.step-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
}
</style>
