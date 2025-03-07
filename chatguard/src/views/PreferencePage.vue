<template>
    <SidebarLayout>
      <div class="preference-page">
        <div class="preference-item">
          <div class="preference-text">
            Enable ChatGuard
          </div>
          <ToggleSwitch v-model="enableForInstagram" />
        </div>
        
        <div class="preference-item">
          <div class="preference-text">
            Enable highlighting the abusive words
          </div>
          <ToggleSwitch v-model="enableHighlighting" />
        </div>
        
        <div class="preference-item">
          <div class="preference-text">
            Enable auto replacement of abusive words
          </div>
          <ToggleSwitch v-model="enableAutoReplacement" />
        </div>
        
        <div class="preference-item">
          <div class="preference-text">
            Enable abusive word detected notification
          </div>
          <ToggleSwitch v-model="enableNotifications" />
        </div>
      </div>
    </SidebarLayout>
  </template>
  
  <script>
  import SidebarLayout from '@/components/SidebarLayout.vue'
  import ToggleSwitch from '@/components/ToggleSwitch.vue'
  
  export default {
    name: 'PreferencePage',
    components: {
      SidebarLayout,
      ToggleSwitch
    },
    data() {
      return {
        // Default values
        enableForInstagram: true,
        enableHighlighting: true,
        enableAutoReplacement: true,
        enableNotifications: true
      }
    },
    // Load settings from Chrome storage when the component is created
    created() {
      this.loadSettings()
    },
    // Watch for changes to our preferences and save them
    watch: {
      enableForInstagram(newVal) {
        this.saveSettings()
      },
      enableHighlighting(newVal) {
        this.saveSettings()
      },
      enableAutoReplacement(newVal) {
        this.saveSettings()
      },
      enableNotifications(newVal) {
        this.saveSettings()
      }
    },
    methods: {
      // Save all settings to Chrome storage
      saveSettings() {
        // Check if we're in a Chrome extension environment
        if (chrome && chrome.storage) {
          chrome.storage.sync.set({
            enableForInstagram: this.enableForInstagram,
            enableHighlighting: this.enableHighlighting,
            enableAutoReplacement: this.enableAutoReplacement,
            enableNotifications: this.enableNotifications
          })
        } else {
          // Fallback to localStorage for development
          localStorage.setItem('chatguard-settings', JSON.stringify({
            enableForInstagram: this.enableForInstagram,
            enableHighlighting: this.enableHighlighting,
            enableAutoReplacement: this.enableAutoReplacement,
            enableNotifications: this.enableNotifications
          }))
        }
      },
      // Load all settings from Chrome storage
      loadSettings() {
        // Check if we're in a Chrome extension environment
        if (chrome && chrome.storage) {
          chrome.storage.sync.get([
            'enableForInstagram',
            'enableHighlighting',
            'enableAutoReplacement',
            'enableNotifications'
          ], (result) => {
            // Only update if the setting exists
            if (result.enableForInstagram !== undefined) 
              this.enableForInstagram = result.enableForInstagram
            if (result.enableHighlighting !== undefined) 
              this.enableHighlighting = result.enableHighlighting
            if (result.enableAutoReplacement !== undefined) 
              this.enableAutoReplacement = result.enableAutoReplacement
            if (result.enableNotifications !== undefined) 
              this.enableNotifications = result.enableNotifications
          })
        } else {
          // Fallback to localStorage for development
          const settings = JSON.parse(localStorage.getItem('chatguard-settings'))
          if (settings) {
            if (settings.enableForInstagram !== undefined) 
              this.enableForInstagram = settings.enableForInstagram
            if (settings.enableHighlighting !== undefined) 
              this.enableHighlighting = settings.enableHighlighting
            if (settings.enableAutoReplacement !== undefined) 
              this.enableAutoReplacement = settings.enableAutoReplacement
            if (settings.enableNotifications !== undefined) 
              this.enableNotifications = settings.enableNotifications
          }
        }
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  @import '@/assets/styles/_variables.scss';
  
  .preference-page {
    .preference-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      
      &:last-child {
        border-bottom: none;
      }
      
      .preference-text {
        font-size: 14px;
        color: $midnight-blue;
      }
    }
  }
  </style>