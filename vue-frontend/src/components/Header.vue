<template>
  <header>
    <nav>
      <router-link to="/">Home</router-link>
      <router-link to="/shop">Shop</router-link>
      <router-link to="/magazine">Magazine</router-link>
      <router-link to="/booking">Booking</router-link>
      <router-link to="/apply">Apply</router-link>
    </nav>
  </header>
</template>

<script>
export default {
  name: 'Header'
};
</script>

<style scoped>
header {
  background-color: #f8f8f8;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

nav a {
  margin: 0 15px;
  text-decoration: none;
  color: #333;
  font-weight: bold;
}

nav a:hover {
  color: #007bff;
}
</style>