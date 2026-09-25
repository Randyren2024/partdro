<template>
  <div class="admin-products">
    <div class="admin-products__bar">
      <h1>Products</h1>
      <div class="admin-products__bar-actions">
        <a-button @click="$router.push('/products/d15r')">D15R landing page</a-button>
        <a-button type="primary" @click="openCreate">+ New product</a-button>
        <a-button danger @click="onLogout">Sign out</a-button>
      </div>
    </div>

    <a-table
      :data-source="rows"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'category'">
          <a-tag>{{ record.category }}</a-tag>
        </template>
        <template v-else-if="column.key === 'published'">
          <a-switch
            :checked="record.published"
            @change="(v: any) => togglePublished(record, !!v)"
          />
        </template>
        <template v-else-if="column.key === 'names'">
          <div v-for="l in record.product_langs ?? []" :key="l.lang" class="lang-row">
            <span class="lang-tag">{{ l.lang }}</span>{{ l.name }}
          </div>
        </template>
        <template v-else-if="column.key === 'actions'">
          <router-link :to="`/products/${record.slug}`">Edit landing page →</router-link>
          <a-popconfirm
            title="Delete this product? This cannot be undone."
            ok-text="Delete"
            cancel-text="Cancel"
            @confirm="deleteProduct(record)"
          >
            <a-button danger size="small" style="margin-left: 8px">Delete</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="createOpen"
      title="New product"
      :confirm-loading="creating"
      ok-text="Create & edit landing page"
      :width="720"
      @ok="submitCreate"
    >
      <a-form layout="vertical" class="create-form">
        <div class="create-form__row">
          <a-form-item label="Slug (URL path, e.g. agri-pro)" required>
            <a-input v-model:value="form.slug" placeholder="agri-pro" />
          </a-form-item>
          <a-form-item label="Category" required>
            <a-select v-model:value="form.category">
              <a-select-option value="agricultural">Agricultural Drone</a-select-option>
              <a-select-option value="cargo">Cargo Drone</a-select-option>
              <a-select-option value="cleaning">Cleaning Drone</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="Sort order">
            <a-input-number v-model:value="form.sort_order" :min="0" />
          </a-form-item>
        </div>
        <a-form-item label="Published">
          <a-switch v-model:checked="form.published" />
        </a-form-item>

        <a-tabs v-model:activeKey="formTab">
          <a-tab-pane v-for="l in LANGS" :key="l" :tab="l.toUpperCase()">
            <a-form-item label="Name" required>
              <a-input v-model:value="form.langs[l].name" />
            </a-form-item>
            <a-form-item label="Short description">
              <a-textarea v-model:value="form.langs[l].short_desc" :rows="2" />
            </a-form-item>
            <a-form-item label="Description">
              <a-textarea v-model:value="form.langs[l].description" :rows="3" />
            </a-form-item>
          </a-tab-pane>
        </a-tabs>
        <p class="create-form__hint">
          Landing-page copy (hero, features, specs…) is edited visually on the product page after
          creation. Only the listing name/description is set here.
        </p>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { callFunction } from '../../lib/netlifyApi'
import { useAuthStore } from '../../stores/auth'

const LANGS = ['en', 'es', 'de', 'fr'] as const
type Lang = (typeof LANGS)[number]

const router = useRouter()
const auth = useAuthStore()

const rows = ref<any[]>([])
const loading = ref(false)
const createOpen = ref(false)
const creating = ref(false)
const formTab = ref<Lang>('en')

const columns = [
  { title: 'Slug', dataIndex: 'slug', key: 'slug' },
  { title: 'Category', key: 'category' },
  { title: 'Name (per language)', key: 'names' },
  { title: 'Sort', dataIndex: 'sort_order', key: 'sort_order', width: 70 },
  { title: 'Published', key: 'published', width: 100 },
  { title: '', key: 'actions', width: 280 },
]

const emptyForm = () => ({
  slug: '',
  category: 'agricultural' as 'agricultural' | 'cargo' | 'cleaning',
  sort_order: 10,
  published: true,
  langs: Object.fromEntries(
    LANGS.map((l) => [l, { name: '', short_desc: '', description: '' }]),
  ) as Record<Lang, { name: string; short_desc: string; description: string }>,
})
const form = ref(emptyForm())

async function load() {
  loading.value = true
  try {
    const res = await callFunction<{ rows: any[] }>('admin-products', { action: 'list' })
    rows.value = res.rows ?? []
  } catch (e: any) {
    message.error('Load failed: ' + (e?.message || 'unknown'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.value = emptyForm()
  formTab.value = 'en'
  createOpen.value = true
}

async function submitCreate() {
  const slug = form.value.slug.trim()
  if (!/^[a-z0-9-]+$/.test(slug)) {
    message.error('Slug may only contain lowercase letters, digits and hyphens')
    return
  }
  if (rows.value.some((r) => r.slug === slug)) {
    message.error(`Slug "${slug}" already exists`)
    return
  }
  if (!form.value.langs.en.name.trim()) {
    message.error('English name is required (fill at least the EN tab)')
    return
  }
  creating.value = true
  try {
    await callFunction('admin-products', {
      action: 'create',
      slug,
      category: form.value.category,
      sort_order: form.value.sort_order,
      published: form.value.published,
      langs: LANGS.map((l) => ({
        lang: l,
        name: form.value.langs[l].name.trim() || form.value.langs.en.name.trim(),
        short_desc: form.value.langs[l].short_desc.trim(),
        description: form.value.langs[l].description.trim() || form.value.langs[l].short_desc.trim(),
      })),
    })
    message.success('Product created')
    createOpen.value = false
    router.push(`/products/${slug}`)
  } catch (e: any) {
    message.error('Create failed: ' + (e?.message || 'unknown'))
  } finally {
    creating.value = false
  }
}

async function togglePublished(record: any, v: boolean) {
  try {
    await callFunction('admin-products', { action: 'update', id: record.id, published: v })
    record.published = v
  } catch (e: any) {
    message.error('Update failed: ' + (e?.message || 'unknown'))
  }
}

async function deleteProduct(record: any) {
  const { id } = record
  try {
    await callFunction('admin-products', { action: 'delete', id })
    rows.value = rows.value.filter((r) => r.id !== id)
    message.success('Product deleted')
  } catch (e: any) {
    message.error('Delete failed: ' + (e?.message || 'unknown'))
  }
}

async function onLogout() {
  await auth.logout()
}

onMounted(load)
</script>

<style scoped>
.admin-products {
  max-width: 1080px;
  margin: 0 auto;
  padding: 40px 24px;
}
.admin-products__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 12px;
  flex-wrap: wrap;
}
.admin-products__bar h1 {
  margin: 0;
  font-size: 26px;
}
.admin-products__bar-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.lang-row {
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1.8;
}
.lang-tag {
  display: inline-block;
  min-width: 26px;
  text-align: center;
  background: #f0f2f5;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #555;
  text-transform: uppercase;
}
.create-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr 120px;
  gap: 12px;
}
.create-form__hint {
  color: #888;
  font-size: 12px;
  margin-top: 8px;
}
</style>
