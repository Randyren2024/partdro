<template>
  <main class="admin-catalogue">
    <header class="catalogue-header">
      <div>
        <p class="eyebrow">INTERNAL SOURCING WORKSPACE</p>
        <h1>Supplier product catalogue</h1>
        <p>Review upstream products and source evidence without publishing them to the DroneWorld product catalogue.</p>
      </div>
      <div class="header-actions">
        <a-button @click="router.push('/admin/products')">Website products</a-button>
        <a-button danger @click="logout">Sign out</a-button>
      </div>
    </header>

    <section class="filters">
      <a-input-search v-model:value="search" placeholder="Search product, model or brand" allow-clear @search="applyFilters" />
      <a-select v-model:value="status" allow-clear placeholder="All publication states" @change="applyFilters">
        <a-select-option value="draft">Draft</a-select-option>
        <a-select-option value="published">Published</a-select-option>
        <a-select-option value="archived">Archived</a-select-option>
      </a-select>
      <a-select v-model:value="verification" allow-clear placeholder="All verification states" @change="applyFilters">
        <a-select-option value="unverified">Unverified</a-select-option>
        <a-select-option value="partially_verified">Partially verified</a-select-option>
        <a-select-option value="verified">Verified</a-select-option>
        <a-select-option value="disputed">Disputed</a-select-option>
        <a-select-option value="discontinued">Discontinued</a-select-option>
      </a-select>
      <a-button @click="load">Refresh</a-button>
    </section>

    <section class="catalogue-summary">
      <strong>{{ total.toLocaleString() }}</strong>
      <span>supplier product records</span>
      <span class="summary-note">Internal research data · not customer-facing products</span>
    </section>

    <a-table
      :data-source="rows"
      :columns="columns"
      :loading="loading"
      :pagination="false"
      row-key="id"
      :scroll="{ x: 1050 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'product'">
          <strong>{{ record.name }}</strong>
          <div class="muted">{{ record.name_en || record.model || '—' }}</div>
        </template>
        <template v-else-if="column.key === 'supplier'">
          <strong>{{ record.suppliers?.name || record.supplier_id }}</strong>
          <div class="muted">{{ [record.suppliers?.province, record.suppliers?.city].filter(Boolean).join(' · ') }}</div>
        </template>
        <template v-else-if="column.key === 'verification'">
          <a-tag :color="verificationColor(record.verification_status)">{{ record.verification_status }}</a-tag>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag>{{ record.status }}</a-tag>
        </template>
        <template v-else-if="column.key === 'source'">
          <a v-if="record.source_url" :href="record.source_url" target="_blank" rel="noopener noreferrer">Open source ↗</a>
          <span v-else class="muted">No primary URL</span>
        </template>
      </template>
    </a-table>

    <footer class="pagination">
      <span>Page {{ page }} of {{ totalPages || 1 }}</span>
      <a-pagination :current="page" :page-size="pageSize" :total="total" :show-size-changer="false" @change="changePage" />
    </footer>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { supabase } from '~/supabase/client'

definePageMeta({ layout: 'default' })

const router = useRouter()
const auth = useAuthStore()
const rows = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const status = ref<string>()
const verification = ref<string>()
const page = ref(1)
const pageSize = 25
const total = ref(0)
const totalPages = ref(0)
const columns = [
  { title: 'Product / model', key: 'product', width: 260 },
  { title: 'Supplier', key: 'supplier', width: 240 },
  { title: 'Category', dataIndex: 'category', key: 'category', width: 150 },
  { title: 'Verification', key: 'verification', width: 170 },
  { title: 'State', key: 'status', width: 110 },
  { title: 'Source', key: 'source', width: 140 },
]

async function load() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) {
    await router.replace('/admin/login')
    return
  }

  loading.value = true
  try {
    const result = await $fetch<{
      rows: any[]
      total: number
      totalPages: number
    }>('/api/admin/supplier-products', {
      headers: { Authorization: `Bearer ${token}` },
      query: {
        page: page.value,
        pageSize,
        q: search.value || undefined,
        status: status.value,
        verification: verification.value,
      },
    })
    rows.value = result.rows
    total.value = result.total
    totalPages.value = result.totalPages
  } catch (error: any) {
    if (error?.statusCode === 401 || error?.statusCode === 403) {
      await auth.logout()
      await router.replace('/admin/login')
    } else {
      message.error(error?.data?.statusMessage || error?.message || 'Unable to load supplier products')
    }
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  page.value = 1
  load()
}

function changePage(next: number) {
  page.value = next
  load()
}

function verificationColor(value: string) {
  if (value === 'verified') return 'green'
  if (value === 'disputed') return 'red'
  if (value === 'partially_verified') return 'orange'
  return 'default'
}

async function logout() {
  await auth.logout()
  await router.replace('/admin/login')
}

onMounted(async () => {
  await auth.init()
  if (!auth.isLoggedIn) {
    await router.replace('/admin/login')
    return
  }
  await load()
})
</script>

<style scoped>
.admin-catalogue { max-width: 1320px; margin: 0 auto; padding: 40px 24px; }
.catalogue-header { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; margin-bottom:28px; }
.catalogue-header h1 { margin:0; font-size:28px; }
.catalogue-header p:not(.eyebrow) { max-width:720px; color:#777; }
.eyebrow { margin:0 0 8px; color:#d97745; font-size:11px; font-weight:800; letter-spacing:.16em; }
.header-actions { display:flex; gap:10px; }
.filters { display:grid; grid-template-columns:minmax(240px,1fr) 190px 210px auto; gap:12px; margin-bottom:20px; }
.catalogue-summary { display:flex; align-items:baseline; gap:10px; margin:20px 0; color:#777; }
.catalogue-summary strong { color:inherit; font-size:28px; }
.summary-note,.muted { color:#888; font-size:12px; }
.summary-note { margin-left:auto; }
.pagination { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:20px 0; color:#777; }
@media(max-width:760px) {
  .catalogue-header { flex-direction:column; }
  .filters { grid-template-columns:1fr; }
  .summary-note { margin-left:0; }
  .catalogue-summary { flex-wrap:wrap; }
  .pagination { align-items:flex-start; flex-direction:column; }
}
</style>
