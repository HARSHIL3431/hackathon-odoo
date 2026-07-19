'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    sku: '',
    brand: '',
    rentalPricePerDay: '',
    depositAmount: '',
    lateFeePerDay: '',
    stockQty: '',
    image: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/products/${id}`);
      if (!res.ok) throw new Error('Product not found');
      const data = await res.json();
      setForm({
        name: data.name || '',
        description: data.description || '',
        category: data.category || '',
        sku: data.sku || '',
        brand: data.brand || '',
        rentalPricePerDay: String(data.rentalPricePerDay),
        depositAmount: String(data.depositAmount),
        lateFeePerDay: String(data.lateFeePerDay),
        stockQty: String(data.stockQty),
        image: data.image || '',
        isActive: data.isActive,
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Product name is required.';
    if (!form.category) e.category = 'Category is required.';
    if (!form.rentalPricePerDay || parseFloat(form.rentalPricePerDay) <= 0) e.rentalPricePerDay = 'Must be positive.';
    if (!form.depositAmount || parseFloat(form.depositAmount) < 0) e.depositAmount = 'Must be non-negative.';
    if (!form.lateFeePerDay || parseFloat(form.lateFeePerDay) < 0) e.lateFeePerDay = 'Must be non-negative.';
    if (form.stockQty === '' || parseInt(form.stockQty) < 0) e.stockQty = 'Must be non-negative.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Product updated successfully!');
      router.push(`/admin/products/${id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const Field = ({ label, field, type = 'text', required = false, placeholder = '', prefix = '' }: {
    label: string; field: string; type?: string; required?: boolean; placeholder?: string; prefix?: string;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{prefix}</span>}
        <Input
          type={type}
          placeholder={placeholder}
          value={(form as any)[field]}
          onChange={(e) => updateField(field, e.target.value)}
          className={`${prefix ? 'pl-7' : ''} ${errors[field] ? 'border-destructive' : ''}`}
          min={type === 'number' ? '0' : undefined}
          step={type === 'number' ? 'any' : undefined}
        />
      </div>
      {errors[field] && <p className="text-xs text-destructive">{errors[field]}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/products/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground mt-1">Update product details for <strong>{form.name}</strong>.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Basic details about the equipment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Product Name" field="name" required placeholder="e.g. DeWalt 20V MAX Drill" />
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Description</label>
              <textarea
                rows={3}
                placeholder="Detailed description..."
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Category <span className="text-destructive">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${errors.category ? 'border-destructive' : 'border-input'}`}
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  {form.category && !CATEGORIES.includes(form.category) && (
                    <option value={form.category}>{form.category}</option>
                  )}
                </select>
                {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
              </div>
              <Field label="SKU" field="sku" placeholder="e.g. DW-20V-001" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Brand" field="brand" placeholder="e.g. DeWalt" />
              <Field label="Image URL" field="image" placeholder="https://..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rental Pricing</CardTitle>
            <CardDescription>Set pricing, deposit, and fees.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Rental Price / Day" field="rentalPricePerDay" type="number" required prefix="₹" placeholder="0.00" />
              <Field label="Refundable Deposit" field="depositAmount" type="number" required prefix="₹" placeholder="0.00" />
              <Field label="Late Fee / Day" field="lateFeePerDay" type="number" required prefix="₹" placeholder="0.00" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>Stock quantity and product status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Stock Quantity" field="stockQty" type="number" required placeholder="0" />
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Status</label>
                <select
                  value={form.isActive ? 'active' : 'archived'}
                  onChange={(e) => updateField('isActive', e.target.value === 'active')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <Link href={`/admin/products/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
