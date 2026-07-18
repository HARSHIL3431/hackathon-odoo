import CheckoutForm from '@/components/CheckoutForm';
import { requireCustomerAccess, AuthError } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  try {
    await requireCustomerAccess(); // Ensure only logged-in customers can checkout
  } catch (error) {
    if (error instanceof AuthError && error.statusCode === 401) {
      redirect('/login?next=/checkout');
    }
    throw error;
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Complete Your Rental</h1>
        <p className="mt-2 text-muted-foreground">Review your order details and submit payment.</p>
      </div>
      <CheckoutForm />
    </div>
  );
}
