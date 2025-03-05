<template>
  <SidebarLayout>
    <div class="profile-page">
      <div class="profile-info">
        <!-- Removed the name and email rows -->
        <div class="info-row">
          <div class="info-label">Replacements made this month:</div>
          <div class="info-value">11</div>
        </div>
      </div>
      
      <div class="profile-links">
        <a href="#" class="link">Help Center</a>
        
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
  methods: {
    logout() {
      // For the UI shell, just show an alert
      alert('Logout functionality will be implemented in the future')
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