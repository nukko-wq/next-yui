/**
 * Settings Management
 * YUI設定の管理とローカルストレージ連携
 */

export interface SettingsState {
  soundEnabled: boolean
}

const SETTINGS_KEY = 'yui-settings'

const defaultSettings: SettingsState = {
  soundEnabled: true
}

export const loadSettings = (): SettingsState => {
  if (typeof window === 'undefined') return defaultSettings
  
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
  } catch {
    return defaultSettings
  }
}

export const saveSettings = (settings: SettingsState): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (error) {
    console.warn('Failed to save settings:', error)
  }
}