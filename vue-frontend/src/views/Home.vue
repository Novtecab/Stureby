<template>
  <div class="home">
    <h1>Welcome to Stureby Photography</h1>
    <p>Your destination for stunning photography, exclusive magazines, and professional sessions.</p>
    <!-- Placeholder for featured content -->
    <section class="featured-photos">
      <h2>Featured Photos</h2>
      <p>Browse our latest and most popular works.</p>
      <div v-if="featuredPhotos.length" class="photo-grid">
        <div v-for="photo in featuredPhotos" :key="photo.id" class="photo-item">
          <img :src="photo.src" :alt="photo.alt">
          <div class="photo-item-info">
            <h3>{{ photo.title }}</h3>
            <p>Category: {{ photo.category }}</p>
            <p class="price">${{ photo.price.toFixed(2) }}</p>
            <button @click="buyPhoto(photo.id)">Buy Now</button>
          </div>
        </div>
      </div>
      <p v-else>No featured photos available at the moment.</p>
    </section>

    <section class="featured-services">
      <h2>Our Services</h2>
      <p>Explore our range of photography sessions.</p>
      <!-- Services overview will go here -->
    </section>

    <section class="featured-magazine">
      <h2>Photography Magazine</h2>
      <p>Pre-order the latest issue!</p>
      <!-- Magazine preview will go here -->
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import api from '../services/api';
import { initiateCheckout } from '../utils/stripeCheckout';

import type { Photo } from '../types';

export default defineComponent({
  name: 'Home',
  setup() {
    const featuredPhotos = ref<Photo[]>([]);

    const fetchFeaturedPhotos = async () => {
      try {
        const response = await api.get('/photos?limit=3'); // Fetch a limited number of photos
        featuredPhotos.value = response.data;
      } catch (error) {
        console.error('Error fetching featured photos:', error);
      }
    };

    const buyPhoto = async (photoId: string) => {
      await initiateCheckout([{ id: photoId, quantity: 1, type: 'photo' }]);
    };

    onMounted(fetchFeaturedPhotos);

    return {
      featuredPhotos,
      buyPhoto,
    };
  },
});
</script>

<style scoped>
.home {
  padding: 20px;
}

.home section {
  margin-bottom: 40px;
}

.home h1 {
  color: #333;
  margin-bottom: 10px;
}

.home h2 {
  color: #555;
  margin-top: 30px;
  margin-bottom: 15px;
}

.home p {
  color: #777;
  line-height: 1.6;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.photo-item {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  text-align: left;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.photo-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.photo-item-info {
  padding: 15px;
}

.photo-item-info h3 {
  margin-top: 0;
  color: #333;
}

.photo-item-info p {
  margin: 5px 0;
  color: #666;
}

.photo-item-info .price {
  font-weight: bold;
  color: #007bff;
  font-size: 1.1em;
}

.photo-item-info button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
  width: 100%;
}

.photo-item-info button:hover {
  background-color: #218838;
}
</style>