<template>
  <SidebarLayout>
    <div class="profile-page">
      <div class="profile-info">
        <div class="info-row">
          <div class="info-label">Name:</div>
          <div class="info-value">James Tan</div>
        </div>
        
        <div class="info-row">
          <div class="info-label">E-mail:</div>
          <div class="info-value">jamestan@gmail.com</div>
        </div>
        
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
      // This would normally log the user out
      // For now, just show an alert
      alert('Logout functionality will be implemented in the future')
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';

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
        color: $midnight-blue;
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
      color: $risd-blue;
      margin-bottom: 15px;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
    
    .logout-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: none;
      border: none;
      color: red;
      cursor: pointer;
      padding: 0;
      font-size: 14px;
      width: 80px;
      
      .icon {
        margin-left: 5px;
      }
    }
  }
}
</style>