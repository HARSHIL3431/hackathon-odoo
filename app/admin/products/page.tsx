'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Product } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Search, Plus, Edit, Archive, RefreshCcw, Trash2, Eye,
  Package, PackageX, AlertTriangle, Boxes, ChevronLeft, ChevronRight,
  ArrowUpDown, Download, CheckSquare, Square, MoreHorizontal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

type ProductWithCount = Product & { _count: { orders: number } };

type DashboardKPIs = {
  totalProducts: number;
  activeProducts: number;
  archivedProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  totalStock: number;
  totalReserved: number;
  totalAvailable: number;
  totalStockValue: number;
  lowStockThreshold: number;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const CATEGORIES = [
  'Power Tools',
  'Construction Equipment',
  'Safety Equipment',
  'Electrical Tools',
  'Ladders',
  'Plumbing Equipment',
  'Landscaping',
  'Cleaning Equipment',
  'Generators',
  'Measuring Tools',
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchKPIs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products/dashboard');
      if (!res.ok) throw new Error('Failed to fetch KPIs');
      setKpis(await res.json());
    } catch { /* silent */ }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        status: statusFilter,
        category: categoryFilter,
        page: String(pagination.page),
        limit: String(pagination.limit),
        sortBy,
        sortOrder,
      });
      const res = await fetch(`/api/admin/products?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(data.products);
      setPagination(data.pagination);
      if (data.categories) setCategories(data.categories);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, pagination.page, pagination.limit, sortBy, sortOrder]);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refreshAll = () => {
    fetchProducts();
    fetchKPIs();
    setSelectedIds(new Set());
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Archive this product? It will be hidden from the customer catalog.')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success('Product archived');
      refreshAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success('Product restored');
      refreshAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Permanently delete this product? This action CANNOT be undone.')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}?permanent=true`, { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(d.message);
      refreshAll();
    } catch (err: any) { toast.error(err.message); }
  };

  // Bulk actions
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(products.map(p => p.id)));
  };

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Archive ${selectedIds.size} selected product(s)?`)) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/admin/products/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: false }),
          })
        )
      );
      toast.success(`${selectedIds.size} product(s) archived`);
      refreshAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/admin/products/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: true }),
          })
        )
      );
      toast.success(`${selectedIds.size} product(s) restored`);
      refreshAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleExportCSV = () => {
    const rows = products.filter(p => selectedIds.size === 0 || selectedIds.has(p.id));
    const header = 'Name,Category,SKU,Price/Day,Deposit,Late Fee,Stock,Status\n';
    const csv = header + rows.map(p =>
      `"${p.name}","${p.category || ''}","${p.sku || ''}",${p.rentalPricePerDay},${p.depositAmount},${p.lateFeePerDay},${p.stockQty},${p.isActive ? 'Active' : 'Archived'}`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'products.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (p: Product) => {
    if (!p.isActive) return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800">⚫ Archived</span>;
    if (p.stockQty === 0) return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800">🔴 Out of Stock</span>;
    if (p.stockQty <= 3) return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800">🟡 Low Stock</span>;
    return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">🟢 Active</span>;
  };

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort(field)}>
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      </div>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Manage products, stock levels, and availability.</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new"><Plus className="mr-2 h-4 w-4" /> Add Product</Link>
        </Button>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2"><Boxes className="h-5 w-5 text-blue-700" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{kpis.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2"><Package className="h-5 w-5 text-green-700" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{kpis.activeProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-yellow-100 p-2"><AlertTriangle className="h-5 w-5 text-yellow-700" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold">{kpis.lowStockProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-100 p-2"><PackageX className="h-5 w-5 text-red-700" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold">{kpis.outOfStockProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-2"><Archive className="h-5 w-5 text-gray-700" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Archived</p>
                  <p className="text-2xl font-bold">{kpis.archivedProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters & Bulk Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU, or brand..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="flex h-10 items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                >
                  <option value="">All Categories</option>
                  {[...new Set([...CATEGORIES, ...categories])].sort().map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  className="flex h-10 items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 rounded-md bg-muted px-4 py-2">
                <span className="text-sm font-medium">{selectedIds.size} selected</span>
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleBulkArchive}>
                    <Archive className="mr-1 h-3 w-3" /> Archive
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleBulkRestore}>
                    <RefreshCcw className="mr-1 h-3 w-3" /> Restore
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="mr-1 h-3 w-3" /> Export CSV
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleSelectAll} className="flex items-center">
                      {selectedIds.size === products.length && products.length > 0
                        ? <CheckSquare className="h-4 w-4" />
                        : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  <SortHeader field="name">Name</SortHeader>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <SortHeader field="rentalPricePerDay">Price/Day</SortHeader>
                  <SortHeader field="stockQty">Stock</SortHeader>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Loading inventory...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No products found.</td></tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id} className={`hover:bg-muted/50 transition-colors ${!p.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(p.id)} className="flex items-center">
                          {selectedIds.has(p.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/products/${p.id}`} className="font-medium hover:text-primary transition-colors">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.category || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.sku || '—'}</td>
                      <td className="px-4 py-3 font-mono">₹{p.rentalPricePerDay}</td>
                      <td className="px-4 py-3 font-medium">{p.stockQty}</td>
                      <td className="px-4 py-3">{getStatusBadge(p)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild title="View Details">
                            <Link href={`/admin/products/${p.id}`}><Eye className="h-4 w-4" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild title="Edit Product">
                            <Link href={`/admin/products/${p.id}/edit`}><Edit className="h-4 w-4" /></Link>
                          </Button>
                          {p.isActive ? (
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleArchive(p.id)} title="Archive">
                              <Archive className="h-4 w-4" />
                            </Button>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10" onClick={() => handleRestore(p.id)} title="Restore">
                                <RefreshCcw className="h-4 w-4" />
                              </Button>
                              {p._count.orders === 0 && (
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handlePermanentDelete(p.id)} title="Permanently Delete">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">Page {pagination.page} of {pagination.totalPages}</span>
                <Button
                  variant="outline" size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
