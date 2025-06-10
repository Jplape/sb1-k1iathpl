import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  User,
  LogIn,
  Home,
  ListFilter,
  FileText,
  Gauge,
  Heart,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  FileQuestion,
  HelpCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Moon,
  Sun,
  CreditCard,
  Upload,
} from 'lucide-react';
import { Button } from './ui/Button';
import { AuthModal } from './auth/AuthModal';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

interface NavGroup {
  title: string;
  links: {
    label: string;
    href: string;
    icon: React.ReactNode;
    hide?: boolean;
    showWhen?: (path: string) => boolean;
  }[];
}

const navigation: NavGroup[] = [
  {
    title: 'Navigation publique',
    links: [
      { label: 'Accueil', href: '/', icon: <Home className="w-5 h-5" /> },
      { label: 'Liste annonces', href: '/search', icon: <ListFilter className="w-5 h-5" /> },
      {
        label: "Détail d'annonce",
        href: '/product/:id',
        icon: <FileText className="w-5 h-5" />,
        hide: true,
        showWhen: (path) => path.startsWith('/product/') || path.startsWith('/ads/'),
      },
    ],
  },
  {
    title: 'Vendeur',
    links: [
      { label: 'Tableau de bord', href: '/dashboard', icon: <Gauge className="w-5 h-5" /> },
      { label: 'Nouvelle annonce', href: '/create-ad', icon: <PlusCircle className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Acheteur',
    links: [
      { label: 'Favoris', href: '/favorites', icon: <Heart className="w-5 h-5" /> },
      { label: 'Messages', href: '/messages', icon: <MessageSquare className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Professionnel',
    links: [
      { label: 'Dashboard Pro', href: '/pro', icon: <BarChart3 className="w-5 h-5" /> },
      { label: 'Vérification KYC', href: '/pro/kyc', icon: <Upload className="w-5 h-5" /> },
      { label: 'Abonnement Pro', href: '/pro/subscription', icon: <CreditCard className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Administration',
    links: [
      { label: 'Admin panel', href: '/admin', icon: <ShieldCheck className="w-5 h-5" /> },
      { label: 'Modération', href: '/admin/reports', icon: <AlertTriangle className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Divers',
    links: [
      { label: 'FAQ', href: '/faq', icon: <FileQuestion className="w-5 h-5" /> },
      { label: 'Aide', href: '/help', icon: <HelpCircle className="w-5 h-5" /> },
      { label: 'Contact', href: '/contact', icon: <Mail className="w-5 h-5" /> },
    ],
  },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['Navigation publique', 'Vendeur']);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const { user, signOut } = useAuth();
  const location = useLocation();

  const toggleSection = (title: string) => {
    setOpenSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const toggleDark = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  };

  const handleAuthClick = () => {
    if (user) {
      signOut();
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-20 bg-white/70 dark:bg-gray-900/70 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Link to="/" className="flex items-center ml-2 sm:ml-0">
                <span className="text-xl font-bold text-brand">Marketplace</span>
              </Link>
            </div>

            <div className="hidden sm:flex flex-1 max-w-sm mx-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:ring-2 focus:ring-brand/50 focus:border-brand"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDark}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <Link to="/profile">
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </Link>

              <Button variant="secondary" size="sm" onClick={handleAuthClick}>
                <LogIn className="w-4 h-4 mr-2" />
                {user ? 'Déconnexion' : 'Connexion'}
              </Button>
            </div>
          </div>
        </nav>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out sm:relative sm:translate-x-0",
            !sidebarOpen && "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 sm:hidden">
              <span className="font-semibold">Menu</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {navigation.map((group) => (
                <div key={group.title}>
                  <button
                    onClick={() => toggleSection(group.title)}
                    className="w-full flex justify-between items-center mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400"
                  >
                    <span>{group.title}</span>
                    {openSections.includes(group.title) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {openSections.includes(group.title) && (
                    <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                      {group.links.map((link) => {
                        if (link.hide && (!link.showWhen || !link.showWhen(location.pathname))) {
                          return null;
                        }
                        return (
                          <li key={link.label}>
                            <Link
                              to={link.href}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                                location.pathname === link.href
                                  ? "bg-brand/10 text-brand"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
                              )}
                              onClick={() => setSidebarOpen(false)}
                            >
                              {link.icon}
                              <span>{link.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 text-xs text-gray-400 border-t border-gray-200 dark:border-gray-700">
              © 2025 Marketplace
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 sm:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}