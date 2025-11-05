<template>
  <div class="tracked-list-item" @click="handleClick">
    <div class="item-content">
      <div class="item-name">{{ item.name }}</div>
      <div class="item-description" v-if="item.description">
        {{ item.description }}
      </div>
    </div>
    <span class="component-badge">{{ componentName }}</span>
  </div>
</template>

<script setup lang="ts">
interface ListItem {
  id: number
  name: string
  description?: string
}

const props = defineProps<{
  item: ListItem
}>()

const emit = defineEmits<{
  select: [item: ListItem]
}>()

const { componentName, trackAction } = useComponentTracking({
  trackLifecycle: true,
  trackProps: true
})

const handleClick = () => {
  const span = trackAction('item-clicked', {
    item_id: props.item.id,
    item_name: props.item.name
  })

  emit('select', props.item)

  if (span) {
    setTimeout(() => span.end(), 30)
  }
}
</script>

<style scoped>
.tracked-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.tracked-list-item:hover {
  background: #f8f9fa;
}

.tracked-list-item:last-child {
  border-bottom: none;
}

.item-content {
  flex: 1;
}

.item-name {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.item-description {
  font-size: 0.875rem;
  color: #6c757d;
}

.component-badge {
  background: #6c757d;
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 600;
}
</style>
