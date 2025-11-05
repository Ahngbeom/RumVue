<template>
  <div class="tracked-list">
    <div class="list-header">
      <h4>{{ title }}</h4>
      <span class="component-badge">{{ componentName }}</span>
    </div>
    <div class="list-items">
      <TrackedListItem
        v-for="item in items"
        :key="item.id"
        :item="item"
        @select="handleSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface ListItem {
  id: number
  name: string
  description?: string
}

const props = defineProps<{
  title: string
  items: ListItem[]
}>()

const emit = defineEmits<{
  select: [item: ListItem]
}>()

const { componentName, trackAction } = useComponentTracking({
  trackLifecycle: true,
  trackProps: true
})

const handleSelect = (item: ListItem) => {
  const span = trackAction('list-item-selected', {
    item_id: item.id,
    item_name: item.name,
    list_title: props.title
  })

  emit('select', item)

  if (span) {
    setTimeout(() => span.end(), 50)
  }
}
</script>

<style scoped>
.tracked-list {
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #ddd;
}

.list-header h4 {
  margin: 0;
  font-size: 1rem;
  color: #2c3e50;
}

.component-badge {
  background: #17a2b8;
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}

.list-items {
  max-height: 300px;
  overflow-y: auto;
}
</style>
