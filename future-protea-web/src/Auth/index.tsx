/**
 * @fileoverview Future Protea Admin Login
 * @module Auth
 *
 * @description
 * Simple email + password login for cricket admin.
 * Split-screen layout: form on left, cricket animation + logo on right.
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Lottie from 'lottie-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cricketAnimation, setCricketAnimation] = useState<any>(null);

  // Load cricket animation
  useEffect(() => {
    fetch('/lottie/cricket-bat-ball.json')
      .then(res => res.json())
      .then(data => setCricketAnimation(data))
      .catch(err => console.error('Failed to load animation:', err));
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !password.trim()) return;

      setIsLoading(true);
      const result = await login({ email: email.trim(), password: password.trim() });
      setIsLoading(false);

      if (result.success) {
        toast.success('Login successful!');
        // Navigation is handled by the isAuthenticated useEffect
      } else {
        toast.error(result.message || 'Invalid credentials');
      }
    },
    [email, password, login]
  );

  if (isAuthenticated) return null;

  return (
    <div className="flex min-h-screen">
      {/* Left side — Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="absolute top-6 left-6 z-50">
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          {/* Logo — visible on mobile (hidden on lg since it's on right) */}
          <motion.div
            className="mb-8 lg:hidden text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-3xl font-bold text-primary">Future Protea</div>
          </motion.div>

          <Card className="border-0 shadow-2xl shadow-primary/10 overflow-hidden">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <Shield className="h-5 w-5" />
                Admin Login
              </CardTitle>
              <CardDescription>Cricket Management System</CardDescription>
            </CardHeader>

            <CardContent>
              <motion.form
                onSubmit={handleLogin}
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@cricket.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold gap-2 group"
                  disabled={isLoading || !email.trim() || !password.trim()}
                >
                  {isLoading ? (
                    <motion.div
                      className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <>
                      Login
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </motion.form>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Right side — Lottie + Logo (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-primary/5 relative overflow-hidden rounded-tl-lg rounded-bl-lg">
        {/* Decorative gradient blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />

        <motion.div
          className="relative z-10 text-center px-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* Footprint stays h-28 so the Lottie / heading below don't move.
              The image is absolutely centered and scaled up so it visually
              zooms in height without affecting layout. */}
          <div className="relative h-28 mt-6 mb-10">
            <img
              src="/images/web_logo.png"
              alt="Future Protea"
              className="absolute inset-0 m-auto h-28 w-auto scale-[2.0] origin-center pointer-events-none"
            />
          </div>

          <div className="w-80 h-80 mx-auto">
            {cricketAnimation && <Lottie animationData={cricketAnimation} loop className="w-full h-full" />}
          </div>

          <h2 className="text-2xl font-bold mt-6">Cricket Admin Panel</h2>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            Manage matches, tournaments, teams, and players from one place.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
