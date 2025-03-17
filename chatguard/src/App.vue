<template>
    <div class="app-container">
      <div class="app-header">
        <div class="logo">
          <img src="@/assets/logo.png" alt="ChatGuard Logo">
        </div>
        <div class="close-button">
          <button>×</button>
        </div>
      </div>
      <div class="app-content">
        <router-view/>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'App'
  }
  </script>
  
  <style lang="scss">
  @import '@/assets/styles/_variables.scss';
  
  .app-container {
    width: 600px;
    height: 400px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background-color: $jordy-blue;
  }
  
  .app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: $jordy-blue;
  
  .logo {
    display: flex;
    align-items: center;
    img {
      height: 60px;
      width: auto;
      object-fit: contain;
    }
  }
  
  .close-button {
    button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: $white;
    }
  }
}
  
  .app-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
  </style>