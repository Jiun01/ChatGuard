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
        
        <button class="logout-btn" @click="logout">
          Log Out
          <span class="icon">→</span>
        </button>
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
            const data = result.replacementData;
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            
            // If the stored month/year matches current month/year, use the stored count
            // Otherwise, it's a new month, so reset to 0
            if (data.month === currentMonth && data.year === currentYear) {
              this.replacementsCount = data.count;
            } else {
              this.replacementsCount = 0;
              // Save the new month data
              this.saveReplacementCount(0);
            }
          } else {
            // No data stored yet, initialize with 0
            this.replacementsCount = 0;
            this.saveReplacementCount(0);
          }
        });
      } else {
        // Fallback to localStorage for development
        const storedData = localStorage.getItem('chatguard-replacements');
        if (storedData) {
          const data = JSON.parse(storedData);
          const currentDate = new Date();
          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();
          
          if (data.month === currentMonth && data.year === currentYear) {
            this.replacementsCount = data.count;
          } else {
            this.replacementsCount = 0;
            this.saveReplacementCount(0);
          }
        } else {
          // Initialize with example value for the UI shell (11 as shown in image)
          this.replacementsCount = 11;
          this.saveReplacementCount(11);
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
    },
    logout() {
      // For the UI shell, just show an alert
      alert('Logout functionality will be implemented in the future');
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
    
    .logout-btn {
      display: flex;
      align-items: center;
      background: none;
      border: none;
      color: red;
      cursor: pointer;
      padding: 0;
      font-size: 14px;
      width: fit-content;
      
      .icon {
        margin-left: 5px;
      }
    }
  }
}
</style>