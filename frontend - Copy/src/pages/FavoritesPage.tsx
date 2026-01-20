import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, Loader2, LogIn, Building } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authApi';
import { Property } from '../types/Property';
import PropertyCard from '../components/PropertyCard';
import { useNavigate } from 'react-router-dom';

const FavoritesPage: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchFavorites();
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, authLoading]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const data = await authService.getFavorites();
      setFavorites(data || []);
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
      // Fallback to local storage for guests if necessary
      if (!isAuthenticated) {
        const staticFavoriteIds = JSON.parse(localStorage.getItem('staticFavorites') || '[]');
        const allProperties = await import('../data/sampleProperties').then(m => m.sampleProperties);
        // Map sample IDs to strings if needed
        const favoriteProperties = allProperties.filter(p => staticFavoriteIds.includes(p.id)) as unknown as Property[];
        setFavorites(favoriteProperties);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (propertyId: string) => {
    try {
      setRemovingId(propertyId);

      if (isAuthenticated) {
        await authService.removeFromFavorites(propertyId);
      } else {
        const staticFavorites = JSON.parse(localStorage.getItem('staticFavorites') || '[]');
        const updatedFavorites = staticFavorites.filter((id: any) => String(id) !== propertyId);
        localStorage.setItem('staticFavorites', JSON.stringify(updatedFavorites));
      }

      // Update UI
      setFavorites(prev => prev.filter(property => property.id !== propertyId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    } finally {
      setRemovingId(null);
    }
  };

  const handlePropertyClick = (propertyId?: string) => {
    if (propertyId) {
      navigate(`/properties/${propertyId}`);
    }
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center bg-white p-10 rounded-2xl shadow-xl">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100">
            <Heart className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Your collection is empty</h2>
          <p className="mt-2 text-sm text-gray-600">
            Please login to see properties you've saved and access them from any device.
          </p>
          <div className="mt-8">
            <button
              onClick={() => navigate('/login')}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
              </span>
              Sign in to view favorites
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Don't have an account? <span onClick={() => navigate('/register')} className="text-blue-600 cursor-pointer hover:underline">Register now</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="w-6 h-6 text-red-600 fill-red-600" />
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Favorites</h1>
              </div>
              <p className="text-lg text-gray-600">
                {loading ? 'Fetching your curated list...' :
                  favorites.length === 0 ? 'You haven\'t saved any properties yet.' :
                    `You have ${favorites.length} saved ${favorites.length === 1 ? 'property' : 'properties'} waiting for you.`}
              </p>
            </div>
            {!loading && favorites.length > 0 && (
              <button
                onClick={() => navigate('/properties')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
              >
                Find more properties
              </button>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl shadow-sm h-96 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && favorites.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100"
            >
              <div className="max-w-md mx-auto">
                <div className="bg-red-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Heart className="w-12 h-12 text-red-200" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No properties saved yet</h3>
                <p className="text-gray-500 mb-10 leading-relaxed">
                  When you find a property you like, click the heart icon to save it here for later. We'll even notify you if the price drops!
                </p>
                <button
                  onClick={() => navigate('/properties')}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center mx-auto"
                >
                  Start Exploring
                </button>
              </div>
            </motion.div>
          )}

          {/* Favorites Grid */}
          {!loading && favorites.length > 0 && (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {favorites.map((property) => (
                  <motion.div
                    key={property.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    className="relative"
                  >
                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (property.id) handleRemoveFavorite(property.id);
                      }}
                      disabled={removingId === property.id}
                      className="absolute top-4 left-4 z-20 p-2.5 bg-white/90 backdrop-blur-sm text-red-600 rounded-full shadow-lg hover:bg-red-50 transition-all active:scale-90 border border-red-100 group"
                      title="Remove from favorites"
                    >
                      {removingId === property.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      )}
                    </button>

                    {/* Property Card */}
                    <div
                      className="cursor-pointer transition-transform duration-300 hover:-translate-y-1"
                      onClick={() => handlePropertyClick(property.id)}
                    >
                      <PropertyCard
                        property={property}
                        onClick={() => handlePropertyClick(property.id)}
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Market Trends / Footer Section */}
          {!loading && favorites.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-20 border-t border-gray-200 pt-10"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white shadow-2xl overflow-hidden relative">
                <div className="relative z-10 max-w-2xl">
                  <h3 className="text-3xl font-bold mb-4">Want to list your own property?</h3>
                  <p className="text-blue-100 text-lg mb-8">
                    Join thousands of homeowners who successfully sold or rented their properties through our platform.
                  </p>
                  <button
                    onClick={() => navigate('/add-property')}
                    className="px-8 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all active:scale-95 shadow-xl"
                  >
                    Get Started Today
                  </button>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                  <Building className="w-96 h-96" />
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default FavoritesPage;
