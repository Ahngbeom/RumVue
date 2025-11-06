<template>
  <div class="container">
    <h1>🚀 Component Performance Tracking</h1>
    <p class="description">
      이 페이지는 Vue 컴포넌트의 렌더링 성능, 메모리 사용량, 업데이트 성능을 실시간으로 추적합니다.
    </p>

    <div class="info-box">
      <h3>📊 추적되는 메트릭</h3>
      <ul>
        <li><strong>Render Time</strong>: 컴포넌트 마운트 시작부터 완료까지 소요 시간</li>
        <li><strong>Memory</strong>: JS 힙 메모리 사용량 (Chrome/Edge만 지원)</li>
        <li><strong>Updates</strong>: 컴포넌트 업데이트(re-render) 횟수</li>
        <li><strong>Avg Update Time</strong>: 평균 업데이트 소요 시간</li>
      </ul>

      <h3>🔍 Performance Timeline 확인</h3>
      <ol>
        <li>브라우저 DevTools 열기 (F12)</li>
        <li><strong>Performance</strong> 탭 선택</li>
        <li>🔴 <strong>Record</strong> 버튼 클릭 → 페이지 상호작용 → ⏹️ <strong>Stop</strong></li>
        <li><strong>User Timing</strong> 섹션에서 컴포넌트별 렌더링/업데이트 타임라인 확인</li>
      </ol>
    </div>

    <!-- Lightweight Component -->
    <section>
      <h2>⚡ Lightweight Component (빠른 렌더링)</h2>
      <TrackedPerformance
        title="Fast Component"
        :showMetrics="true"
        :showActions="true"
      >
        <p>이 컴포넌트는 최소한의 DOM 요소만 렌더링합니다.</p>
        <p>렌더링 시간이 매우 짧습니다 (일반적으로 &lt; 5ms).</p>
      </TrackedPerformance>
    </section>

    <!-- Medium Component -->
    <section>
      <h2>📦 Medium Component (중간 렌더링)</h2>
      <TrackedPerformance
        title="Medium Component"
        :showMetrics="true"
        :showActions="true"
      >
        <div class="grid">
          <div v-for="i in 50" :key="i" class="grid-item">
            Item {{ i }}
          </div>
        </div>
      </TrackedPerformance>
    </section>

    <!-- Heavy Component -->
    <section>
      <h2>🏋️ Heavy Component (무거운 연산)</h2>
      <TrackedPerformance
        title="Heavy Component"
        :showMetrics="true"
        :showActions="true"
      >
        <div class="heavy-content">
          <p>무거운 연산 결과: {{ heavyComputation }}</p>
          <div class="large-list">
            <div v-for="item in heavyList" :key="item" class="list-item">
              <span class="badge">{{ item }}</span>
              <span>{{ generateRandomText() }}</span>
            </div>
          </div>
        </div>
      </TrackedPerformance>
    </section>

    <!-- Auto-updating Component -->
    <section>
      <h2>🔄 Auto-updating Component (빈번한 업데이트)</h2>
      <TrackedPerformance
        title="Auto-updating Component"
        :showMetrics="true"
        :showActions="true"
      >
        <div class="auto-update">
          <p>현재 시간: <strong>{{ currentTime }}</strong></p>
          <p>업데이트 횟수: <strong>{{ updateCounter }}</strong></p>
          <RumButton @click="toggleAutoUpdate">
            {{ isAutoUpdating ? '⏸️ Stop Auto-update' : '▶️ Start Auto-update' }}
          </RumButton>
        </div>
      </TrackedPerformance>
    </section>

    <!-- Performance Comparison -->
    <section>
      <h2>📈 Performance Comparison</h2>
      <div class="comparison-grid">
        <TrackedPerformance
          v-for="i in 3"
          :key="i"
          :title="`Component ${i}`"
          :showMetrics="true"
        >
          <p>Comparison component {{ i }}</p>
          <div v-for="j in i * 10" :key="j" class="mini-item">
            {{ j }}
          </div>
        </TrackedPerformance>
      </div>
    </section>

    <!-- APM Integration Info -->
    <div class="info-box apm-info">
      <h3>📡 Elastic APM Integration</h3>
      <p>
        모든 성능 메트릭은 Elastic APM으로 자동 전송됩니다.
        Kibana에서 확인하세요:
      </p>
      <ol>
        <li><a href="http://localhost:5601" target="_blank">Kibana</a> 접속</li>
        <li><strong>Observability → APM</strong> 메뉴</li>
        <li><strong>Services → rumvue-demo</strong> 선택</li>
        <li><strong>Transactions</strong> 탭에서 "component-render" 필터링</li>
        <li>컴포넌트별 렌더링 시간 분석</li>
      </ol>

      <h4>🔎 검색 쿼리 예시:</h4>
      <div class="code-block">
        <code>labels.component_name: "TrackedPerformance"</code><br>
        <code>labels.render_time_ms > 50</code><br>
        <code>transaction.type: "component-render"</code>
      </div>
    </div>

    <div class="navigation">
      <NuxtLink to="/">← Home</NuxtLink>
      <NuxtLink to="/component-tracking">Component Tracking →</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Heavy computation (CPU intensive)
const heavyComputation = computed(() => {
  let result = 0
  for (let i = 0; i < 100000; i++) {
    result += Math.sqrt(i)
  }
  return result.toFixed(2)
})

// Heavy list
const heavyList = computed(() => {
  return Array.from({ length: 100 }, (_, i) => i + 1)
})

// Random text generator
const generateRandomText = () => {
  const words = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit']
  const count = Math.floor(Math.random() * 5) + 3
  return Array.from({ length: count }, () => words[Math.floor(Math.random() * words.length)]).join(' ')
}

// Auto-update functionality
const currentTime = ref(new Date().toLocaleTimeString())
const updateCounter = ref(0)
const isAutoUpdating = ref(false)
let updateInterval: any = null

const toggleAutoUpdate = () => {
  isAutoUpdating.value = !isAutoUpdating.value

  if (isAutoUpdating.value) {
    updateInterval = setInterval(() => {
      currentTime.value = new Date().toLocaleTimeString()
      updateCounter.value++
    }, 1000)
  } else {
    if (updateInterval) {
      clearInterval(updateInterval)
      updateInterval = null
    }
  }
}

onMounted(() => {
  console.log('[Performance Page] Mounted - Check Performance tab in DevTools!')
  console.log('Run this in console: performance.getEntriesByType("measure")')
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.description {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin-bottom: 2rem;
}

section {
  margin-bottom: 3rem;
}

h2 {
  color: #34495e;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #ecf0f1;
}

.info-box {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.info-box h3 {
  margin-top: 1rem;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
}

.info-box h3:first-child {
  margin-top: 0;
}

.info-box ul,
.info-box ol {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.info-box li {
  margin: 0.5rem 0;
  line-height: 1.6;
}

.apm-info {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.apm-info h4 {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.apm-info a {
  color: white;
  text-decoration: underline;
  font-weight: 600;
}

.code-block {
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 8px;
  margin-top: 0.5rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.code-block code {
  display: block;
  margin: 0.25rem 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
}

.grid-item {
  background: #ecf0f1;
  padding: 0.75rem;
  border-radius: 6px;
  text-align: center;
  font-size: 0.875rem;
}

.heavy-content {
  font-size: 0.95rem;
}

.large-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  background: #f8f9fa;
}

.list-item {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.5rem;
  margin: 0.25rem 0;
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.badge {
  background: #3498db;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
}

.auto-update {
  text-align: center;
  padding: 1rem;
}

.auto-update p {
  font-size: 1.1rem;
  margin: 1rem 0;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.mini-item {
  display: inline-block;
  background: #e8f4f8;
  padding: 0.25rem 0.5rem;
  margin: 0.125rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 2px solid #ecf0f1;
}

.navigation a {
  color: #3498db;
  text-decoration: none;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border: 2px solid #3498db;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.navigation a:hover {
  background: #3498db;
  color: white;
}
</style>
