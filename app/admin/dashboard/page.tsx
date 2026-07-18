import { requireAdminOnly } from '@/lib/auth';
import prisma from '@/lib/prisma';
import DashboardWidget from '@/components/DashboardWidget';
import { Role } from '@prisma/client';

export default async function AdminDashboardPage() {
  await requireAdminOnly();

  const totalUsers = await prisma.user.count();
  const totalVendors = await prisma.user.count({ where: { role: Role.VENDOR } });
  const pendingVendors = await prisma.user.count({ where: { role: Role.VENDOR, isApproved: false } });
  const totalPricelists = await prisma.pricelist.count();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardWidget 
          label="Total Users" 
          value={totalUsers.toString()} 
          color="text-blue-700" 
        />
        <DashboardWidget 
          label="Total Vendors" 
          value={totalVendors.toString()} 
          color="text-indigo-700" 
        />
        <DashboardWidget 
          label="Pending Vendors" 
          value={pendingVendors.toString()} 
          color={pendingVendors > 0 ? "text-red-700" : "text-green-700"} 
        />
        <DashboardWidget 
          label="Active Pricelists" 
          value={totalPricelists.toString()} 
          color="text-purple-700" 
        />
      </div>
    </div>
  );
}
