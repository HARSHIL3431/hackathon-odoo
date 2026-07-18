import { requireAdminOnly } from '@/lib/auth';
import prisma from '@/lib/prisma';
import UserList from './UserList';

export default async function AdminUsersPage() {
  await requireAdminOnly();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isApproved: true,
      createdAt: true,
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <UserList initialUsers={users} />
      </div>
    </div>
  );
}
