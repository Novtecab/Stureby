import { getStripe } from '../plugins/stripe';
import api from '../services/api';

export const initiateCheckout = async (items: Array<{ id: string; quantity: number; type: string }>) => {
  try {
    const response = await api.post('/create-checkout-session', { items });
    const session = response.data;

    if (session.id) {
      const stripe = await getStripe();
      if (stripe) {
        // Type assertion to bypass TypeScript error, as redirectToCheckout is available on the Stripe object
        await (stripe as any).redirectToCheckout({ sessionId: session.id });
      } else {
        console.error('Stripe.js is not loaded.');
        alert('Stripe is not available. Please try again later.');
      }
    } else if (session.error) {
      alert(session.error);
    } else {
      alert('Failed to create checkout session. Please try again.');
    }
  } catch (error) {
    console.error('Error initiating checkout:', error);
    alert('An error occurred during checkout. Please try again.');
  }
};