import { createStore } from 'vuex'

export default createStore({
  state: {
    settings: {
      enableForInstagram: true,
      enableHighlighting: true,
      enableAutoReplacement: true,
      enableNotifications: true
    }
  },
  getters: {
    getSettings: state => state.settings
  },
  mutations: {
    SET_SETTING(state, { key, value }) {
      state.settings[key] = value
    },
    SET_ALL_SETTINGS(state, settings) {
      state.settings = { ...state.settings, ...settings }
    }
  },
  actions: {
    // Save a single setting
    saveSetting({ commit, state }, { key, value }) {
      commit('SET_SETTING', { key, value })
      
      // Save to Chrome storage if available
      if (chrome && chrome.storage) {
        const setting = {}
        setting[key] = value
        chrome.storage.sync.set(setting)
      } else {
        // Fallback to localStorage
        localStorage.setItem('chatguard-settings', JSON.stringify(state.settings))
      }
    },
    
    // Load all settings
    loadSettings({ commit }) {
      if (chrome && chrome.storage) {
        chrome.storage.sync.get(null, (items) => {
          if (Object.keys(items).length > 0) {
            commit('SET_ALL_SETTINGS', items)
          }
        })
      } else {
        // Fallback to localStorage
        const settings = JSON.parse(localStorage.getItem('chatguard-settings'))
        if (settings) {
          commit('SET_ALL_SETTINGS', settings)
        }
      }
    }
  }
})