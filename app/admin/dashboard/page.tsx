import prisma from '@/lib/prisma';
import DashboardWidget from '@/components/DashboardWidget';
import { Role } from '@prisma/client';
import { Users, UserCheck, AlertCircle, Tags } from 'lucide-react';

export default async function AdminDashboardPage() {

  const totalUsers = await prisma.user.count();
  const totalVendors = await prisma.user.count({ where: { role: Role.VENDOR } });
  const pendingVendors = await prisma.user.count({ where: { role: Role.VENDOR, isApproved: false } });
  const totalPricelists = await prisma.pricelist.count();

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-muted-foreground mt-2">Manage the platform, users, and global settings.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardWidget 
          label="Total Users" 
          value={totalUsers.toString()} 
          icon={<Users />}
          color="text-primary" 
        />
        <DashboardWidget 
          label="Total Vendors" 
          value={totalVendors.toString()} 
          icon={<UserCheck />}
          color="text-primary" 
        />
        <DashboardWidget 
          label="Pending Vendors" 
          value={pendingVendors.toString()} 
          icon={<AlertCircle className={pendingVendors > 0 ? "text-amber-500" : "text-muted-foreground"} />}
          color={pendingVendors > 0 ? "text-amber-500" : "text-green-600"} 
        />
        <DashboardWidget 
          label="Active Pricelists" 
          value={totalPricelists.toString()} 
          icon={<Tags />}
          color="text-primary" 
        />
      </div>
    </div>
  );
}
