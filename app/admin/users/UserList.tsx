'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Check, X, Shield, ShieldAlert, User } from 'lucide-react';

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  isApproved: boolean;
  createdAt: Date;
};

export default function UserList({ initialUsers }: { initialUsers: UserData[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    setLoadingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !currentStatus }),
      });
      if (!res.ok) throw new Error('Failed to update user');
      
      setUsers(users.map(u => u.id === id ? { ...u, isApproved: !currentStatus } : u));
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingId(null);
    }
  };

  const changeRole = async (id: string, newRole: string) => {
    setLoadingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="p-4 bg-destructive/15 text-destructive border-b border-destructive/20 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User Details</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className={loadingId === user.id ? "opacity-50 pointer-events-none" : ""}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    {user.role === 'ADMIN' ? <ShieldAlert className="h-5 w-5 text-muted-foreground" /> : 
                     user.role === 'VENDOR' ? <Shield className="h-5 w-5 text-muted-foreground" /> : 
                     <User className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="relative w-32">
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(user.id, e.target.value)}
                    disabled={loadingId === user.id}
                    className="flex h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="VENDOR">Vendor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                    <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={user.isApproved ? "success" : "warning"}>
                  {user.isApproved ? "Approved" : "Pending"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant={user.isApproved ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleApproval(user.id, user.isApproved)}
                  disabled={loadingId === user.id}
                  className={user.isApproved ? "text-destructive hover:text-destructive hover:bg-destructive/10" : ""}
                >
                  {user.isApproved ? (
                    <><X className="mr-1 h-4 w-4" /> Revoke</>
                  ) : (
                    <><Check className="mr-1 h-4 w-4" /> Approve</>
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
