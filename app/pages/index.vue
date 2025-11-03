<template>
  <div class="container">
    <h1>RumVue: Elastic APM RUM Demo</h1>
    <p>Vue.js & Nuxt.js 환경에서 Elastic APM RUM 연동 데모</p>

    <div class="nav-cards">
      <NuxtLink to="/simple" class="card">
        <h2>1. Simple Interactions</h2>
        <p>간단한 브라우저 사용자 상호작용</p>
        <ul>
          <li>Button clicks</li>
          <li>Form inputs</li>
          <li>Basic navigation</li>
        </ul>
      </NuxtLink>

      <NuxtLink to="/diverse" class="card">
        <h2>2. Diverse Interactions</h2>
        <p>다양한 브라우저 사용자 상호작용</p>
        <ul>
          <li>API calls</li>
          <li>Timer operations</li>
          <li>Error tracking</li>
        </ul>
      </NuxtLink>

      <NuxtLink to="/complex" class="card">
        <h2>3. Complex Interactions</h2>
        <p>복잡한 브라우저 사용자 상호작용</p>
        <ul>
          <li>Custom transactions</li>
          <li>Nested spans</li>
          <li>User context tracking</li>
        </ul>
      </NuxtLink>

      <NuxtLink to="/simple-refactored" class="card refactored">
        <h2>✨ Simple (Refactored)</h2>
        <p>useApmTracking 헬퍼 사용 예제</p>
        <ul>
          <li>코드량 70% 감소</li>
          <li>자동 에러 처리</li>
          <li>Before/After 비교</li>
        </ul>
      </NuxtLink>

      <NuxtLink to="/debug-apm" class="card debug">
        <h2>🔧 Debug APM</h2>
        <p>APM 트랜잭션 디버깅 페이지</p>
        <ul>
          <li>Transaction creation test</li>
          <li>Console debugging</li>
          <li>Network request inspection</li>
        </ul>
      </NuxtLink>
    </div>

    <div class="info-box">
      <h3>APM Status</h3>
      <p>Service: <strong>{{ serviceName }}</strong></p>
      <p>Environment: <strong>{{ environment }}</strong></p>
      <p v-if="isApmActive" class="status active">✓ APM is active</p>
      <p v-else class="status inactive">✗ APM is not initialized</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { apm } = useApm()

const serviceName = ref('rumvue-demo')
const environment = ref('development')
const isApmActive = computed(() => !!apm)

onMounted(() => {
  console.log('APM initialized:', !!apm)
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.nav-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin: 3rem 0;
}

.card {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s;
}

.card:hover {
  border-color: #005571;
  box-shadow: 0 4px 12px rgba(0, 85, 113, 0.15);
  transform: translateY(-4px);
}

.card h2 {
  color: #005571;
  margin-top: 0;
}

.card.refactored {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.card.refactored:hover {
  border-color: #764ba2;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.card.debug {
  border-color: #ffc107;
  background: #fffbf0;
}

.card.debug:hover {
  border-color: #ff9800;
}

.card ul {
  margin: 1rem 0 0 0;
  padding-left: 1.5rem;
  color: #666;
}

.info-box {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 3rem;
}

.info-box h3 {
  margin-top: 0;
}

.status {
  font-weight: bold;
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.status.active {
  background: #d4edda;
  color: #155724;
}

.status.inactive {
  background: #f8d7da;
  color: #721c24;
}
</style>
