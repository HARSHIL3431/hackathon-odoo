'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'VENDOR'>('CUSTOMER');
  
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (nameError && val !== '') {
      setNameError('');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (emailError) {
      if (val === '') setEmailError('Email is required.');
      else if (EMAIL_REGEX.test(val)) setEmailError('');
      else setEmailError('Please enter a valid email address.');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (passwordError) {
      if (val === '') setPasswordError('Password is required.');
      else if (val.length < 6) setPasswordError('Password must be at least 6 characters.');
      else setPasswordError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    let firstInvalid: 'name' | 'email' | 'password' | null = null;

    if (!name) {
      setNameError('Name is required.');
      valid = false;
      if (!firstInvalid) firstInvalid = 'name';
    }

    if (!email) {
      setEmailError('Email is required.');
      valid = false;
      if (!firstInvalid) firstInvalid = 'email';
    } else if (!EMAIL_REGEX.test(email)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
      if (!firstInvalid) firstInvalid = 'email';
    }

    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
      if (!firstInvalid) firstInvalid = 'password';
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      valid = false;
      if (!firstInvalid) firstInvalid = 'password';
    }

    if (!valid) {
      if (firstInvalid === 'name') nameRef.current?.focus();
      else if (firstInvalid === 'email') emailRef.current?.focus();
      else if (firstInvalid === 'password') passwordRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.error?.toLowerCase().includes('email')) {
          setEmailError(data.error);
          emailRef.current?.focus();
        } else {
          toast.error(data.error || 'Registration failed');
        }
        return;
      }

      toast.success('Registration successful!', { id: 'register-success' });
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setEmailError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gradient-to-br from-background via-muted/30 to-secondary/20 p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <Card className="w-full max-w-md z-10 animate-scale-in border-muted/50 shadow-xl">
        <CardHeader className="space-y-1 pb-6 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Create an account</CardTitle>
          <CardDescription className="text-base">
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Name</label>
              <input
                ref={nameRef}
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={handleNameChange}
                onBlur={() => {
                  if (!name) setNameError('Name is required.');
                }}
                aria-invalid={!!nameError}
                aria-describedby={nameError ? 'name-error' : undefined}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${
                  nameError ? 'border-destructive focus-visible:ring-destructive/50' : 'border-input'
                }`}
                placeholder="John Doe"
              />
              {nameError && (
                <p id="name-error" className="text-sm font-medium text-destructive animate-fade-in" role="alert">
                  {nameError}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
              <input
                ref={emailRef}
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => {
                  if (!email) setEmailError('Email is required.');
                  else if (!EMAIL_REGEX.test(email)) setEmailError('Please enter a valid email address.');
                }}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${
                  emailError ? 'border-destructive focus-visible:ring-destructive/50' : 'border-input'
                }`}
                placeholder="m@example.com"
              />
              {emailError && (
                <p id="email-error" className="text-sm font-medium text-destructive animate-fade-in" role="alert">
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => {
                    if (!password) setPasswordError('Password is required.');
                    else if (password.length < 6) setPasswordError('Password must be at least 6 characters.');
                  }}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10 transition-colors ${
                    passwordError ? 'border-destructive focus-visible:ring-destructive/50' : 'border-input'
                  }`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-primary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="text-sm font-medium text-destructive animate-fade-in" role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">I am a</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'CUSTOMER' | 'VENDOR')}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="CUSTOMER">Customer (Rent equipment)</option>
                <option value="VENDOR">Vendor (List equipment)</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-6"
              size="lg"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col border-t bg-muted/10 px-6 py-4">
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
