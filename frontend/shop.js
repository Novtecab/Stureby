import { API_URL, getStripeInstance } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const shopGrid = document.querySelector('.shop-grid');

    async function fetchPhotos() {
        try {
            const response = await fetch(`${API_URL}/photos`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching photos:', error);
            return [];
        }
    }

    async function displayItems(container, items, isShop = false) {
        container.innerHTML = ''; // Clear current items

        if (items.length === 0) {
            container.innerHTML = `<p>No ${isShop ? 'shop items' : 'photos'} found for this category.</p>`;
            return;
        }

        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add(isShop ? 'shop-item' : 'photo-item');
            itemElement.innerHTML = `
                <img src="${item.src}" alt="${item.alt}">
                <div class="${isShop ? 'shop-item-info' : 'photo-item-info'}">
                    <h3>${item.title}</h3>
                    <p>Category: ${item.category}</p>
                    <p class="price">$${item.price.toFixed(2)}</p>
                    ${isShop ? `<button class="buy-now-btn" data-id="${item.id}">Buy Now</button>` : `<button data-id="${item.id}">Add to Cart</button>`}
                </div>
            `;
            container.appendChild(itemElement);
        });

        // Add event listeners for "Add to Cart" or "Buy Now" buttons
        container.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const itemId = e.target.dataset.id;
                try {
                    const response = await fetch(`${API_URL}/create-checkout-session`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ photoId: itemId }), // Use photoId as backend expects
                    });
                    const session = await response.json();
                    if (session.error) {
                        alert(session.error);
                    } else {
                        const stripe = getStripeInstance();
                        if (stripe) {
                            stripe.redirectToCheckout({ sessionId: session.id });
                        } else {
                            console.error('Stripe.js is not loaded.');
                            alert('Stripe is not available. Please try again later.');
                        }
                    }
                } catch (error) {
                    console.error('Error creating checkout session:', error);
                    alert('Failed to initiate checkout. Please try again.');
                }
            });
        });
    }

    async function displayShopItems() {
        const photos = await fetchPhotos(); // Fetch all photos for the shop
        displayItems(shopGrid, photos, true);
    }

    if (shopGrid) {
        displayShopItems();
    }
});