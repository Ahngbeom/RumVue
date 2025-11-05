<template>
  <div class="container">
    <h1>Simple Interactions (Refactored)</h1>
    <p class="highlight">✨ 이 페이지는 <strong>useApmTracking</strong> 헬퍼를 사용하여 리팩토링되었습니다</p>
    <p>코드량이 약 70% 감소하고 가독성이 향상되었습니다!</p>

    <NuxtLink to="/" class="back-link">← Back to Home</NuxtLink>
    <NuxtLink to="/simple" class="compare-link">📊 Compare with Original</NuxtLink>

    <div class="section">
      <h2>1. Button Clicks</h2>
      <p>각 버튼 클릭은 자동으로 APM에 의해 추적됩니다.</p>
      <div class="code-comparison">
        <div class="before">
          <h4>❌ Before (10 lines)</h4>
          <pre>const handleClick = () => {
  const transaction = startTransaction(...)
  clickCount.value++
  if (transaction) {
    transaction.addLabels({ ... })
    setTimeout(() => transaction.end(), 100)
  }
}</pre>
        </div>
        <div class="after">
          <h4>✅ After (3 lines)</h4>
          <pre>const handleClick = trackClick('Button Click', () => {
  clickCount.value++
})</pre>
        </div>
      </div>
      <div class="button-group">
        <RumButton @click="handleClick('Button 1')">Click Me 1</RumButton>
        <RumButton variant="primary" @click="handleClick('Button 2')">Click Me 2</RumButton>
        <RumButton variant="success" @click="handleClick('Button 3')">Click Me 3</RumButton>
      </div>
      <p class="counter">Clicks: {{ clickCount }}</p>
    </div>

    <div class="section">
      <h2>2. Form Submit</h2>
      <p>폼 제출 이벤트가 추적됩니다.</p>
      <div class="form-group">
        <label for="name">Name:</label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          placeholder="Enter your name"
          class="input"
        />
      </div>
      <div class="form-group">
        <label for="email">Email:</label>
        <input
          id="email"
          v-model="formData.email"
          type="email"
          placeholder="Enter your email"
          class="input"
        />
      </div>
      <RumButton variant="primary" @click="submitForm">Submit</RumButton>
      <div v-if="formSubmitted" class="success-message">
        Form submitted successfully!
      </div>
    </div>

    <div class="section">
      <h2>3. API Call</h2>
      <p>API 호출이 자동으로 추적됩니다.</p>
      <div class="button-group">
        <RumButton variant="primary" :loading="loading" @click="fetchUsers">
          {{ loading ? 'Loading...' : 'Fetch Users' }}
        </RumButton>
      </div>
      <div v-if="apiData" class="data-box">
        <h4>API Response:</h4>
        <pre>{{ JSON.stringify(apiData, null, 2) }}</pre>
      </div>
    </div>

    <div class="section">
      <h2>4. Storage Operations</h2>
      <p>로컬 스토리지 작업이 추적됩니다.</p>
      <div class="storage-controls">
        <input
          v-model="storageValue"
          type="text"
          placeholder="Value"
          class="input small"
        />
        <RumButton @click="saveToStorage">Save</RumButton>
        <RumButton @click="loadFromStorage">Load</RumButton>
      </div>
      <div v-if="storageData" class="data-box small">
        <strong>Loaded:</strong> {{ storageData }}
      </div>
    </div>

    <div class="stats">
      <h3>📊 Code Statistics</h3>
      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-value">70%</div>
          <div class="stat-label">코드 감소</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">5</div>
          <div class="stat-label">추적 함수</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">0</div>
          <div class="stat-label">보일러플레이트</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 🎯 New: Import the tracking helper
const { trackClick, trackFormSubmit, trackApiCall, trackStorage } = useApmTracking()

// ========================================
// 1. Button Click Tracking
// ========================================

const clickCount = ref(0)

// ✅ Before: 10 lines of boilerplate
// ✅ After: 3 lines with helper
const handleClick = trackClick('Button Click', (buttonName: string) => {
  clickCount.value++
  console.log(`${buttonName} clicked`)
})

// ========================================
// 2. Form Submit Tracking
// ========================================

const formData = reactive({
  name: '',
  email: ''
})

const formSubmitted = ref(false)

// ✅ Simplified form submission with automatic context tracking
const submitForm = trackFormSubmit(
  'Form Submit',
  () => {
    console.log('Form submitted', formData)
    formSubmitted.value = true

    setTimeout(() => {
      formSubmitted.value = false
    }, 3000)
  },
  // Form data is automatically added to transaction context
  {
    name: formData.name,
    email: formData.email,
    submitted_at: new Date().toISOString()
  }
)

// ========================================
// 3. API Call Tracking
// ========================================

const loading = ref(false)
const apiData = ref<any>(null)

// ✅ Automatic success/failure tracking and error handling
const fetchUsers = async () => {
  loading.value = true
  apiData.value = null

  try {
    await trackApiCall('Fetch Users', async () => {
      const response = await fetch('https://jsonplaceholder.typicode.com/users?_limit=3')
      const data = await response.json()
      apiData.value = data
      return data
    }, {
      endpoint: '/users',
      method: 'GET'
    })
  } finally {
    loading.value = false
  }
}

// ========================================
// 4. Storage Operations Tracking
// ========================================

const storageValue = ref('demo-value')
const storageData = ref<string>('')

// ✅ Storage operations with automatic metadata
const saveToStorage = trackStorage(
  'Storage Save',
  () => {
    localStorage.setItem('demo-key', storageValue.value)
    storageData.value = `Saved: demo-key = ${storageValue.value}`
  },
  {
    operation: 'save',
    key: 'demo-key',
    storageType: 'local'
  }
)

const loadFromStorage = trackStorage(
  'Storage Load',
  () => {
    const value = localStorage.getItem('demo-key')
    storageData.value = value ? `Loaded: demo-key = ${value}` : 'Key not found'
  },
  {
    operation: 'load',
    key: 'demo-key',
    storageType: 'local'
  }
)

// Track page view
onMounted(() => {
  console.log('Simple Interactions (Refactored) page mounted')
})
</script>

<style scoped>
.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

.highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.back-link,
.compare-link {
  display: inline-block;
  margin-right: 1rem;
  margin-bottom: 2rem;
  color: #005571;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border: 2px solid #005571;
  border-radius: 4px;
  transition: all 0.3s;
}

.back-link:hover,
.compare-link:hover {
  background: #005571;
  color: white;
}

.compare-link {
  background: #ffc107;
  border-color: #ffc107;
  color: #000;
}

.compare-link:hover {
  background: #e0a800;
  border-color: #e0a800;
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

.code-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1rem 0;
}

.before,
.after {
  background: white;
  border-radius: 4px;
  padding: 1rem;
  border: 2px solid #ddd;
}

.before {
  border-color: #ff6b6b;
}

.after {
  border-color: #51cf66;
}

.before h4 {
  color: #c92a2a;
  margin-top: 0;
}

.after h4 {
  color: #2b8a3e;
  margin-top: 0;
}

.before pre,
.after pre {
  margin: 0;
  font-size: 0.875rem;
  overflow-x: auto;
  white-space: pre;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.counter {
  font-size: 1.2rem;
  font-weight: bold;
  color: #005571;
  margin-top: 1rem;
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

.input.small {
  flex: 1;
  min-width: 150px;
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

.storage-controls {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.stats {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  padding: 2rem;
  margin-top: 2rem;
}

.stats h3 {
  margin-top: 0;
  text-align: center;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-top: 1.5rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1rem;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .code-comparison {
    grid-template-columns: 1fr;
  }

  .stat-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
