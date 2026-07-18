import CheckoutForm from '@/components/CheckoutForm';
import { requireCustomer } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  await requireCustomer(); // Ensure only logged-in customers can checkout

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Complete Your Rental</h1>
      <CheckoutForm />
    </div>
  );
}
