<template>
  <div class="shop">
    <h1>Photography Shop</h1>
    <p>Browse and purchase our exquisite collection of photographs.</p>
    <!-- Photo display and filtering will go here -->
    <div class="filters">
      <button @click="filterCategory('all')" :class="{ active: activeCategory === 'all' }">All</button>
      <button @click="filterCategory('landscape')" :class="{ active: activeCategory === 'landscape' }">Landscape</button>
      <button @click="filterCategory('portrait')" :class="{ active: activeCategory === 'portrait' }">Portrait</button>
      <button @click="filterCategory('wildlife')" :class="{ active: activeCategory === 'wildlife' }">Wildlife</button>
    </div>

    <div v-if="photos.length" class="photo-grid">
      <div v-for="photo in filteredPhotos" :key="photo.id" class="photo-item">
        <img :src="photo.src" :alt="photo.alt">
        <div class="photo-item-info">
          <h3>{{ photo.title }}</h3>
          <p>Category: {{ photo.category }}</p>
          <p class="price">${{ photo.price.toFixed(2) }}</p>
          <button @click="buyPhoto(photo.id)">Buy Now</button>
        </div>
      </div>
    </div>
    <p v-else>No photos available at the moment.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import api from '../services/api';
import { initiateCheckout } from '../utils/stripeCheckout';

import type { Photo } from '../types';

export default defineComponent({
  name: 'Shop',
  setup() {
    const photos = ref<Photo[]>([]);
    const activeCategory = ref('all');

    const fetchPhotos = async () => {
      try {
        const response = await api.get('/photos');
        photos.value = response.data;
      } catch (error) {
        console.error('Error fetching photos:', error);
      }
    };

    const filteredPhotos = computed(() => {
      if (activeCategory.value === 'all') {
        return photos.value;
      }
      return photos.value.filter(photo => photo.category.toLowerCase() === activeCategory.value);
    });

    const filterCategory = (category: string) => {
      activeCategory.value = category;
    };

    const buyPhoto = async (photoId: string) => {
      await initiateCheckout([{ id: photoId, quantity: 1, type: 'photo' }]);
    };

    onMounted(fetchPhotos);

    return {
      photos,
      activeCategory,
      filteredPhotos,
      filterCategory,
      buyPhoto,
    };
  },
});
</script>

<style scoped>
.shop {
  padding: 20px;
}

.shop h1 {
  color: #333;
  margin-bottom: 10px;
}

.shop p {
  color: #777;
  line-height: 1.6;
}

.filters button {
  margin: 5px;
  padding: 8px 15px;
  border: 1px solid #ccc;
  background-color: #f0f0f0;
  cursor: pointer;
  border-radius: 5px;
}

.filters button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
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