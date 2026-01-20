import Favorite from '../models/Favorite.js';
import Property from '../models/Property.js';

class FavoriteService {
    async getUserFavorites(user) {
        const favorites = await Favorite.find({ user: user._id }).populate('property');
        return favorites.map(f => f.property).filter(p => p !== null);
    }

    async addToFavorites(user, propertyId) {
        const property = await Property.findById(propertyId);
        if (!property) throw new Error('Property not found');

        const exists = await Favorite.findOne({ user: user._id, property: propertyId });
        if (exists) throw new Error('Property is already in favorites');

        const favorite = new Favorite({ user: user._id, property: propertyId });
        return await favorite.save();
    }

    async removeFromFavorites(user, propertyId) {
        await Favorite.deleteOne({ user: user._id, property: propertyId });
    }

    async isPropertyFavorited(user, propertyId) {
        const count = await Favorite.countDocuments({ user: user._id, property: propertyId });
        return count > 0;
    }

    async getFavoritesCount(user) {
        return await Favorite.countDocuments({ user: user._id });
    }
}

export default new FavoriteService();
