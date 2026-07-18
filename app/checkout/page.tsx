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
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Complete Your Rental</h1>
      <CheckoutForm />
    </div>
  );
}
