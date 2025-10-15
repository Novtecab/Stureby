document.addEventListener('DOMContentLoaded', () => {
    const photoGrid = document.querySelector('.photo-grid');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const contactForm = document.querySelector('.contact-form');

    // Booking elements
    const bookingDateInput = document.getElementById('booking-date');
    const bookingDurationInput = document.getElementById('booking-duration');
    const checkAvailabilityBtn = document.getElementById('check-availability-btn');
    const availableSlotsContainer = document.getElementById('available-slots');
    const noSlotsMessage = document.getElementById('no-slots-message');
    const serviceTypeInput = document.getElementById('service-type');
    const clientNameInput = document.getElementById('client-name');
    const clientEmailInput = document.getElementById('client-email');
    const bookingConfirmation = document.getElementById('booking-confirmation');
    const bookingError = document.getElementById('booking-error');
    const bookingErrorMessage = document.getElementById('booking-error-message');
 
    // Initialize Stripe.js with your publishable key
    // Replace 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY' with your actual publishable key
    const stripe = Stripe('pk_test_TYu3ASJC9A1s3y0000000000'); // Placeholder for a test publishable key
 
    // IMPORTANT: Replace with your actual deployed backend URL
    const API_URL = 'http://localhost:3000/api';
 
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
 
    // Function to fetch and display available slots
    async function fetchAndDisplayAvailableSlots() {
        const selectedDate = bookingDateInput.value;
        const durationMinutes = bookingDurationInput.value;
        const serviceType = serviceTypeInput.value;
        const clientName = clientNameInput.value;
        const clientEmail = clientEmailInput.value;
 
        if (!selectedDate || !durationMinutes || !serviceType || !clientName || !clientEmail) {
            alert('Please fill in all booking details: Date, Duration, Service Type, Your Name, and Your Email.');
            return;
        }
 
        availableSlotsContainer.innerHTML = ''; // Clear previous slots
        noSlotsMessage.style.display = 'none';
        bookingConfirmation.style.display = 'none';
        bookingError.style.display = 'none';
 
        try {
            const response = await fetch(`${API_URL}/calendar/available-slots?startDate=${selectedDate}T00:00:00Z&endDate=${selectedDate}T23:59:59Z&durationMinutes=${durationMinutes}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const slots = await response.json();
 
            if (slots.length === 0) {
                noSlotsMessage.style.display = 'block';
                return;
            }
 
            slots.forEach(slot => {
                const slotButton = document.createElement('button');
                slotButton.classList.add('slot-button');
                const startTime = new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const endTime = new Date(slot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                slotButton.textContent = `${startTime} - ${endTime}`;
                slotButton.dataset.start = slot.start;
                slotButton.dataset.end = slot.end;
 
                slotButton.addEventListener('click', async () => {
                    // Direct booking when a slot is clicked
                    document.querySelectorAll('.slot-button').forEach(btn => btn.classList.remove('active'));
                    slotButton.classList.add('active');
 
                    const durationHours = parseInt(durationMinutes) / 60; // Convert minutes to hours
 
                    const bookingDetails = {
                        serviceType,
                        date: new Date(slot.start).toISOString().split('T')[0],
                        time: new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                        duration: durationHours,
                        clientName,
                        clientEmail
                    };
 
                    try {
                        const bookingResponse = await fetch(`${API_URL}/bookings/google-calendar`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(bookingDetails),
                        });
 
                        const bookingResult = await bookingResponse.json();
 
                        if (bookingResponse.ok) {
                            availableSlotsContainer.innerHTML = '';
                            noSlotsMessage.style.display = 'none';
                            bookingConfirmation.style.display = 'block';
                            bookingError.style.display = 'none';
                            // Optionally, clear the client details form fields
                            clientNameInput.value = '';
                            clientEmailInput.value = '';
                        } else {
                            bookingError.style.display = 'block';
                            bookingErrorMessage.textContent = bookingResult.error || 'An unknown error occurred during booking.';
                            console.error('Booking failed:', bookingResult.error);
                        }
                    } catch (bookingError) {
                        console.error('Error submitting direct booking:', bookingError);
                        bookingError.style.display = 'block';
                        bookingErrorMessage.textContent = 'An error occurred during direct booking. Please try again.';
                    }
                });
                availableSlotsContainer.appendChild(slotButton);
            });
        } catch (error) {
            console.error('Error fetching available slots:', error);
            alert('Failed to fetch available slots. Please try again.');
        }
    }
 
    // Event listener for checking availability
    checkAvailabilityBtn.addEventListener('click', fetchAndDisplayAvailableSlots);
 
    // Contact Form Submission
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
 
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
 
        try {
            const response = await fetch(`${API_URL}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, message }),
            });
 
            const result = await response.json();
 
            if (response.ok) {
                alert('Message sent successfully! We will get back to you shortly.');
                contactForm.reset();
            } else {
                alert(`Failed to send message: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error submitting contact form:', error);
            alert('An error occurred while sending your message. Please try again.');
        }
    });
 
    // Smooth scrolling for navigation links
    document.querySelectorAll('.nav-link').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
 
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});