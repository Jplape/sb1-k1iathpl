import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err instanceof Error && err.message === 'invalid_credentials'
          ? 'Email ou mot de passe incorrect'
          : 'La vérification de sécurité a échoué. Veuillez actualiser la page et réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          Connexion
        </h1>
        
        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error.includes('incorrect') ? (
              <>
                <p className="font-medium">Email ou mot de passe incorrect</p>
                <p className="mt-1">
                  Vérifiez l'orthographe de votre email (ex: hotmail.fr au lieu de hotmai.fr)
                </p>
                {email.includes('@hotmai.') && (
                  <button
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => setEmail(email.replace('@hotmai.', '@hotmail.'))}
                  >
                    Corriger automatiquement en @hotmail.fr
                  </button>
                )}
              </>
            ) : (
              <p>{error}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="jipelap@hotmail.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              placeholder="•••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            Se connecter
          </button>
        </form>

        <div className="text-center text-sm">
          <Link 
            to="/signup" 
            className="font-medium text-brand hover:text-brand-dark"
          >
            Pas de compte ? S'inscrire
          </Link>
        </div>
      </div>
    </div>
  );
}