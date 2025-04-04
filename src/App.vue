<template>
    <div class="app">
      <header>
        <h1>YouTube TLDR</h1>
      </header>
      <main>
        <div class="container">
          <div v-if="isLoggedIn">
            <!-- Main app content goes here -->
            <div class="form-container">
              <h2>Generate Summary</h2>
              <input 
                type="text" 
                v-model="videoUrl" 
                placeholder="YouTube URL or Video ID" 
                class="input" 
              />
              <button @click="generateSummary" class="button">
                {{ isLoading ? "Processing..." : "Generate Summary" }}
              </button>
            </div>
            
            <div v-if="summary" class="summary-container">
              <h2>Summary</h2>
              <div class="summary" v-html="summary"></div>
              <button @click="copySummary" class="button">Copy to Clipboard</button>
            </div>
          </div>
          <div v-else>
            <!-- Login form -->
            <div class="login-container">
              <h2>Login</h2>
              <input 
                type="text" 
                v-model="username" 
                placeholder="Username" 
                class="input" 
              />
              <input 
                type="password" 
                v-model="password" 
                placeholder="Password" 
                class="input" 
              />
              <button @click="login" class="button">Login</button>
              <p v-if="loginError" class="error">{{ loginError }}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        isLoggedIn: false,
        username: "",
        password: "",
        loginError: "",
        videoUrl: "",
        summary: "",
        isLoading: false
      };
    },
    methods: {
      login() {
        // Simple hardcoded authentication for MVP
        if (this.username === "admin" && this.password === "password") {
          this.isLoggedIn = true;
          this.loginError = "";
        } else {
          this.loginError = "Invalid credentials";
        }
      },
      async generateSummary() {
        if (!this.videoUrl) return;
        
        this.isLoading = true;
        this.summary = "";
        
        try {
          // Extract video ID from URL if needed
          const videoId = this.extractVideoId(this.videoUrl);
          
          if (!videoId) {
            alert("Invalid YouTube URL or Video ID");
            this.isLoading = false;
            return;
          }
          
          const response = await fetch("/.netlify/functions/api/summarize", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ videoId }),
          });
          
          const data = await response.json();
          
          if (data.error) {
            alert(`Error: ${data.error}`);
            this.isLoading = false;
            return;
          }
          
          // Convert markdown to HTML (basic implementation)
          this.summary = data.summary;
        } catch (error) {
          alert(`Error: ${error.message}`);
        } finally {
          this.isLoading = false;
        }
      },
      extractVideoId(url) {
        // If it's already just the ID (11 characters)
        if (url.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url)) {
          return url;
        }
        
        // Try to extract from URL
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        
        return (match && match[2].length === 11) ? match[2] : null;
      },
      copySummary() {
        if (!this.summary) return;
        
        navigator.clipboard.writeText(this.summary)
          .then(() => alert("Summary copied to clipboard!"))
          .catch(err => alert("Failed to copy summary"));
      }
    }
  };
  </script>
  
  <style>
  /* Basic styles - you can replace with Tailwind later */
  .app {
    font-family: Arial, sans-serif;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  header {
    text-align: center;
    margin-bottom: 30px;
  }
  
  h1 {
    font-size: 2.5rem;
    color: #333;
  }
  
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .form-container,
  .summary-container,
  .login-container {
    width: 100%;
    max-width: 600px;
    margin-bottom: 20px;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .input {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .button {
    padding: 10px 20px;
    background-color: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
  
  .button:hover {
    background-color: #3275e4;
  }
  
  .summary {
    margin: 20px 0;
    line-height: 1.6;
    white-space: pre-wrap;
  }
  
  .error {
    color: red;
    margin-top: 10px;
  }
  </style>