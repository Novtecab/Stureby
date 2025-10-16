import { API_URL } from './config.js';

// Function to fetch services
export async function fetchServices() {
    try {
        const response = await fetch(`${API_URL}/services`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching services:', error);
        return [];
    }
}

// Function to display services
export async function displayServices(containerSelector, limit = 0) {
    const servicesContainer = document.querySelector(containerSelector);
    if (!servicesContainer) return;

    const services = await fetchServices();
    servicesContainer.innerHTML = '';

    const servicesToDisplay = limit > 0 ? services.slice(0, limit) : services;

    if (servicesToDisplay.length === 0) {
        servicesContainer.innerHTML = '<p>No services available at the moment.</p>';
        return;
    }

    servicesToDisplay.forEach(service => {
        const serviceItem = document.createElement('div');
        serviceItem.classList.add('service-item');
        serviceItem.innerHTML = `
            <img src="${service.image || `${API_URL}/assets/placeholder_image_default.jpg`}" alt="${service.title}">
            <h3>${service.title}</h3>
            <p>${service.description}</p>
            <ul>
                ${service.details.map(detail => `<li>${detail}</li>`).join('')}
            </ul>
            <a href="index.html#booking" class="button">Inquire Now</a>
        `;
        servicesContainer.appendChild(serviceItem);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.services-grid')) {
        displayServices('.services-grid');
    }
});