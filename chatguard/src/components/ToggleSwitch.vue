<template>
    <label class="toggle-switch">
      <input 
        type="checkbox" 
        :checked="modelValue" 
        @change="$emit('update:modelValue', $event.target.checked)"
      >
      <span class="slider"></span>
    </label>
  </template>
  
  <script>
  export default {
    name: 'ToggleSwitch',
    props: {
      modelValue: {
        type: Boolean,
        default: false
      }
    },
    emits: ['update:modelValue']
  }
  </script>
  
  <style lang="scss" scoped>
  @import '@/assets/styles/_variables.scss';
  
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
    
    input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 34px;
      
      &:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
    }
    
    input:checked + .slider {
      background-color: $risd-blue;
    }
    
    input:checked + .slider:before {
      transform: translateX(26px);
    }
  }
  </style>