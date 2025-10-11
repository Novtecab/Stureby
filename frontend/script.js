document.addEventListener('DOMContentLoaded', () => {
    const photoGrid = document.querySelector('.photo-grid');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const bookingForm = document.querySelector('.booking-form');
    const contactForm = document.querySelector('.contact-form');

    // Initialize Stripe.js with your publishable key
    // Replace 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY' with your actual publishable key
    const stripe = Stripe('pk_test_TYu3ASJC9A1s3y0000000000'); // Placeholder for a test publishable key

    const API_URL = 'YOUR_DEPLOYED_BACKEND_URL/api'; // Placeholder: Replace with your actual deployed backend URL

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

    async function displayPhotos(filterCategory = 'all') {
        photoGrid.innerHTML = ''; // Clear current photos
        const photos = await fetchPhotos(); // Fetch photos from the backend

        const filteredPhotos = filterCategory === 'all'
            ? photos
            : photos.filter(photo => photo.category.toLowerCase() === filterCategory.toLowerCase());

        if (filteredPhotos.length === 0) {
            photoGrid.innerHTML = '<p>No photos found for this category.</p>';
            return;
        }

        filteredPhotos.forEach(photo => {
            const photoItem = document.createElement('div');
            photoItem.classList.add('photo-item');
            photoItem.innerHTML = `
                <img src="${photo.src}" alt="${photo.alt}">
                <div class="photo-item-info">
                    <h3>${photo.title}</h3>
                    <p>Category: ${photo.category}</p>
                    <p class="price">$${photo.price.toFixed(2)}</p>
                    <button data-id="${photo.id}">Add to Cart</button>
                </div>
            `;
            photoGrid.appendChild(photoItem);
        });

        // Add event listeners for "Add to Cart" buttons
        document.querySelectorAll('.photo-item-info button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const photoId = e.target.dataset.id;
                try {
                    const response = await fetch(`${API_URL}/create-checkout-session`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ photoId }),
                    });
                    const session = await response.json();
                    if (session.error) {
                        alert(session.error);
                    } else {
                        stripe.redirectToCheckout({ sessionId: session.id });
                    }
                } catch (error) {
                    console.error('Error creating checkout session:', error);
                    alert('Failed to initiate checkout. Please try again.');
                }
            });
        });
    }

    // Initial display of all photos
    displayPhotos();

    // Check for Stripe redirect success/cancel
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success')) {
        alert('Payment successful! Your order has been placed.');
        // You might want to clear cart or show order details here
    } else if (urlParams.get('canceled')) {
        alert('Payment canceled. You can continue browsing.');
    } else if (urlParams.get('bookingSuccess')) {
        alert('Booking payment successful! Your reservation is confirmed.');
        // You might want to show booking details or redirect to a booking confirmation page
    } else if (urlParams.get('bookingCanceled')) {
        alert('Booking payment canceled. Your reservation was not completed.');
    }

    // Category filtering
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const category = button.dataset.category;
            displayPhotos(category);
        });
    });

    // Booking Form Submission
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const serviceType = document.getElementById('service-type').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        const duration = parseInt(document.getElementById('duration').value);

        if (isNaN(duration) || duration <= 0) {
            alert('Please enter a valid duration in hours.');
            return;
        }

        try {
            // First, create a booking record in your database (optional, but good for tracking)
            const bookingResponse = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ serviceType, date, time, duration }),
            });

            const bookingResult = await bookingResponse.json();

            if (!bookingResponse.ok) {
                alert(`Booking failed: ${bookingResult.error}`);
                return;
            }

            // Then, create a Stripe checkout session for the booking
            const checkoutSessionResponse = await fetch(`${API_URL}/create-booking-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ serviceType, date, time, duration }),
            });

            const session = await checkoutSessionResponse.json();

            if (session.error) {
                alert(session.error);
            } else {
                stripe.redirectToCheckout({ sessionId: session.id });
            }

        } catch (error) {
            console.error('Error submitting booking or creating checkout session:', error);
            alert('An error occurred during booking. Please try again.');
        }
    });

    // Contact Form Submission (placeholder)
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Message sent! We will get back to you shortly.');
        // In a real application, you would send this data to your backend
        // console.log('Contact details:', {
        //     name: document.getElementById('name').value,
        //     email: document.getElementById('email').value,
        //     message: document.getElementById('message').value,
        // });
        contactForm.reset();
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('nav ul li a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});