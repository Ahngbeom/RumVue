<template>
  <div class="container">
    <h1>Component Tracking Demo</h1>
    <p>APM에서 컴포넌트를 추적하고 구분하는 방법 시연</p>

    <NuxtLink to="/" class="back-link">← Back to Home</NuxtLink>

    <!-- Component Info Display -->
    <div class="section info-section">
      <h2>Current Component Information</h2>
      <div class="info-box">
        <div class="info-item">
          <strong>Component Name:</strong>
          <span class="highlight">{{ componentInfo.name }}</span>
        </div>
        <div class="info-item">
          <strong>Component Hierarchy:</strong>
          <span class="hierarchy">{{ componentInfo.hierarchyPath }}</span>
        </div>
        <div class="info-item">
          <strong>Current Route:</strong>
          <span>{{ componentInfo.route }}</span>
        </div>
      </div>
    </div>

    <!-- Breadcrumbs Display -->
    <div class="section breadcrumbs-section">
      <h2>Component Breadcrumbs</h2>
      <p>사용자가 거쳐간 컴포넌트 경로 (최근 {{ breadcrumbs.length }}개)</p>
      <div class="breadcrumbs-container">
        <div
          v-for="(crumb, index) in breadcrumbs"
          :key="index"
          class="breadcrumb-item"
        >
          <span class="breadcrumb-index">{{ breadcrumbs.length - index }}</span>
          <div class="breadcrumb-content">
            <strong>{{ crumb.name }}</strong>
            <span class="breadcrumb-route">{{ crumb.route }}</span>
            <span class="breadcrumb-time">
              {{ formatTime(crumb.timestamp) }}
            </span>
          </div>
        </div>
      </div>
      <RumButton size="sm" @click="refreshBreadcrumbs">
        Refresh Breadcrumbs
      </RumButton>
    </div>

    <!-- Tracked Components Demo -->
    <div class="section">
      <h2>Tracked Components in Action</h2>
      <p>아래 컴포넌트들과 상호작용하면 APM에 자동으로 기록됩니다</p>

      <TrackedCard title="Welcome Card" :show-actions="true">
        <p>
          이 카드 컴포넌트는 자동으로 추적됩니다. 버튼을 클릭하면 액션이 APM에 기록되고,
          "Throw Error" 버튼을 클릭하면 에러와 함께 컴포넌트 정보가 전송됩니다.
        </p>
        <p>
          <strong>APM에서 확인할 수 있는 정보:</strong>
        </p>
        <ul>
          <li>컴포넌트 이름: TrackedCard</li>
          <li>컴포넌트 계층 구조: ComponentTrackingPage > TrackedCard</li>
          <li>Props: title, showActions</li>
          <li>액션 타입: card-button-click, error</li>
        </ul>
      </TrackedCard>

      <TrackedCard title="Nested Component Example" :show-actions="true">
        <p>컴포넌트 안에 다른 추적 컴포넌트를 중첩할 수 있습니다:</p>

        <TrackedList
          title="Sample Items"
          :items="sampleItems"
          @select="handleItemSelect"
        />

        <div v-if="selectedItem" class="selected-info">
          <strong>Selected:</strong> {{ selectedItem.name }}
        </div>
      </TrackedCard>
    </div>

    <!-- Form Demo -->
    <div class="section">
      <h2>Form Interaction Tracking</h2>
      <p>폼의 각 필드 상호작용과 제출 이벤트가 추적됩니다</p>

      <TrackedForm
        title="Contact Form"
        @submit="handleFormSubmit"
      />

      <div v-if="formSubmitted" class="success-message">
        Form submitted successfully! Check APM for tracking data.
      </div>
    </div>

    <!-- Manual Error Testing -->
    <div class="section">
      <h2>Error Tracking Demo</h2>
      <p>컴포넌트에서 발생한 에러를 추적하는 방법</p>

      <div class="error-demo">
        <RumButton variant="danger" @click="throwPageError">
          Throw Page-Level Error
        </RumButton>
        <RumButton variant="danger" @click="throwAsyncError">
          Throw Async Error
        </RumButton>
        <RumButton variant="danger" @click="throwNestedError">
          Throw Nested Component Error
        </RumButton>
      </div>

      <div class="error-info">
        <h4>에러 발생 시 APM에 기록되는 정보:</h4>
        <ul>
          <li>에러 메시지 및 스택 트레이스</li>
          <li>에러가 발생한 컴포넌트 이름</li>
          <li>컴포넌트 계층 구조 (부모 > 자식 > 손자)</li>
          <li>최근 10개의 컴포넌트 브레드크럼</li>
          <li>현재 라우트 정보</li>
          <li>추가 컨텍스트 (사용자 액션, 상태 등)</li>
        </ul>
      </div>
    </div>

    <!-- View in APM -->
    <div class="section apm-section">
      <h2>APM에서 확인하는 방법</h2>
      <div class="apm-instructions">
        <h4>1. 에러 확인:</h4>
        <p>APM > Errors 탭에서 다음 필터를 사용하세요:</p>
        <code>error_component: "ComponentName"</code>
        <code>error_hierarchy: "Parent > Child"</code>

        <h4>2. 트랜잭션 확인:</h4>
        <p>APM > Transactions 탭에서 다음을 확인하세요:</p>
        <code>component_name: "ComponentName"</code>
        <code>component_action: "action-name"</code>

        <h4>3. 커스텀 컨텍스트:</h4>
        <p>각 트랜잭션/에러의 "Metadata" 섹션에서 다음 정보를 확인할 수 있습니다:</p>
        <ul>
          <li><code>component.name</code> - 컴포넌트 이름</li>
          <li><code>component.hierarchy</code> - 컴포넌트 계층 배열</li>
          <li><code>error_component.breadcrumbs</code> - 최근 방문한 컴포넌트들</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

const { componentName, hierarchyPath, trackAction, trackError, getComponentInfo, getComponentBreadcrumbs } =
  useComponentTracking({
    trackLifecycle: true,
    trackProps: true,
    componentName: 'ComponentTrackingPage'
  })

// Component info
const componentInfo = reactive({
  name: componentName,
  hierarchyPath,
  route: useRoute().path
})

// Breadcrumbs
const breadcrumbs = ref(getComponentBreadcrumbs(10).reverse())

const refreshBreadcrumbs = () => {
  breadcrumbs.value = getComponentBreadcrumbs(10).reverse()
  console.log('Breadcrumbs refreshed:', breadcrumbs.value)
}

// Sample data for list
const sampleItems = ref([
  { id: 1, name: 'Item One', description: 'First tracked item' },
  { id: 2, name: 'Item Two', description: 'Second tracked item' },
  { id: 3, name: 'Item Three', description: 'Third tracked item' },
  { id: 4, name: 'Item Four', description: 'Fourth tracked item' }
])

const selectedItem = ref<any>(null)

const handleItemSelect = (item: any) => {
  selectedItem.value = item

  const span = trackAction('item-selected-on-page', {
    item_id: item.id,
    item_name: item.name
  })

  if (span) {
    setTimeout(() => span.end(), 100)
  }
}

// Form handling
const formSubmitted = ref(false)

const handleFormSubmit = (data: Record<string, string>) => {
  console.log('Form submitted:', data)

  const span = trackAction('form-submission-received', {
    form_fields: Object.keys(data)
  })

  formSubmitted.value = true

  setTimeout(() => {
    formSubmitted.value = false
  }, 3000)

  if (span) {
    setTimeout(() => span.end(), 100)
  }
}

// Error handling
const throwPageError = () => {
  try {
    throw new Error('Test error from ComponentTrackingPage')
  } catch (error: any) {
    trackError(error, {
      error_source: 'page_level',
      user_action: 'button_click',
      test_type: 'synchronous_error'
    })
  }
}

const throwAsyncError = async () => {
  try {
    await new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Test async error from ComponentTrackingPage'))
      }, 500)
    })
  } catch (error: any) {
    trackError(error, {
      error_source: 'page_level',
      user_action: 'button_click',
      test_type: 'asynchronous_error'
    })
  }
}

const throwNestedError = () => {
  // This will be caught by the first TrackedCard component
  const cardElement = document.querySelector('.tracked-card .btn-danger')
  if (cardElement) {
    (cardElement as HTMLElement).click()
  }
}

// Format timestamp
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Update breadcrumbs on mount
onMounted(() => {
  refreshBreadcrumbs()
  console.log('Component Tracking Demo mounted')
  console.log('Component info:', getComponentInfo())
})
</script>

<style scoped>
.container {
  max-width: 1000px;
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

.info-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.info-section h2 {
  color: white;
}

.info-box {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.info-item:last-child {
  border-bottom: none;
}

.info-item strong {
  font-size: 0.9375rem;
}

.highlight {
  background: rgba(255, 255, 255, 0.3);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 600;
}

.hierarchy {
  font-family: monospace;
  font-size: 0.875rem;
  background: rgba(255, 255, 255, 0.3);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}

.breadcrumbs-section {
  background: #fff;
  border: 2px solid #e0e0e0;
}

.breadcrumbs-container {
  max-height: 300px;
  overflow-y: auto;
  margin: 1rem 0;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fafafa;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #e0e0e0;
  background: white;
}

.breadcrumb-item:last-child {
  border-bottom: none;
}

.breadcrumb-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #005571;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.875rem;
  margin-right: 1rem;
  flex-shrink: 0;
}

.breadcrumb-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.breadcrumb-content strong {
  color: #2c3e50;
}

.breadcrumb-route {
  color: #6c757d;
  font-size: 0.875rem;
}

.breadcrumb-time {
  color: #999;
  font-size: 0.75rem;
  font-family: monospace;
}

.selected-info {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  color: #155724;
}

.success-message {
  margin-top: 1rem;
  padding: 1rem;
  background: #d4edda;
  color: #155724;
  border-radius: 4px;
  border: 1px solid #c3e6cb;
}

.error-demo {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.error-info {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  padding: 1.25rem;
}

.error-info h4 {
  margin-top: 0;
  color: #856404;
}

.error-info ul {
  margin-bottom: 0;
  color: #856404;
}

.apm-section {
  background: #e3f2fd;
  border: 2px solid #2196f3;
}

.apm-instructions h4 {
  color: #1565c0;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.apm-instructions h4:first-child {
  margin-top: 0;
}

.apm-instructions code {
  display: block;
  background: #fff;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  margin: 0.5rem 0;
  font-family: monospace;
  color: #d32f2f;
  border-left: 3px solid #2196f3;
}

.apm-instructions ul {
  margin-top: 0.5rem;
}
</style>
