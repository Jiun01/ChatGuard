<template>
  <div class="sidebar-layout">
    <div class="sidebar">
      <!-- Removed user info section with avatar, name, and email -->
      <nav class="nav-menu">
        <router-link 
          to="/" 
          class="nav-item"
          :class="{ 'active': $route.path === '/' }"
        >
          <span class="icon">⚙️</span>
          <span>Preference</span>
        </router-link>
        
        <router-link 
          to="/profile" 
          class="nav-item"
          :class="{ 'active': $route.path === '/profile' }"
        >
          <span class="icon">👤</span>
          <span>Profile</span>
        </router-link>
        
        <router-link 
          to="/feedback" 
          class="nav-item"
          :class="{ 'active': $route.path === '/feedback' }"
        >
          <span class="icon">📝</span>
          <span>Feedback</span>
        </router-link>
      </nav>
    </div>
    
    <div class="main-content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SidebarLayout'
  // Removed data property with username and email
}
</script>

<style lang="scss" scoped>
.sidebar-layout {
  display: flex;
  width: 100%;
  height: 100%;
  
  .sidebar {
    width: 200px;
    background-color: #FFFFFF;
    border-radius: 12px;
    margin: 10px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    
    /* Removed user-info styles since the section was removed */
    
    .nav-menu {
      display: flex;
      flex-direction: column;
      
      .nav-item {
        display: flex;
        align-items: center;
        padding: 12px;
        margin-bottom: 5px;
        border-radius: 5px;
        color: #001573;
        text-decoration: none;
        
        &:hover {
          background-color: #d4e3fa;
        }
        
        &.active {
          background-color: #81B1F0;
        }
        
        .icon {
          margin-right: 10px;
        }
      }
    }
  }
  
  .main-content {
    flex: 1;
    background-color: #FFFFFF;
    border-radius: 12px;
    margin: 10px 10px 10px 0;
    padding: 20px;
    overflow-y: auto;
  }
}
</style>