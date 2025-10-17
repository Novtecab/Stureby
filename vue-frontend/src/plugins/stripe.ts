import { loadStripe } from '@stripe/stripe-js';

const STRIPE_PUBLIC_KEY = 'pk_test_51SH8FcR7AJeGzqyq1maXW6cybHSzsjhHwSofvnFF7KbvOPyQGkSgry99g1WZjM234zzKBbnU0xAj0XumBwbjXQaf00XPFMeR9Y';

let stripePromise: Promise<import('@stripe/stripe-js').Stripe | null> | null = null;

export const getStripe = async () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};