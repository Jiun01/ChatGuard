<template>
    <div class="sidebar-layout">
      <div class="sidebar">
        <div class="user-info">
          <div class="avatar">
            <img src="@/assets/avatar.png" alt="User Avatar">
          </div>
          <h3>{{ username }}</h3>
          <p>{{ email }}</p>
        </div>
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
    name: 'SidebarLayout',
    data() {
      return {
        username: 'James Tan',
        email: 'jamestan@gmail.com'
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  @import '@/assets/styles/_variables.scss';
  
  .sidebar-layout {
    display: flex;
    width: 100%;
    height: 100%;
    
    .sidebar {
      width: 200px;
      background-color: $white;
      border-radius: $border-radius;
      margin: 10px;
      padding: 15px;
      display: flex;
      flex-direction: column;
      
      .user-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 20px;
        
        .avatar {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          overflow: hidden;
          margin-bottom: 10px;
          
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }
        
        h3 {
          margin: 5px 0;
          font-size: 16px;
        }
        
        p {
          font-size: 12px;
          color: #666;
        }
      }
      
      .nav-menu {
        display: flex;
        flex-direction: column;
        
        .nav-item {
          display: flex;
          align-items: center;
          padding: 12px;
          margin-bottom: 5px;
          border-radius: 5px;
          color: $midnight-blue;
          text-decoration: none;
          
          &:hover {
            background-color: lighten($jordy-blue, 15%);
          }
          
          &.active {
            background-color: $jordy-blue;
          }
          
          .icon {
            margin-right: 10px;
          }
        }
      }
    }
    
    .main-content {
      flex: 1;
      background-color: $white;
      border-radius: $border-radius;
      margin: 10px 10px 10px 0;
      padding: 20px;
      overflow-y: auto;
    }
  }
  </style>