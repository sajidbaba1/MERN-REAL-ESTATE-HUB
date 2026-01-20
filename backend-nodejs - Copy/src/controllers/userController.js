import userService from '../services/userService.js';
import favoriteService from '../services/favoriteService.js';

class UserController {
    async getUserProfile(req, res) {
        try {
            const user = await userService.findById(req.user.id);
            res.json(user);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async updateUserProfile(req, res) {
        try {
            const user = await userService.updateUser(req.user.id, req.body);
            res.json(user);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async getUserFavorites(req, res) {
        try {
            const favorites = await favoriteService.getUserFavorites(req.user);
            res.json(favorites);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async addToFavorites(req, res) {
        try {
            await favoriteService.addToFavorites(req.user, req.params.propertyId);
            res.json({ message: 'Property added to favorites' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async removeFromFavorites(req, res) {
        try {
            await favoriteService.removeFromFavorites(req.user, req.params.propertyId);
            res.json({ message: 'Property removed from favorites' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async checkIfFavorite(req, res) {
        try {
            const isFavorite = await favoriteService.isPropertyFavorited(req.user, req.params.propertyId);
            res.json({ isFavorite });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async getUserStats(req, res) {
        try {
            const favoritesCount = await favoriteService.getFavoritesCount(req.user);
            res.json({
                favoritesCount,
                memberSince: req.user.createdAt
            });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}

export default new UserController();
