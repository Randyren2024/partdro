<template>
  <div class="auth-screen">
    <div class="auth-card">
      <div class="brand">
        <img src="/droneworld_logo.png" alt="Partdro" />
        <h1>Admin Sign In</h1>
        <p class="muted">Visual editor for the D15R landing page</p>
      </div>
      <a-form layout="vertical" @submit.prevent="onSubmit">
        <a-form-item label="Username">
          <a-input
            v-model:value="username"
            size="large"
            autocomplete="username"
            :disabled="auth.loading"
            placeholder="admin"
          />
        </a-form-item>
        <a-form-item label="Password">
          <a-input-password
            v-model:value="password"
            size="large"
            autocomplete="current-password"
            :disabled="auth.loading"
            @keyup.enter="onSubmit"
          />
        </a-form-item>
        <a-alert
          v-if="auth.error"
          :message="auth.error"
          type="error"
          show-icon
          style="margin-bottom: 16px"
        />
        <a-button
          type="primary"
          size="large"
          block
          :loading="auth.loading"
          @click="onSubmit"
        >
          Sign In
        </a-button>
      </a-form>
      <p class="hint">Access is restricted to authorized administrators.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const username = ref('')
const password = ref('')

async function onSubmit() {
  const ok = await auth.login(username.value, password.value)
  if (ok) router.push('/admin/editor')
}
</script>

<style scoped>
.auth-screen {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 20%, #0d1215, #070a0c 60%);
  padding: 24px;
}
.auth-card {
  width: min(440px, 100%);
  background: #10171b;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 22px;
  padding: 36px 30px;
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.5);
}
.brand {
  text-align: center;
  margin-bottom: 26px;
}
.brand img {
  width: 56px;
  height: 56px;
  object-fit: contain;
  margin: 0 auto 12px;
}
.brand h1 {
  color: #f4f7f8;
  font-size: 1.4rem;
  margin: 0;
}
.muted {
  color: #a8b4b9;
  font-size: 0.85rem;
  margin-top: 4px;
}
.hint {
  color: #6b7a80;
  font-size: 0.75rem;
  text-align: center;
  margin-top: 18px;
}
</style>
