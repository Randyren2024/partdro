import { defineStore } from 'pinia'
import { supabase } from '../supabase/client'

const ADMIN_EMAIL_DOMAIN = 'admin.partdro.com'
function usernameToEmail(u: string): string {
  const trimmed = u.trim().toLowerCase()
  // 如果已经是邮箱格式，直接用（兼容用户误填完整邮箱）
  if (trimmed.includes('@')) return trimmed
  return `${trimmed}@${ADMIN_EMAIL_DOMAIN}`
}

interface AuthState {
  userId: string | null
  username: string | null
  isAdmin: boolean
  ready: boolean
  loading: boolean
  error: string | null
}

let subscribed = false

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    userId: null,
    username: null,
    isAdmin: false,
    ready: false,
    loading: false,
    error: null,
  }),
  getters: {
    isLoggedIn: (s) => !!s.userId && s.isAdmin,
  },
  actions: {
    async init() {
      if (this.ready) return
      try {
        const { data } = await supabase.auth.getSession()
        if (data.session?.user) await this.refreshProfile(data.session.user.id)
      } catch {
        /* ignore */
      } finally {
        this.ready = true
        if (!subscribed) {
          subscribed = true
          supabase.auth.onAuthStateChange((_e, session) => {
            if (session?.user) this.refreshProfile(session.user.id)
            else this.clearProfile()
          })
        }
      }
    },
    async refreshProfile(uid: string) {
      const { data, error } = await supabase
        .from('admins')
        .select('username')
        .eq('user_id', uid)
        .maybeSingle()
      if (error || !data) {
        this.clearProfile()
        return
      }
      this.userId = uid
      this.username = data.username
      this.isAdmin = true
    },
    clearProfile() {
      this.userId = null
      this.username = null
      this.isAdmin = false
    },
    async login(username: string, password: string) {
      this.loading = true
      this.error = null
      try {
        const failCount = Number(sessionStorage.getItem('admin_fails') || '0')
        const lockedUntil = Number(sessionStorage.getItem('admin_locked_until') || '0')
        if (lockedUntil && Date.now() < lockedUntil) {
          this.error = 'Too many attempts. Please wait a moment.'
          return false
        }
        if (!username || !password) {
          this.error = 'Please enter username and password.'
          return false
        }
        const { data, error } = await supabase.auth.signInWithPassword({
          email: usernameToEmail(username),
          password,
        })
        if (error || !data.user) {
          this.recordFail(failCount)
          this.error = 'Invalid credentials.'
          return false
        }
        const { data: admin, error: ae } = await supabase
          .from('admins')
          .select('username')
          .eq('user_id', data.user.id)
          .maybeSingle()
        if (ae || !admin) {
          await supabase.auth.signOut()
          this.clearProfile()
          this.recordFail(failCount)
          this.error = 'Invalid credentials.'
          return false
        }
        this.userId = data.user.id
        this.username = admin.username
        this.isAdmin = true
        sessionStorage.removeItem('admin_fails')
        sessionStorage.removeItem('admin_locked_until')
        return true
      } catch {
        this.error = 'Login failed. Please try again.'
        return false
      } finally {
        this.loading = false
      }
    },
    recordFail(count: number) {
      const n = count + 1
      sessionStorage.setItem('admin_fails', String(n))
      if (n >= 5) {
        sessionStorage.setItem('admin_locked_until', String(Date.now() + 60_000))
        sessionStorage.setItem('admin_fails', '0')
      }
    },
    async logout() {
      await supabase.auth.signOut()
      this.clearProfile()
    },
  },
})
