<template>
  <div class="apply">
    <h1>Become a Photography Associate</h1>
    <p>Join our team of talented photographers!</p>
    <!-- Application form will go here -->
    <div class="application-form">
      <form @submit.prevent="submitApplication">
        <div class="form-group">
          <label for="applicant-name">Your Name:</label>
          <input type="text" id="applicant-name" v-model="name" required>
        </div>
        <div class="form-group">
          <label for="applicant-email">Your Email:</label>
          <input type="email" id="applicant-email" v-model="email" required>
        </div>
        <div class="form-group">
          <label for="applicant-phone">Phone Number:</label>
          <input type="tel" id="applicant-phone" v-model="phone">
        </div>
        <div class="form-group">
          <label for="applicant-portfolio">Portfolio URL:</label>
          <input type="url" id="applicant-portfolio" v-model="portfolio">
        </div>
        <div class="form-group">
          <label for="applicant-experience">Years of Experience:</label>
          <input type="number" id="applicant-experience" v-model="experience" min="0">
        </div>
        <div class="form-group">
          <label for="applicant-gear">Your Gear (e.g., Camera models, lenses):</label>
          <textarea id="applicant-gear" v-model="gear" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label for="applicant-message">Message (optional):</label>
          <textarea id="applicant-message" v-model="message" rows="5"></textarea>
        </div>
        <button type="submit">Submit Application</button>
      </form>

      <p v-if="applicationConfirmation" class="success-message">Application submitted successfully! We will get back to you shortly.</p>
      <p v-if="applicationError" class="error-message">{{ applicationErrorMessage }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import api from '../services/api';

export default defineComponent({
  name: 'Apply',
  setup() {
    const name = ref('');
    const email = ref('');
    const phone = ref('');
    const portfolio = ref('');
    const experience = ref(0);
    const gear = ref('');
    const message = ref('');
    const applicationConfirmation = ref(false);
    const applicationError = ref(false);
    const applicationErrorMessage = ref('');

    const submitApplication = async () => {
      applicationConfirmation.value = false;
      applicationError.value = false;
      applicationErrorMessage.value = '';

      try {
        const response = await api.post('/apply', {
          name: name.value,
          email: email.value,
          phone: phone.value,
          portfolio: portfolio.value,
          experience: experience.value,
          gear: gear.value,
          message: message.value,
        });

        if (response.status === 200) {
          applicationConfirmation.value = true;
          // Clear form fields
          name.value = '';
          email.value = '';
          phone.value = '';
          portfolio.value = '';
          experience.value = 0;
          gear.value = '';
          message.value = '';
        } else {
          applicationError.value = true;
          applicationErrorMessage.value = response.data.error || 'An unknown error occurred during application submission.';
        }
      } catch (error: any) {
        console.error('Error submitting application form:', error);
        applicationError.value = true;
        applicationErrorMessage.value = error.message || 'An error occurred while sending your application. Please try again.';
      }
    };

    return {
      name,
      email,
      phone,
      portfolio,
      experience,
      gear,
      message,
      applicationConfirmation,
      applicationError,
      applicationErrorMessage,
      submitApplication,
    };
  },
});
</script>

<style scoped>
.apply {
  padding: 20px;
}

.apply h1 {
  color: #333;
  margin-bottom: 10px;
}

.apply p {
  color: #777;
  line-height: 1.6;
}

.application-form {
  max-width: 600px;
  margin: 30px auto;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  text-align: left;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="tel"],
.form-group input[type="url"],
.form-group input[type="number"],
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

button[type="submit"] {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  margin-top: 10px;
}

button[type="submit"]:hover {
  background-color: #0056b3;
}

.success-message {
  color: green;
  font-weight: bold;
  margin-top: 20px;
}

.error-message {
  color: red;
  font-weight: bold;
  margin-top: 20px;
}
</style>