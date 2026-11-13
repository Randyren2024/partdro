<template>
  <section v-if="videoResolved || editMode" class="lp-section" id="video">
    <div class="lp-container">
      <div class="section-head">
        <div class="eyebrow" :data-edit-key="`${ns}.video.eyebrow`">{{ tt('video.eyebrow') }}</div>
        <h2 :data-edit-key="`${ns}.video.title`">{{ tt('video.title') }}</h2>
      </div>
      <div
        class="video-frame"
        :class="{ 'video-frame--empty': !videoResolved, 'video-frame--editing': editMode }"
        :data-edit-video="`${ns}.video.url`"
      >
        <template v-if="videoResolved">
          <video
            v-if="parsedVideo?.type === 'file'"
            :src="parsedVideo.url"
            :poster="videoPoster"
            controls
            muted
            loop
            playsinline
          ></video>
          <iframe
            v-else-if="parsedVideo"
            :src="parsedVideo.url"
            :title="tt('video.title')"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </template>
        <div v-else class="video-placeholder">{{ tt('video.emptyHint') }}</div>
      </div>
      <!-- 附加视频网格（url2/url3，CMS __videos 配置，无则整块隐藏） -->
      <div v-if="extraVideos.length" class="video-more">
        <div v-for="(v, i) in extraVideos" :key="i" class="video-more__item">
          <div
            class="video-frame"
            :data-edit-video="`${ns}.video.url${i + 2}`"
          >
            <video
              v-if="v.parsed.type === 'file'"
              :src="v.parsed.url"
              controls
              muted
              loop
              playsinline
            ></video>
            <iframe
              v-else
              :src="v.parsed.url"
              :title="v.title"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
          <div class="video-more__title" :data-edit-key="`${ns}.video.title${i + 2}`">{{ v.title }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useLandingSection } from '../sectionContext'

const { ns, tt, editMode, videoResolved, parsedVideo, videoPoster, extraVideos } = useLandingSection()
</script>
