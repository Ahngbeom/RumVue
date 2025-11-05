<template>
  <div class="tracked-form">
    <div class="form-header">
      <h4>{{ title }}</h4>
      <span class="component-badge">{{ componentName }}</span>
    </div>
    <form @submit.prevent="handleSubmit" class="form-content">
      <div class="form-group">
        <label>Name</label>
        <input
          v-model="formData.name"
          type="text"
          class="form-input"
          placeholder="Enter your name"
          @focus="trackFieldFocus('name')"
          @blur="trackFieldBlur('name')"
        />
      </div>

      <div class="form-group">
        <label>Email</label>
        <input
          v-model="formData.email"
          type="email"
          class="form-input"
          placeholder="Enter your email"
          @focus="trackFieldFocus('email')"
          @blur="trackFieldBlur('email')"
        />
      </div>

      <div class="form-group">
        <label>Message</label>
        <textarea
          v-model="formData.message"
          class="form-input"
          rows="4"
          placeholder="Enter your message"
          @focus="trackFieldFocus('message')"
          @blur="trackFieldBlur('message')"
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">
          Submit
        </button>
        <button type="button" @click="handleReset" class="btn">
          Reset
        </button>
        <button type="button" @click="throwFormError" class="btn btn-danger">
          Trigger Error
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
}>()

const emit = defineEmits<{
  submit: [data: Record<string, string>]
}>()

const { componentName, trackAction, trackError } = useComponentTracking({
  trackLifecycle: true,
  trackProps: true
})

const formData = reactive({
  name: '',
  email: '',
  message: ''
})

const trackFieldFocus = (fieldName: string) => {
  const span = trackAction('field-focus', {
    field_name: fieldName,
    form_title: props.title
  })

  if (span) {
    setTimeout(() => span.end(), 50)
  }
}

const trackFieldBlur = (fieldName: string) => {
  const span = trackAction('field-blur', {
    field_name: fieldName,
    field_value_length: (formData[fieldName as keyof typeof formData] || '').length,
    form_title: props.title
  })

  if (span) {
    setTimeout(() => span.end(), 50)
  }
}

const handleSubmit = () => {
  const span = trackAction('form-submit', {
    form_title: props.title,
    form_data: {
      name_length: formData.name.length,
      email_length: formData.email.length,
      message_length: formData.message.length
    }
  })

  emit('submit', { ...formData })

  if (span) {
    setTimeout(() => span.end(), 100)
  }
}

const handleReset = () => {
  const span = trackAction('form-reset', {
    form_title: props.title
  })

  formData.name = ''
  formData.email = ''
  formData.message = ''

  if (span) {
    setTimeout(() => span.end(), 50)
  }
}

const throwFormError = () => {
  try {
    throw new Error(`Form validation error in ${props.title}`)
  } catch (error: any) {
    trackError(error, {
      form_title: props.title,
      form_state: { ...formData }
    })
  }
}
</script>

<style scoped>
.tracked-form {
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  overflow: hidden;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #ddd;
}

.form-header h4 {
  margin: 0;
  font-size: 1rem;
  color: #2c3e50;
}

.component-badge {
  background: #28a745;
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}

.form-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.875rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 0.9375rem;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #005571;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.625rem 1.25rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.9375rem;
  transition: all 0.3s;
}

.btn:hover {
  background: #f0f0f0;
}

.btn-primary {
  background: #005571;
  color: white;
  border-color: #005571;
}

.btn-primary:hover {
  background: #004158;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.btn-danger:hover {
  background: #c82333;
}
</style>
