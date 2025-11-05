<template>
  <div class="tracked-card">
    <div class="card-header">
      <h3>{{ title }}</h3>
      <span class="component-badge">{{ componentName }}</span>
    </div>
    <div class="card-body">
      <slot></slot>
    </div>
    <div class="card-footer" v-if="showActions">
      <button @click="handleAction" class="btn btn-sm">
        Track Action
      </button>
      <button @click="throwError" class="btn btn-sm btn-danger">
        Throw Error
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  showActions?: boolean
}>()

const { componentName, trackAction, trackError } = useComponentTracking({
  trackLifecycle: true,
  trackProps: true
})

const handleAction = () => {
  const span = trackAction('card-button-click', {
    title: props.title,
    action: 'button_clicked'
  })

  console.log(`Action tracked in ${componentName}`)

  setTimeout(() => {
    if (span) span.end()
  }, 100)
}

const throwError = () => {
  try {
    throw new Error(`Test error from ${props.title}`)
  } catch (error: any) {
    trackError(error, {
      user_action: 'button_click',
      card_title: props.title
    })
  }
}
</script>

<style scoped>
.tracked-card {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  margin: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.component-badge {
  background: #005571;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.card-body {
  padding: 1.5rem;
}

.card-footer {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s;
}

.btn:hover {
  background: #f0f0f0;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
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
