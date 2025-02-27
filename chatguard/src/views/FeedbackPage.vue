<template>
    <SidebarLayout>
      <div class="feedback-page" v-if="!feedbackSubmitted">
        <div class="form-group">
          <label>Abusive Word Suggestion:</label>
          <input 
            type="text" 
            v-model="abusiveWord" 
            placeholder="Enter a word to be added to the filter"
          >
        </div>
        
        <div class="form-group">
          <label>Reason:</label>
          <textarea 
            v-model="reason" 
            placeholder="Why do you think this word should be filtered?"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>Other Feedback:</label>
          <textarea 
            v-model="otherFeedback" 
            placeholder="Any other comments or suggestions for ChatGuard?"
          ></textarea>
        </div>
        
        <div class="form-actions">
          <button class="btn submit-btn" @click="submitFeedback">
            Submit
          </button>
        </div>
      </div>
      
      <div class="thank-you-message" v-else>
        <h2>Thank you !!</h2>
        <p>Your feedback means a lot !</p>
        
        <div class="thank-you-icon">
          <img src="@/assets/thank-you.svg" alt="Thank You">
        </div>
        
        <button class="btn back-btn" @click="resetForm">
          Back
        </button>
      </div>
    </SidebarLayout>
  </template>
  
  <script>
  import SidebarLayout from '@/components/SidebarLayout.vue'
  
  export default {
    name: 'FeedbackPage',
    components: {
      SidebarLayout
    },
    data() {
      return {
        abusiveWord: '',
        reason: '',
        otherFeedback: '',
        feedbackSubmitted: false
      }
    },
    methods: {
      submitFeedback() {
        // In a real implementation, you would send this data to your backend
        console.log('Feedback submitted:', {
          abusiveWord: this.abusiveWord,
          reason: this.reason,
          otherFeedback: this.otherFeedback
        })
        
        // For now, just mark as submitted to show the thank you message
        this.feedbackSubmitted = true
        
        // In a real implementation, you might store this in Chrome storage
        // to track user feedback
      },
      resetForm() {
        // Reset the form and go back to feedback
        this.abusiveWord = ''
        this.reason = ''
        this.otherFeedback = ''
        this.feedbackSubmitted = false
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  @import '@/assets/styles/_variables.scss';
  
  .feedback-page {
    .form-group {
      margin-bottom: 20px;
      
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
        color: $midnight-blue;
      }
      
      input, textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        
        &:focus {
          outline: none;
          border-color: $risd-blue;
        }
      }
      
      textarea {
        min-height: 80px;
        resize: vertical;
      }
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      
      .submit-btn {
        background-color: $midnight-blue;
        padding: 8px 20px;
      }
    }
  }
  
  .thank-you-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    
    h2 {
      margin-bottom: 10px;
      color: $midnight-blue;
    }
    
    p {
      margin-bottom: 20px;
    }
    
    .thank-you-icon {
      margin: 20px 0;
      
      img {
        width: 120px;
      }
    }
    
    .back-btn {
      margin-top: 20px;
      background-color: $midnight-blue;
    }
  }
  </style>