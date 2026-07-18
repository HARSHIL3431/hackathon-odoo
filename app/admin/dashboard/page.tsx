import { requireAdmin, AuthError } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminDashboardPage() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 401) redirect('/login');
      if (error.statusCode === 403) {
        return (
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-red-600">403</h1>
              <p className="mt-2 text-lg text-gray-700">Forbidden: Admin access required</p>
            </div>
          </div>
        );
      }
    }
    throw error;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p>Welcome to the admin area.</p>
    </div>
  );
}
