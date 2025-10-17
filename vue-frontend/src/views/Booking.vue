<template>
  <div class="booking">
    <h1>Book a Photography Session</h1>
    <p>Choose from corporate, product, or fashion photography sessions.</p>
    <!-- Session type selection, calendar, and booking form will go here -->
    <div class="booking-form">
      <div class="form-group">
        <label for="service-type">Select Service Type:</label>
        <select id="service-type" v-model="selectedServiceId" @change="fetchServicesAndSlots">
          <option value="">-- Please select a service --</option>
          <option v-for="service in services" :key="service.id" :value="service.id">
            {{ service.title }} - ${{ service.price.toFixed(2) }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="booking-date">Select Date:</label>
        <input type="date" id="booking-date" v-model="selectedDate" @change="fetchAvailableSlots">
      </div>

      <div class="form-group">
        <label for="booking-duration">Duration (minutes):</label>
        <input type="number" id="booking-duration" v-model="durationMinutes" min="30" step="30" @change="fetchAvailableSlots">
      </div>

      <button @click="fetchAvailableSlots" :disabled="!selectedServiceId || !selectedDate || !durationMinutes">Check Availability</button>

      <div v-if="availableSlots.length" class="available-slots">
        <h3>Available Slots for {{ formattedDate }}:</h3>
        <div class="slot-grid">
          <button
            v-for="slot in availableSlots"
            :key="slot.start"
            @click="selectSlot(slot)"
            :class="{ 'selected-slot': selectedSlot && selectedSlot.start === slot.start }"
          >
            {{ formatTime(slot.start) }} - {{ formatTime(slot.end) }}
          </button>
        </div>
      </div>
      <p v-else-if="selectedServiceId && selectedDate && durationMinutes && !availableSlots.length">No slots available for the selected criteria.</p>

      <div v-if="selectedSlot" class="client-details">
        <h3>Confirm Your Booking</h3>
        <p>Selected Slot: {{ formatTime(selectedSlot.start) }} - {{ formatTime(selectedSlot.end) }} on {{ formattedDate }}</p>
        <div class="form-group">
          <label for="client-name">Your Name:</label>
          <input type="text" id="client-name" v-model="clientName">
        </div>
        <div class="form-group">
          <label for="client-email">Your Email:</label>
          <input type="email" id="client-email" v-model="clientEmail">
        </div>
        <button @click="confirmBooking" :disabled="!clientName || !clientEmail">Confirm Booking</button>
      </div>

      <p v-if="bookingConfirmation" class="success-message">Booking confirmed! You will receive an email shortly.</p>
      <p v-if="bookingError" class="error-message">{{ bookingErrorMessage }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import api from '../services/api';
import { initiateCheckout } from '../utils/stripeCheckout';
import { type Service, type BookingSlot } from '../types';

export default defineComponent({
  name: 'Booking',
  setup() {
    const services = ref<Service[]>([]);
    const selectedServiceId = ref('');
    const selectedDate = ref('');
    const durationMinutes = ref(60); // Default duration
    const availableSlots = ref<BookingSlot[]>([]);
    const selectedSlot = ref<BookingSlot | null>(null);
    const clientName = ref('');
    const clientEmail = ref('');
    const bookingConfirmation = ref(false);
    const bookingError = ref(false);
    const bookingErrorMessage = ref('');

    const fetchServices = async () => {
      try {
        const response = await api.get('/services');
        services.value = response.data;
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };

    const fetchAvailableSlots = async () => {
      if (!selectedDate.value || !durationMinutes.value) {
        availableSlots.value = [];
        return;
      }
      try {
        const response = await api.get(`/calendar/available-slots?startDate=${selectedDate.value}T00:00:00Z&endDate=${selectedDate.value}T23:59:59Z&durationMinutes=${durationMinutes.value}`);
        availableSlots.value = response.data;
        selectedSlot.value = null; // Reset selected slot on new availability check
        bookingConfirmation.value = false;
        bookingError.value = false;
      } catch (error) {
        console.error('Error fetching available slots:', error);
        availableSlots.value = [];
        bookingError.value = true;
        bookingErrorMessage.value = 'Failed to fetch available slots.';
      }
    };

    const fetchServicesAndSlots = () => {
      fetchServices();
      fetchAvailableSlots();
    };

    const formatTime = (isoString: string) => {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formattedDate = computed(() => {
      return selectedDate.value ? new Date(selectedDate.value).toLocaleDateString() : '';
    });

    const selectSlot = (slot: BookingSlot) => {
      selectedSlot.value = slot;
    };

    const confirmBooking = async () => {
      if (!selectedSlot.value || !selectedServiceId.value || !clientName.value || !clientEmail.value) {
        alert('Please fill in all required fields.');
        return;
      }

      bookingConfirmation.value = false;
      bookingError.value = false;
      bookingErrorMessage.value = '';

      try {
        const selectedService = services.value.find(s => s.id === selectedServiceId.value);
        if (!selectedService) {
          throw new Error('Selected service not found.');
        }

        const bookingDetails = {
          serviceType: selectedService.title,
          date: new Date(selectedSlot.value.start).toISOString().split('T')[0],
          time: new Date(selectedSlot.value.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          duration: durationMinutes.value / 60, // Convert minutes to hours
          clientName: clientName.value,
          clientEmail: clientEmail.value,
          price: selectedService.price,
        };

        // Initiate Stripe Checkout for the booking
        await initiateCheckout([{ id: selectedServiceId.value, quantity: 1, type: 'booking', price: selectedService.price }]);

        // After successful Stripe payment, send booking details to backend
        // This part would typically be handled by a webhook from Stripe,
        // but for demonstration, we'll assume success and proceed.
        const bookingResponse = await api.post('/bookings/google-calendar', bookingDetails);

        if (bookingResponse.status === 200) {
          bookingConfirmation.value = true;
          // Clear form fields
          selectedServiceId.value = '';
          selectedDate.value = '';
          durationMinutes.value = 60;
          availableSlots.value = [];
          selectedSlot.value = null;
          clientName.value = '';
          clientEmail.value = '';
        } else {
          bookingError.value = true;
          bookingErrorMessage.value = bookingResponse.data.error || 'An unknown error occurred during booking.';
        }
      } catch (error: any) {
        console.error('Error confirming booking:', error);
        bookingError.value = true;
        bookingErrorMessage.value = error.message || 'An error occurred during booking. Please try again.';
      }
    };

    onMounted(fetchServices);

    return {
      services,
      selectedServiceId,
      selectedDate,
      durationMinutes,
      availableSlots,
      selectedSlot,
      clientName,
      clientEmail,
      bookingConfirmation,
      bookingError,
      bookingErrorMessage,
      fetchServicesAndSlots,
      fetchAvailableSlots,
      formatTime,
      formattedDate,
      selectSlot,
      confirmBooking,
    };
  },
});
</script>

<style scoped>
.booking {
  padding: 20px;
}

.booking h1 {
  color: #333;
  margin-bottom: 10px;
}

.booking p {
  color: #777;
  line-height: 1.6;
}

.booking-form {
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

.form-group input[type="date"],
.form-group input[type="number"],
.form-group input[type="text"],
.form-group input[type="email"],
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  margin-top: 10px;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
}

.available-slots {
  margin-top: 30px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.available-slots h3 {
  color: #333;
  margin-bottom: 15px;
}

.slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.slot-grid button {
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
}

.slot-grid button.selected-slot {
  background-color: #28a745;
  color: white;
  border-color: #28a745;
}

.slot-grid button:hover:not(.selected-slot) {
  background-color: #e0e0e0;
}

.client-details {
  margin-top: 30px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.client-details h3 {
  color: #333;
  margin-bottom: 15px;
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