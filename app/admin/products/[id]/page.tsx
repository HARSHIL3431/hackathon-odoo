'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ArrowLeft, Edit, Archive, RefreshCcw, Trash2, Loader2,
  Package, PackageX, DollarSign, CalendarDays, BarChart3,
  Plus, Minus, Replace,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

type ProductDetail = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  sku: string | null;
  brand: string | null;
  image: string | null;
  isActive: boolean;
  rentalPricePerDay: number;
  depositAmount: number;
  lateFeePerDay: number;
  stockQty: number;
  reservedStock: number;
  availableStock: number;
  rentalCount: number;
  createdAt: string;
  updatedAt: string;
};

const ADJUSTMENT_REASONS = [
  'Purchased Equipment',
  'Maintenance',
  'Lost',
  'Damaged',
  'Manual Correction',
  'Returned from Repair',
  'Inventory Count',
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Stock adjustment state
  const [adjustAction, setAdjustAction] = useState<'increase' | 'decrease' | 'set'>('increase');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`);
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setProduct(await res.json());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const handleArchive = async () => {
    if (!confirm('Archive this product? It will be hidden from the customer catalog.')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success('Product archived');
      fetchProduct();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleRestore = async () => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success('Product restored');
      fetchProduct();
    } catch (err: any) { toast.error(err.message); }
  };

  const handlePermanentDelete = async () => {
    if (!confirm('Permanently delete this product? This CANNOT be undone.')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}?permanent=true`, { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(d.message);
      router.push('/admin/products');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(adjustAmount);
    if (isNaN(amt) || amt < 0) {
      toast.error('Amount must be a non-negative integer.');
      return;
    }
    setAdjusting(true);
    try {
      const res = await fetch(`/api/admin/products/${id}/stock`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: adjustAction, amount: amt, reason: adjustReason }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(d.message);
      setAdjustAmount('');
      setAdjustReason('');
      fetchProduct();
    } catch (err: any) { toast.error(err.message); }
    finally { setAdjusting(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <PackageX className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Product Not Found</h2>
        <Button asChild className="mt-4"><Link href="/admin/products">Back to Inventory</Link></Button>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!product.isActive)
      return <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold bg-gray-100 text-gray-800">⚫ Archived</span>;
    if (product.availableStock === 0)
      return <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold bg-red-100 text-red-800">🔴 Out of Stock</span>;
    if (product.availableStock <= 3)
      return <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold bg-yellow-100 text-yellow-800">🟡 Low Stock</span>;
    return <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold bg-green-100 text-green-800">🟢 Active</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/products"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
              {getStatusBadge()}
            </div>
            <p className="text-muted-foreground mt-1">
              {product.sku && <span className="font-mono text-xs mr-3">SKU: {product.sku}</span>}
              {product.brand && <span className="mr-3">Brand: {product.brand}</span>}
              {product.category && <span>Category: {product.category}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/products/${id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
          </Button>
          {product.isActive ? (
            <Button variant="outline" className="text-destructive" onClick={handleArchive}>
              <Archive className="mr-2 h-4 w-4" /> Archive
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleRestore}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Restore
              </Button>
              {product.rentalCount === 0 && (
                <Button variant="destructive" onClick={handlePermanentDelete}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Inventory KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2"><Package className="h-5 w-5 text-blue-700" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Current Stock</p>
                <p className="text-2xl font-bold">{product.stockQty}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2"><CalendarDays className="h-5 w-5 text-orange-700" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Reserved</p>
                <p className="text-2xl font-bold">{product.reservedStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2"><Package className="h-5 w-5 text-green-700" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{product.availableStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2"><BarChart3 className="h-5 w-5 text-purple-700" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Rentals</p>
                <p className="text-2xl font-bold">{product.rentalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Name</dt><dd className="font-medium text-right">{product.name}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Category</dt><dd className="font-medium text-right">{product.category || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">SKU</dt><dd className="font-mono text-right">{product.sku || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Brand</dt><dd className="font-medium text-right">{product.brand || '—'}</dd></div>
              {product.description && (
                <div className="pt-2 border-t">
                  <dt className="text-muted-foreground mb-1">Description</dt>
                  <dd className="text-foreground whitespace-pre-wrap">{product.description}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Rental Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Rental Price / Day</dt><dd className="font-bold text-lg">₹{product.rentalPricePerDay}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Refundable Deposit</dt><dd className="font-medium">₹{product.depositAmount}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Late Fee / Day</dt><dd className="font-medium text-destructive">₹{product.lateFeePerDay}</dd></div>
              <div className="flex justify-between pt-2 border-t"><dt className="text-muted-foreground">Created</dt><dd className="text-right">{new Date(product.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Last Updated</dt><dd className="text-right">{new Date(product.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</dd></div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Stock Adjustment */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Adjustment</CardTitle>
          <CardDescription>Adjust stock levels for this product. Current stock: <strong>{product.stockQty}</strong></CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStockAdjustment} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Action</label>
                <div className="flex gap-1">
                  <Button
                    type="button" size="sm"
                    variant={adjustAction === 'increase' ? 'default' : 'outline'}
                    onClick={() => setAdjustAction('increase')}
                    className="flex-1"
                  >
                    <Plus className="mr-1 h-3 w-3" /> Increase
                  </Button>
                  <Button
                    type="button" size="sm"
                    variant={adjustAction === 'decrease' ? 'default' : 'outline'}
                    onClick={() => setAdjustAction('decrease')}
                    className="flex-1"
                  >
                    <Minus className="mr-1 h-3 w-3" /> Decrease
                  </Button>
                  <Button
                    type="button" size="sm"
                    variant={adjustAction === 'set' ? 'default' : 'outline'}
                    onClick={() => setAdjustAction('set')}
                    className="flex-1"
                  >
                    <Replace className="mr-1 h-3 w-3" /> Set
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number" min="0" placeholder="0"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason (optional)</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select reason...</option>
                  {ADJUSTMENT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <Button type="submit" disabled={adjusting}>
              {adjusting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Apply Adjustment
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Cannot permanently delete notice */}
      {!product.isActive && product.rentalCount > 0 && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
          <strong>Note:</strong> This product has {product.rentalCount} rental record(s) and cannot be permanently deleted. It can remain archived.
        </div>
      )}
    </div>
  );
}
