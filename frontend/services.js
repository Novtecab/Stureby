import { API_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Function to fetch services
    async function fetchServices() {
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
    async function displayServices() {
        const servicesContainer = document.querySelector('.services-grid');
        if (!servicesContainer) return;

        const services = await fetchServices();
        servicesContainer.innerHTML = '';

        if (services.length === 0) {
            servicesContainer.innerHTML = '<p>No services available at the moment.</p>';
            return;
        }

        services.forEach(service => {
            const serviceItem = document.createElement('div');
            serviceItem.classList.add('service-item');
            serviceItem.innerHTML = `
                <img src="${service.image}" alt="${service.title}">
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

    // Function to fetch investments
    async function fetchInvestments() {
        try {
            const response = await fetch(`${API_URL}/investments`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching investments:', error);
            return [];
        }
    }

    // Function to display investments
    async function displayInvestments() {
        const investmentsContainer = document.querySelector('.investment-packages');
        if (!investmentsContainer) return;

        const investments = await fetchInvestments();
        investmentsContainer.innerHTML = '';

        if (investments.length === 0) {
            investmentsContainer.innerHTML = '<p>No investment packages available at the moment.</p>';
            return;
        }

        investments.forEach(investment => {
            const packageItem = document.createElement('div');
            packageItem.classList.add('package-item');
            packageItem.innerHTML = `
                <h2>${investment.title}</h2>
                <p class="price">$${investment.price.toFixed(2)}</p>
                <ul>
                    ${investment.details.map(detail => `<li>${detail}</li>`).join('')}
                </ul>
                <a href="index.html#booking" class="button">Book Now</a>
            `;
            investmentsContainer.appendChild(packageItem);
        });
    }

    if (document.querySelector('.services-grid')) {
        displayServices();
    }
    if (document.querySelector('.investment-packages')) {
        displayInvestments();
    }
});