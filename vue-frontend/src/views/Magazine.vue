<template>
  <div class="magazine">
    <h1>Photography Magazine</h1>
    <p>Pre-order our exclusive photography magazine and get inspired!</p>
    <!-- Magazine details and pre-order form will go here -->
    <div v-if="magazine" class="magazine-details">
      <img :src="magazine.coverImage" :alt="magazine.title" class="magazine-cover">
      <h2>{{ magazine.title }}</h2>
      <p class="magazine-description">{{ magazine.description }}</p>
      <p class="magazine-price">Price: ${{ magazine.price.toFixed(2) }}</p>
      <p class="magazine-release">Release Date: {{ new Date(magazine.releaseDate).toLocaleDateString() }}</p>
      <button @click="preOrderMagazine(magazine.id)" class="preorder-button">Pre-order Now</button>
    </div>
    <p v-else>No magazine information available at the moment.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import api from '../services/api';
import { initiateCheckout } from '../utils/stripeCheckout';
import { Magazine } from '../types';

export default defineComponent({
  name: 'Magazine',
  setup() {
    const magazine = ref<Magazine | null>(null);

    const fetchMagazine = async () => {
      try {
        const response = await api.get('/magazine'); // Assuming a single magazine or latest one
        magazine.value = response.data;
      } catch (error) {
        console.error('Error fetching magazine:', error);
      }
    };

    const preOrderMagazine = async (magazineId: string) => {
      await initiateCheckout([{ id: magazineId, quantity: 1, type: 'magazine' }]);
    };

    onMounted(fetchMagazine);

    return {
      magazine,
      preOrderMagazine,
    };
  },
});
</script>

<style scoped>
.magazine {
  padding: 20px;
}

.magazine h1 {
  color: #333;
  margin-bottom: 10px;
}

.magazine p {
  color: #777;
  line-height: 1.6;
}

.magazine-details {
  max-width: 800px;
  margin: 30px auto;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  text-align: center;
}

.magazine-cover {
  max-width: 100%;
  height: auto;
  border-radius: 5px;
  margin-bottom: 20px;
}

.magazine-details h2 {
  color: #333;
  margin-bottom: 10px;
}

.magazine-description {
  color: #666;
  margin-bottom: 15px;
}

.magazine-price {
  font-weight: bold;
  color: #007bff;
  font-size: 1.2em;
  margin-bottom: 10px;
}

.magazine-release {
  color: #888;
  font-size: 0.9em;
  margin-bottom: 20px;
}

.preorder-button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1em;
}

.preorder-button:hover {
  background-color: #218838;
}
</style>