import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Property, PropertyStatus } from '../types/Property';
import { MapPin, Bed, Bath, Square, Heart, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authApi';
import { formatPriceINR } from '../utils/currency';

interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick }) => {
  const { isAuthenticated, loading } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    // Check favorite status if user is authenticated
    if (isAuthenticated && !loading && property.id) {
      checkFavoriteStatus();
    } else if (property.id) {
      // For non-authenticated users, check localStorage
      const staticFavorites = JSON.parse(localStorage.getItem('staticFavorites') || '[]');
      setIsFavorited(staticFavorites.some((favId: any) => String(favId) === String(property.id)));
    }
  }, [property.id, isAuthenticated, loading]);

  const checkFavoriteStatus = async () => {
    if (!isAuthenticated || !property.id) return;

    try {
      const favorited = await authService.isFavorited(property.id);
      setIsFavorited(favorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      // Fallback to localStorage check but don't overwrite if it fails
    }
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!property.id) {
      console.error('Property ID is missing');
      return;
    }

    setIsToggling(true);

    try {
      if (isAuthenticated) {
        // Use backend API for authenticated users
        if (isFavorited) {
          await authService.removeFromFavorites(property.id);
          setIsFavorited(false);
        } else {
          await authService.addToFavorites(property.id);
          setIsFavorited(true);
        }
      } else {
        // Fallback to localStorage for non-authenticated users
        const staticFavorites = JSON.parse(localStorage.getItem('staticFavorites') || '[]');
        const stringId = String(property.id);

        if (isFavorited) {
          const updatedFavorites = staticFavorites.filter((id: any) => String(id) !== stringId);
          localStorage.setItem('staticFavorites', JSON.stringify(updatedFavorites));
          setIsFavorited(false);
        } else {
          const updatedFavorites = [...staticFavorites, stringId];
          localStorage.setItem('staticFavorites', JSON.stringify(updatedFavorites));
          setIsFavorited(true);
        }
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      // alert(error.response?.data?.message || 'Failed to update favorites. Please try again.');
      // Silently fail or use a toast instead of alert for better UX
    } finally {
      setIsToggling(false);
    }
  };

  const getStatusBadgeClass = (status: PropertyStatus) => {
    switch (status) {
      case PropertyStatus.FOR_SALE:
        return 'bg-green-100 text-green-700 border-green-200';
      case PropertyStatus.FOR_RENT:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case PropertyStatus.SOLD:
        return 'bg-red-100 text-red-700 border-red-200';
      case PropertyStatus.RENTED:
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getStatusText = (status: PropertyStatus) => {
    return status.replace('_', ' ');
  };

  const formatPrice = (price: number) => formatPriceINR(price);

  return (
    <motion.div
      layout
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full"
      onClick={onClick}
    >
      <div className="relative h-64 overflow-hidden">
        {/* Property Image */}
        {property.imageUrl ? (
          <img
            src={property.imageUrl}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
            <span className="text-white text-5xl font-bold opacity-20">{property.title.charAt(0)}</span>
          </div>
        )}

        {/* Overlay Gradients */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Status Badge */}
        <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${getStatusBadgeClass(property.status)}`}>
          {getStatusText(property.status)}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={handleFavoriteToggle}
          disabled={isToggling}
          className={`absolute top-4 left-4 p-2.5 rounded-full shadow-lg transition-all duration-300 backdrop-blur-md border ${isFavorited
            ? 'bg-red-500 text-white border-red-400 shadow-red-200'
            : 'bg-white/90 text-gray-600 border-white hover:bg-white hover:text-red-500 shadow-gray-200'
            } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-90'}`}
          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isToggling ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Heart className={`w-5 h-5 transition-colors ${isFavorited ? 'fill-current' : ''}`} />
          )}
        </button>

        {/* Property Type Badge (Overlay) */}
        <div className="absolute bottom-4 left-4 px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-white text-xs font-semibold border border-white/30">
          {property.propertyType}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {/* Price & Listing Type */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-gray-900 leading-none">
              {formatPrice(property.price)}
            </span>
            <span className="text-xs text-gray-500 font-medium uppercase mt-1">
              {property.listingType === 'RENT' ? 'Per Month' : 'Total Price'}
            </span>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-xl font-bold text-gray-800 mb-2 truncate group-hover:text-blue-600 transition-colors">
          {property.title}
        </h4>

        {/* Address */}
        <div className="flex items-center text-gray-500 mb-6 text-sm">
          <MapPin className="w-4 h-4 mr-1.5 text-blue-500" />
          <span className="truncate">{property.address}, {property.city}</span>
        </div>

        {/* Property Details Icons */}
        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-gray-50 pt-5">
          <div className="flex flex-col items-center p-2 rounded-xl bg-gray-50/50 group-hover:bg-blue-50/50 transition-colors">
            <div className="flex items-center mb-1">
              <Bed className="w-4 h-4 mr-1.5 text-blue-600" />
              <span className="font-bold text-gray-900">{property.bedrooms}</span>
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Beds</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-gray-50/50 group-hover:bg-blue-50/50 transition-colors">
            <div className="flex items-center mb-1">
              <Bath className="w-4 h-4 mr-1.5 text-blue-600" />
              <span className="font-bold text-gray-900">{property.bathrooms}</span>
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Baths</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-gray-50/50 group-hover:bg-blue-50/50 transition-colors">
            <div className="flex items-center mb-1">
              <Square className="w-4 h-4 mr-1.5 text-blue-600" />
              <span className="font-bold text-gray-900">{property.squareFeet.toLocaleString()}</span>
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">SqFt</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyCard;
