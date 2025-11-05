<template>
  <div class="container">
    <h1>Simple Interactions</h1>
    <p>간단한 브라우저 사용자 상호작용 예제</p>

    <NuxtLink to="/" class="back-link">← Back to Home</NuxtLink>

    <div class="section">
      <h2>1. Button Clicks</h2>
      <p>각 버튼 클릭은 자동으로 APM에 의해 추적됩니다.</p>
      <div class="button-group">
        <RumButton @click="handleClick('Button 1')">Click Me 1</RumButton>
        <RumButton variant="primary" @click="handleClick('Button 2')">Click Me 2</RumButton>
        <RumButton variant="success" @click="handleClick('Button 3')">Click Me 3</RumButton>
      </div>
      <p class="counter">Clicks: {{ clickCount }}</p>
    </div>

    <div class="section">
      <h2>2. Form Input</h2>
      <p>폼 입력 이벤트가 추적됩니다.</p>
      <div class="form-group">
        <label for="name">Name:</label>
        <input
          id="name"
          v-model="formData.name"
          @input="handleInput('name')"
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
          @input="handleInput('email')"
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
      <h2>3. Toggle & Checkbox</h2>
      <p>상태 변경 이벤트가 추적됩니다.</p>
      <div class="toggle-group">
        <label>
          <input
            v-model="toggleState"
            @change="handleToggle"
            type="checkbox"
          />
          Toggle Option ({{ toggleState ? 'ON' : 'OFF' }})
        </label>
      </div>
      <div class="checkbox-group">
        <label v-for="option in checkboxOptions" :key="option.id">
          <input
            v-model="option.checked"
            @change="handleCheckbox(option.id)"
            type="checkbox"
          />
          {{ option.label }}
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { startTransaction, addLabels, setCustomContext } = useApm()

// Click tracking
const clickCount = ref(0)

const handleClick = (buttonName: string) => {
  // Start a transaction for this interaction
  const transaction = startTransaction(`Button Click: ${buttonName}`, 'user-interaction')

  clickCount.value++
  console.log(`${buttonName} clicked`)
  console.log('Transaction created:', transaction)

  // Add custom labels for this interaction
  if (transaction) {
    transaction.addLabels({
      interaction_type: 'button_click',
      button_name: buttonName,
      click_count: clickCount.value
    })

    // Keep transaction alive for 100ms to ensure it's captured
    setTimeout(() => {
      console.log('Ending transaction:', transaction.name)
      transaction.end()
    }, 100)
  }
}

// Form tracking
const formData = reactive({
  name: '',
  email: ''
})

const formSubmitted = ref(false)

const handleInput = (field: string) => {
  // Start a transaction for this interaction
  const transaction = startTransaction(`Form Input: ${field}`, 'user-interaction')

  console.log(`Input changed: ${field}`)

  if (transaction) {
    transaction.addLabels({
      interaction_type: 'form_input',
      field_name: field
    })
    transaction.end()
  }
}

const submitForm = () => {
  // Start a transaction for form submission
  const transaction = startTransaction('Form Submit', 'user-interaction')

  console.log('Form submitted', formData)
  formSubmitted.value = true

  // Set custom context for form submission (global context)
  setCustomContext({
    form_data: {
      name: formData.name,
      email: formData.email,
      submitted_at: new Date().toISOString()
    }
  })

  if (transaction) {
    transaction.addLabels({
      interaction_type: 'form_submit',
      has_name: !!formData.name,
      has_email: !!formData.email
    })

    transaction.end()
  }

  setTimeout(() => {
    formSubmitted.value = false
  }, 3000)
}

// Toggle & Checkbox tracking
const toggleState = ref(false)

const checkboxOptions = reactive([
  { id: 'opt1', label: 'Option 1', checked: false },
  { id: 'opt2', label: 'Option 2', checked: false },
  { id: 'opt3', label: 'Option 3', checked: false }
])

const handleToggle = () => {
  // Start a transaction for this interaction
  const transaction = startTransaction('Toggle Change', 'user-interaction')

  console.log('Toggle changed:', toggleState.value)

  if (transaction) {
    transaction.addLabels({
      interaction_type: 'toggle',
      toggle_state: toggleState.value
    })
    transaction.end()
  }
}

const handleCheckbox = (optionId: string) => {
  // Start a transaction for this interaction
  const transaction = startTransaction(`Checkbox: ${optionId}`, 'user-interaction')

  const option = checkboxOptions.find(opt => opt.id === optionId)
  console.log(`Checkbox ${optionId} changed:`, option?.checked)

  if (transaction) {
    transaction.addLabels({
      interaction_type: 'checkbox',
      checkbox_id: optionId,
      checkbox_state: option?.checked ?? false
    })
    transaction.end()
  }
}

// Track page view
onMounted(() => {
  console.log('Simple Interactions page mounted')
  addLabels({
    page_type: 'simple_interactions'
  })
})
</script>

<style scoped>
.container {
  max-width: 800px;
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

.toggle-group,
.checkbox-group {
  margin: 1rem 0;
}

.toggle-group label,
.checkbox-group label {
  display: block;
  margin-bottom: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.toggle-group input,
.checkbox-group input {
  margin-right: 0.5rem;
  cursor: pointer;
}
</style>
