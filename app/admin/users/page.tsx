import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/auth';
import UserList from './UserList';
import { Card, CardContent } from '@/components/ui/Card';

export default async function AdminUsersPage() {
  await requireAdminAccess();

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
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">Manage customer, vendor, and admin access levels.</p>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <UserList initialUsers={users} />
        </CardContent>
      </Card>
    </div>
  );
}
