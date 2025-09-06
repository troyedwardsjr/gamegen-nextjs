'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardBody, Input, Button, Link, Divider } from '@heroui/react';
import { EyeIcon, EyeOffIcon } from '../components/icons';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // TODO: Implement authentication logic here
    console.log(isLogin ? 'Login' : 'Sign Up', { email, password });
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home Link */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="text-purple-500 hover:text-purple-600 transition-colors flex items-center gap-2"
          >
            ← Back to Home
          </Link>
        </div>

        <Card className="glassmorphic-card backdrop-blur-lg bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10">
          <CardHeader className="flex flex-col space-y-4 pb-6">
            <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-center text-foreground/70">
              {isLogin 
                ? 'Sign in to your GameGen account' 
                : 'Join GameGen and start creating games'
              }
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                placeholder="Enter your email"
                type="email"
                value={email}
                onValueChange={setEmail}
                className="glassmorphic-input"
                variant="bordered"
                required
              />
              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onValueChange={setPassword}
                className="glassmorphic-input"
                variant="bordered"
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={toggleVisibility}
                  >
                    {isVisible ? (
                      <EyeOffIcon className="text-2xl text-default-400 pointer-events-none" />
                    ) : (
                      <EyeIcon className="text-2xl text-default-400 pointer-events-none" />
                    )}
                  </button>
                }
                type={isVisible ? 'text' : 'password'}
                required
              />
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
                isLoading={loading}
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
            
            <Divider className="my-4" />
            
            <div className="text-center">
              <p className="text-sm text-foreground/70">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                {' '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-purple-500 hover:text-purple-600 transition-colors font-medium"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
