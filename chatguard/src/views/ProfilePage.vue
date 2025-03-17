<template>
  <SidebarLayout>
    <div class="profile-page">
      <div class="profile-info">
        <div class="info-row">
          <div class="info-label">Replacements made this month:</div>
          <div class="info-value">{{ replacementsCount }}</div>
        </div>
      </div>
      
      <div class="profile-links">
        <a href="https://example.com/help" target="_blank" class="link">Help Center</a>
      </div>
    </div>
  </SidebarLayout>
</template>

<script>
import SidebarLayout from '@/components/SidebarLayout.vue'

export default {
  name: 'ProfilePage',
  components: {
    SidebarLayout
  },
  data() {
    return {
      replacementsCount: 0
    }
  },
  created() {
    // Load the replacement count on component creation
    this.loadReplacementCount();
  },
  methods: {
    loadReplacementCount() {
      // Check if we're in a Chrome extension environment
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(['replacementData'], (result) => {
          if (result.replacementData) {
            this.replacementsCount = result.replacementData.count || 0;
          } else {
            // No data stored yet, initialize with 0
            this.saveReplacementCount(0);
          }
        });
      } else {
        // Fallback to localStorage for development
        const storedData = localStorage.getItem('chatguard-replacements');
        if (storedData) {
          const data = JSON.parse(storedData);
          this.replacementsCount = data.count || 0;
        } else {
          // For development purposes, start with 0
          this.replacementsCount = 0;
          this.saveReplacementCount(0);
        }
      }
    },
    saveReplacementCount(count) {
      const currentDate = new Date();
      const data = {
        count: count,
        month: currentDate.getMonth(),
        year: currentDate.getFullYear()
      };
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set({ replacementData: data });
      } else {
        localStorage.setItem('chatguard-replacements', JSON.stringify(data));
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  
  .profile-info {
    margin-bottom: 30px;
    
    .info-row {
      display: flex;
      margin-bottom: 15px;
      
      .info-label {
        width: 200px;
        font-weight: bold;
        color: #001573;
      }
      
      .info-value {
        flex: 1;
      }
    }
  }
  
  .profile-links {
    display: flex;
    flex-direction: column;
    
    .link {
      color: #474DFF;
      margin-bottom: 15px;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>