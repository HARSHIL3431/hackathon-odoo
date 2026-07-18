'use client';

import { useState, useEffect } from 'react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    lateFeeDefault: 20,
    gracePeriodHours: 24,
  });

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setFormData({
            lateFeeDefault: data.lateFeeDefault,
            gracePeriodHours: data.gracePeriodHours,
          });
        }
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess('Settings saved successfully.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 shadow rounded-lg space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded">{error}</div>}
        {success && <div className="p-3 bg-green-50 text-green-700 text-sm rounded">{success}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700">Global Default Late Fee (per day)</label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={formData.lateFeeDefault}
              onChange={(e) => setFormData({ ...formData, lateFeeDefault: Number(e.target.value) })}
              className="flex-1 min-w-0 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300 p-2 border focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Applied to new products if not explicitly overridden.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Return Grace Period (Hours)</label>
          <input
            type="number"
            min="0"
            required
            value={formData.gracePeriodHours}
            onChange={(e) => setFormData({ ...formData, gracePeriodHours: Number(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
          <p className="mt-1 text-xs text-gray-500">Number of hours after the rental end time before late fees apply.</p>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
