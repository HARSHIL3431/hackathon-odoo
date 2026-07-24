import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/auth';
import Link from 'next/link';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Tags } from 'lucide-react';

export default async function AdminPricelistsPage() {
  await requireAdminAccess();

  const pricelists = await prisma.pricelist.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pricelists</h1>
          <p className="text-muted-foreground mt-2">Manage discount tiers and pricing rules.</p>
        </div>
        <Button asChild>
          <Link href="/admin/pricelists/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Pricelist
          </Link>
        </Button>
      </div>
      
      {pricelists.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center animate-in fade-in-50">
          <Tags className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No pricelists found</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            Get started by creating a default pricelist.
          </p>
          <Button asChild variant="outline">
            <Link href="/admin/pricelists/new">Create First Pricelist</Link>
          </Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Discount %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricelists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell className="font-medium">{list.name}</TableCell>
                    <TableCell>{list.discountPercent}%</TableCell>
                    <TableCell>
                      {list.isDefault ? (
                        <Badge variant="success">Default</Badge>
                      ) : (
                        <Badge variant="secondary">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(list.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
