<template>
  <div class="documents-page">
    <div class="page-header">
      <div class="container">
        <h1>{{ t('documents.title') }}</h1>
        <p>{{ t('documents.subtitle') }}</p>
      </div>
    </div>

    <section class="page-section">
      <div class="container documents-container">
        <div v-if="loading" class="documents-state" role="status" aria-live="polite">
          <a-spin size="large" />
          <p>{{ t('documents.loading') }}</p>
        </div>

        <div v-else-if="error" class="documents-state documents-state--error" role="alert">
          <FilePdfOutlined />
          <h2>{{ t('documents.errorTitle') }}</h2>
          <p>{{ t('documents.error') }}</p>
          <a-button type="primary" @click="reload">{{ t('documents.retry') }}</a-button>
        </div>

        <div v-else-if="!documents.length" class="documents-state">
          <FilePdfOutlined />
          <h2>{{ t('documents.emptyTitle') }}</h2>
          <p>{{ t('documents.empty') }}</p>
        </div>

        <div v-else class="documents-list">
          <article v-for="item in documents" :key="item.id" class="document-card">
            <div class="document-card__icon" aria-hidden="true">
              <FilePdfOutlined />
            </div>
            <div class="document-card__content">
              <h2>{{ item.title }}</h2>
              <p v-if="item.description">{{ item.description }}</p>
              <span v-if="item.file_size" class="document-card__meta">{{ formatFileSize(item.file_size) }}</span>
            </div>
            <a
              v-if="item.file_url"
              class="document-card__download"
              :href="item.file_url"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`${t('documents.download')}: ${item.title}`"
            >
              <DownloadOutlined />
              <span>{{ t('documents.download') }}</span>
            </a>
            <span v-else class="document-card__unavailable">{{ t('documents.unavailable') }}</span>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { DownloadOutlined, FilePdfOutlined } from '@ant-design/icons-vue'
import { useDocuments } from '~/composables/useSupabase'

const { t } = useI18n()
const { data: documents, loading, error, reload } = useDocuments()

function formatFileSize(value: number | string) {
  const bytes = Number(value)
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<style scoped>
.documents-container { max-width: 960px; }
.documents-list { display: grid; gap: 14px; }
.document-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 22px 24px;
  border: 1px solid var(--pd-line);
  border-radius: var(--pd-radius);
  background: var(--pd-surface);
  box-shadow: var(--pd-shadow-sm);
  transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;
}
.document-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--pd-primary) 45%, var(--pd-line));
  box-shadow: var(--pd-shadow);
}
.document-card__icon {
  display: grid;
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  place-items: center;
  border-radius: 14px;
  color: var(--pd-primary);
  background: color-mix(in srgb, var(--pd-primary) 10%, var(--pd-surface));
  font-size: 25px;
}
.document-card__content { min-width: 0; flex: 1; }
.document-card__content h2 {
  margin: 0 0 5px;
  color: var(--pd-ink);
  font-family: var(--pd-font);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -.01em;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.document-card__content p {
  margin: 0;
  color: var(--pd-ink-soft);
  font-size: 14px;
  line-height: 1.6;
}
.document-card__meta {
  display: inline-block;
  margin-top: 7px;
  color: var(--pd-ink-muted);
  font-size: 12px;
}
.document-card__download {
  display: inline-flex;
  min-height: 42px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 17px;
  border-radius: 999px;
  color: var(--pd-on-primary);
  background: var(--pd-primary);
  font-size: 13px;
  font-weight: 700;
  transition: background .2s ease, transform .2s ease;
}
.document-card__download:hover {
  color: var(--pd-on-primary);
  background: var(--pd-primary-hover);
  transform: translateY(-1px);
}
.document-card__unavailable { color: var(--pd-ink-muted); font-size: 13px; }
.documents-state {
  display: flex;
  min-height: 260px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 24px;
  border: 1px dashed var(--pd-line-strong);
  border-radius: var(--pd-radius-lg);
  color: var(--pd-ink-soft);
  text-align: center;
}
.documents-state > .anticon { color: var(--pd-primary); font-size: 34px; }
.documents-state h2 { margin: 0; color: var(--pd-ink); font-size: 22px; }
.documents-state p { margin: 0; max-width: 48ch; }
@media (max-width: 640px) {
  .document-card { align-items: flex-start; flex-wrap: wrap; gap: 14px; padding: 18px; }
  .document-card__icon { width: 44px; height: 44px; flex-basis: 44px; font-size: 21px; }
  .document-card__content { flex-basis: calc(100% - 60px); }
  .document-card__download { width: 100%; }
  .document-card__unavailable { width: 100%; }
}
</style>
