import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { AdminGuard } from './components/guards/AdminGuard';
import { ProGuard } from './components/guards/ProGuard';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { CreateAd } from './pages/CreateAd';
import { Profile } from './pages/Profile';
import { AdDetail } from './pages/ads/AdDetail';
import { Checkout } from './pages/Checkout';
import { Messages } from './pages/Messages';
import { Reports } from './pages/admin/Reports';
import { Dashboard } from './pages/Dashboard';
import { ProDashboard } from './pages/pro/Dashboard';
import { KYC } from './pages/pro/KYC';
import { Subscription } from './pages/pro/Subscription';
import { AuthCallback } from './pages/auth/AuthCallback';
import { ResetPassword } from './pages/auth/ResetPassword';
import { Watchlist } from './pages/Watchlist';
import { TermsOfService } from './pages/legal/TermsOfService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleReCaptchaProvider
        reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        scriptProps={{
          async: true,
          defer: true,
          appendTo: 'head',
        }}
        container={{
          parameters: {
            badge: 'inline',
          },
        }}
      >
        <AuthProvider>
          <Router>
            <Layout>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/ads/:id" element={<AdDetail />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/terms" element={<TermsOfService />} />
                
                {/* Protected routes */}
                <Route path="/create-ad" element={<CreateAd />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/checkout/:id" element={<Checkout />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/messages/:conversationId" element={<Messages />} />
                <Route path="/watchlist" element={<Watchlist />} />

                {/* Pro routes */}
                <Route
                  path="/pro"
                  element={
                    <ProGuard>
                      <ProDashboard />
                    </ProGuard>
                  }
                />
                <Route path="/pro/kyc" element={<KYC />} />
                <Route path="/pro/subscription" element={<Subscription />} />

                {/* Admin routes */}
                <Route
                  path="/admin/reports"
                  element={
                    <AdminGuard>
                      <Reports />
                    </AdminGuard>
                  }
                />
              </Routes>
            </Layout>
          </Router>
          <Toaster position="top-right" />
        </AuthProvider>
      </GoogleReCaptchaProvider>
    </QueryClientProvider>
  );
}

export default App;