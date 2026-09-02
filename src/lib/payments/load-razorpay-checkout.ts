const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export class RazorpayCheckoutLoadError extends Error {
  constructor() {
    super("checkout");
    this.name = "RazorpayCheckoutLoadError";
  }
}

type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name?: string;
  description?: string;
  handler: (response: RazorpayCheckoutResponse) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayCtor = new (options: RazorpayCheckoutOptions) => { open: () => void };

declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

export async function loadRazorpayCheckout(): Promise<RazorpayCtor> {
  if (typeof window === "undefined") {
    throw new RazorpayCheckoutLoadError();
  }
  if (window.Razorpay) {
    return window.Razorpay;
  }
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new RazorpayCheckoutLoadError()), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new RazorpayCheckoutLoadError());
    document.head.appendChild(script);
  });
  if (!window.Razorpay) {
    throw new RazorpayCheckoutLoadError();
  }
  return window.Razorpay;
}

export type { RazorpayCheckoutResponse };
