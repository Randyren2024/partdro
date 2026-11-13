<template>
  <div class="documents-page">
    <div class="page-header">
      <div class="container">
        <h1>{{ t('documents.title') }}</h1>
        <p>{{ t('documents.subtitle') }}</p>
      </div>
    </div>
    <div class="page-section">
      <div class="container" style="max-width: 900px">
        <a-list :data-source="documents" bordered>
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #avatar>
                  <FilePdfOutlined style="font-size: 28px; color: #e8682a" />
                </template>
                <template #title>
                  <span style="font-weight: 600">{{ item.title }}</span>
                </template>
                <template #description>
                  {{ item.description }}
                </template>
              </a-list-item-meta>
              <template #actions>
                <a-button type="primary" size="small">
                  <DownloadOutlined /> {{ t('documents.download') }}
                </a-button>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { FilePdfOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import { useDocuments } from '../composables/useSupabase'

const { t } = useI18n()
const { data: documents } = useDocuments()
</script>
