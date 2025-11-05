<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled || loading"
    :aria-label="ariaLabel"
    @click="handleClick"
  >
    <span v-if="loading" class="btn-spinner"></span>
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
/**
 * RumButton - Reusable button component with automatic APM tracking
 *
 * Every button click is automatically tracked with:
 * - Current route path
 * - Parent component hierarchy
 * - Button label/text
 * - DOM information (classes, aria-label)
 *
 * Usage:
 * <RumButton variant="primary" @click="handleClick">Submit</RumButton>
 * <RumButton variant="danger" size="sm" :loading="isLoading">Delete</RumButton>
 * <RumButton :track-clicks="false">No Tracking</RumButton>
 */

type ButtonVariant = 'default' | 'primary' | 'success' | 'danger' | 'warning'
type ButtonSize = 'sm' | 'md'
type ButtonType = 'button' | 'submit' | 'reset'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  type?: ButtonType
  disabled?: boolean
  loading?: boolean
  ariaLabel?: string
  trackClicks?: boolean // Default true: automatically track button clicks
  actionName?: string // Optional custom action name
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  trackClicks: true // Enabled by default
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const route = useRoute()
const slots = useSlots()

// Always initialize component tracking to get hierarchy info
const { trackAction, componentName, hierarchyPath } = useComponentTracking({
  trackLifecycle: false,
  componentName: 'RumButton'
})

const buttonClasses = computed(() => {
  const classes = ['btn']

  // Variant class
  if (props.variant !== 'default') {
    classes.push(`btn-${props.variant}`)
  }

  // Size class
  if (props.size === 'sm') {
    classes.push('btn-sm')
  }

  return classes
})

// Extract button label from slot content or DOM
const getButtonLabel = (target: HTMLElement): string => {
  if (props.ariaLabel) {
    return props.ariaLabel
  }

  // Get text content from the button element
  const textContent = target.textContent?.trim()
  if (textContent) {
    return textContent
  }

  // Try to get from slot VNodes
  const defaultSlot = slots.default?.()
  if (defaultSlot && defaultSlot.length > 0) {
    const firstNode = defaultSlot[0]
    if (firstNode && typeof firstNode.children === 'string') {
      return firstNode.children.trim()
    }
  }

  return 'Unknown Button'
}

const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) {
    return
  }

  // Automatic APM tracking
  if (props.trackClicks) {
    const target = event.target as HTMLElement
    const buttonLabel = getButtonLabel(target)
    const actionName = props.actionName || `button-click: ${buttonLabel}`

    const parentElement = target.parentElement

    const span = trackAction(actionName, {
      // Route information
      route_path: route.path,
      route_name: route.name || 'unknown',
      route_params: Object.keys(route.params).length > 0 ? JSON.stringify(route.params) : undefined,

      // Button information
      button_label: buttonLabel,
      button_variant: props.variant,
      button_size: props.size,
      button_type: props.type,
      button_aria_label: props.ariaLabel,

      // Component hierarchy
      component_hierarchy: hierarchyPath,
      parent_component: componentName,

      // DOM information
      button_classes: buttonClasses.value.join(' '),
      button_id: target.id || undefined,
      parent_element_tag: parentElement?.tagName?.toLowerCase(),
      parent_element_class: parentElement?.className || undefined,
      parent_element_id: parentElement?.id || undefined,

      // Click position
      click_x: event.clientX,
      click_y: event.clientY,
      click_timestamp: Date.now()
    })

    if (span) {
      setTimeout(() => span.end(), 100)
    }
  }

  emit('click', event)
}
</script>

<style scoped>
.btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

.btn:hover:not(:disabled) {
  background: #f0f0f0;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #005571;
  color: white;
  border-color: #005571;
}

.btn-primary:hover:not(:disabled) {
  background: #004158;
}

.btn-success {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-warning {
  background: #ffc107;
  color: #000;
  border-color: #ffc107;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.btn-primary .btn-spinner,
.btn-success .btn-spinner,
.btn-danger .btn-spinner {
  border-color: rgba(255, 255, 255, 0.3);
  border-top-color: white;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
