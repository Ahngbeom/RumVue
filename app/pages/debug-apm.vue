<template>
  <div class="container">
    <h1>APM Debug Page</h1>
    <p>이 페이지는 APM 트랜잭션이 제대로 생성되는지 디버깅하기 위한 페이지입니다.</p>

    <NuxtLink to="/" class="back-link">← Back to Home</NuxtLink>

    <div class="section">
      <h2>Debug Information</h2>
      <div class="info-box">
        <p><strong>APM Instance:</strong> {{ apmStatus }}</p>
        <p><strong>Test Results:</strong></p>
        <pre>{{ testResults }}</pre>
      </div>
    </div>

    <div class="section">
      <h2>Test Transactions</h2>
      <div class="button-group">
        <RumButton variant="primary" @click="testSimpleTransaction">
          Test Simple Transaction
        </RumButton>
        <RumButton variant="primary" @click="testTransactionWithLabels">
          Test Transaction with Labels
        </RumButton>
        <RumButton variant="success" @click="testManualTransaction">
          Test Manual Transaction
        </RumButton>
      </div>
    </div>

    <div class="section">
      <h2>Console Instructions</h2>
      <ol>
        <li>브라우저 개발자 도구(F12) 열기</li>
        <li>Console 탭으로 이동</li>
        <li>위 버튼 클릭</li>
        <li>콘솔에서 APM 로그 확인</li>
        <li>Network 탭에서 <code>intake/v2/rum</code> 요청 확인</li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
const { apm, startTransaction } = useApm()

// Check if APM is initialized
const apmStatus = computed(() => {
  return apm ? 'Initialized ✅' : 'Not Initialized ❌'
})

const testResults = ref('')

const testSimpleTransaction = () => {
  console.log('=== Testing Simple Transaction ===')
  testResults.value = 'Testing...\n'

  try {
    const transaction = startTransaction('Test Simple Transaction', 'user-interaction')

    if (!transaction) {
      const error = 'Transaction is null!'
      console.error('❌', error)
      testResults.value += `ERROR: ${error}\n`
      return
    }

    console.log('✅ Transaction created:', transaction)
    testResults.value += `✅ Transaction created: ${transaction.name}\n`
    testResults.value += `   Type: ${transaction.type}\n`

    // End transaction after 1 second
    setTimeout(() => {
      transaction.end()
      console.log('✅ Transaction ended')
      testResults.value += '✅ Transaction ended\n'
      testResults.value += '\nCheck Network tab for "intake/v2/rum" request!'
    }, 1000)

  } catch (error: any) {
    console.error('❌ Error:', error)
    testResults.value += `❌ ERROR: ${error.message}\n`
  }
}

const testTransactionWithLabels = () => {
  console.log('=== Testing Transaction with Labels ===')
  testResults.value = 'Testing...\n'

  try {
    const transaction = startTransaction('Test Transaction with Labels', 'user-interaction')

    if (!transaction) {
      const error = 'Transaction is null!'
      console.error('❌', error)
      testResults.value += `ERROR: ${error}\n`
      return
    }

    console.log('✅ Transaction created:', transaction)
    testResults.value += `✅ Transaction created: ${transaction.name}\n`

    // Add labels
    transaction.addLabels({
      test_label: 'test_value',
      button_clicked: true,
      timestamp: Date.now()
    })

    console.log('✅ Labels added')
    testResults.value += '✅ Labels added\n'

    // End transaction after 1 second
    setTimeout(() => {
      transaction.end()
      console.log('✅ Transaction ended')
      testResults.value += '✅ Transaction ended\n'
      testResults.value += '\nCheck Network tab for "intake/v2/rum" request!'
    }, 1000)

  } catch (error: any) {
    console.error('❌ Error:', error)
    testResults.value += `❌ ERROR: ${error.message}\n`
  }
}

const testManualTransaction = () => {
  console.log('=== Testing Manual Transaction (Direct APM API) ===')
  testResults.value = 'Testing...\n'

  if (!apm) {
    const error = 'APM instance is not available!'
    console.error('❌', error)
    testResults.value += `ERROR: ${error}\n`
    return
  }

  try {
    console.log('APM instance:', apm)
    testResults.value += 'APM instance available\n'

    const transaction = apm.startTransaction('Test Manual Transaction', 'custom')

    if (!transaction) {
      const error = 'Transaction is null!'
      console.error('❌', error)
      testResults.value += `ERROR: ${error}\n`
      return
    }

    console.log('✅ Transaction created:', transaction)
    testResults.value += `✅ Transaction created: ${transaction.name}\n`

    transaction.addLabels({
      manual_test: true,
      timestamp: Date.now()
    })

    // End transaction after 1 second
    setTimeout(() => {
      transaction.end()
      console.log('✅ Transaction ended')
      testResults.value += '✅ Transaction ended\n'
      testResults.value += '\nCheck Network tab for "intake/v2/rum" request!'
    }, 1000)

  } catch (error: any) {
    console.error('❌ Error:', error)
    testResults.value += `❌ ERROR: ${error.message}\n`
  }
}

onMounted(() => {
  console.log('=== APM Debug Page Mounted ===')
  console.log('APM Instance:', apm)
  console.log('startTransaction function:', startTransaction)
})
</script>

<style scoped>
.container {
  max-width: 900px;
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

.info-box {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.info-box pre {
  margin: 0.5rem 0 0 0;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  white-space: pre-wrap;
  font-size: 0.875rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  flex-wrap: wrap;
}

ol {
  padding-left: 1.5rem;
}

ol li {
  margin: 0.5rem 0;
}

code {
  background: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  color: #d63384;
}
</style>
