// Dynamically determine the API URL based on the current host
// For Netlify, this will point to the Netlify Functions endpoint.
// For local development, ensure your backend runs on port 3000 or adjust accordingly.
export const API_URL = window.location.origin.includes('localhost') ? 'http://localhost:3000/api' : `${window.location.origin}/.netlify/functions/server/api`;

// Initialize Stripe.js with your publishable key
export function getStripeInstance() {
    if (typeof window !== 'undefined' && window.Stripe) {
        return window.Stripe('pk_test_51SH8FcR7AJeGzqyq1maXW6cybHSzsjhHwSofvnFF7KbvOPyQGkSgry99g1WZjM234zzKBbnU0xAj0XumBwbjXQaf00XPFMeR9Y');
    }
    return null;
}