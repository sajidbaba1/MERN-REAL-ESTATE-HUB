# Real Estate Backend - Node.js + MongoDB

## ✅ Current Status

### Successfully Created & Running
- ✅ **Server**: Running on `http://localhost:8889`
- ✅ **Database**: Connected to MongoDB Atlas
- ✅ **Authentication**: Login, Register, OTP Login endpoints working
- ✅ **Models**: User, Property models created
- ✅ **Middleware**: JWT authentication and role-based authorization
- ✅ **Socket.IO**: WebSocket server configured

### Files Created (10/50+)
1. ✅ `package.json` - Dependencies configured
2. ✅ `.env` - Environment variables
3. ✅ `src/server.js` - Main server file
4. ✅ `src/config/database.js` - MongoDB connection
5. ✅ `src/models/User.js` - User model
6. ✅ `src/models/Property.js` - Property model
7. ✅ `src/middleware/auth.js` - Authentication middleware
8. ✅ `src/utils/generateToken.js` - JWT utilities
9. ✅ `src/controllers/authController.js` - Auth controller
10. ✅ `src/routes/auth.routes.js` - Auth routes

## 🔧 To Complete 100% Implementation

You need to create the remaining **40+ files** to match the Spring Boot backend exactly.

### Priority 1: Core Models (Create these next)
```bash
src/models/
├── PropertyInquiry.js
├── RentBooking.js
├── PgBooking.js
├── PgRoom.js
├── PgBed.js
├── MonthlyPayment.js
├── BookingNotification.js
├── BookingReview.js
├── ChatMessage.js
├── Favorite.js
├── Lead.js
├── LeadTask.js
├── Location.js
├── Notification.js
├── OtpToken.js
├── Wallet.js
└── WalletTransaction.js
```

### Priority 2: Controllers
```bash
src/controllers/
├── propertyController.js
├── propertyInquiryController.js
├── bookingController.js
├── paymentController.js
├── walletController.js
├── notificationController.js
├── pgController.js
├── adminController.js
├── agentController.js
├── analyticsController.js
├── leadController.js
├── locationController.js
├── otpController.js
├── ragController.js
└── systemController.js
```

### Priority 3: Routes
```bash
src/routes/
├── property.routes.js
├── booking.routes.js
├── payment.routes.js
├── wallet.routes.js
├── notification.routes.js
├── pg.routes.js
├── admin.routes.js
├── agent.routes.js
├── analytics.routes.js
├── lead.routes.js
├── location.routes.js
├── otp.routes.js
├── rag.routes.js
└── system.routes.js
```

### Priority 4: Services
```bash
src/services/
├── otpService.js
├── mailService.js
├── analyticsService.js
├── ragService.js
├── favoriteService.js
├── lateFeeService.js
└── bookingNotificationService.js
```

## 🚀 Quick Start

### Start Node.js Backend
```bash
cd backend-nodejs
npm start
```

### Start Spring Boot Backend (for comparison)
```bash
cd ..
.\mvnw.cmd spring-boot:run
```

### Start Frontend
```bash
cd frontend
npm run dev
```

## 📝 API Endpoints Implemented

### ✅ Authentication (Working)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/login-otp` - Login with OTP
- `GET /api/auth/me` - Get current user (Protected)

### ⏳ To Be Implemented
See `IMPLEMENTATION_PLAN.md` for complete list of 100+ endpoints.

## 🔑 Environment Variables

```env
PORT=8889
NODE_ENV=development
MONGODB_URI=mongodb+srv://ss2727303_db_user:sajidsai@cluster0.orzlzd3.mongodb.net/realestate
JWT_SECRET=ThisIsADevelopmentOnlyJWTSecretKeyThatIsAtLeast32Chars
JWT_EXPIRATION=86400000
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

## 📊 Database Schema

### Collections Created
- ✅ `users` - User accounts
- ✅ `properties` - Property listings
- ⏳ 17 more collections to create

## 🧪 Testing

### Test Authentication
```bash
# Register
curl -X POST http://localhost:8889/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:8889/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 📚 Next Steps

1. **Create remaining models** - Use Spring Boot entities as reference
2. **Implement controllers** - Match Spring Boot controller logic
3. **Add routes** - Register all routes in server.js
4. **Test endpoints** - Ensure 100% compatibility with frontend
5. **Seed demo data** - Create demo users (admin, agent, user)
6. **Deploy** - Ready for production

## 🔄 Switching Between Backends

### Use Spring Boot Backend
```bash
# Frontend .env.local
VITE_API_BASE_URL=http://localhost:8888/api
```

### Use Node.js Backend
```bash
# Frontend .env.local
VITE_API_BASE_URL=http://localhost:8889/api
```

## 📖 Reference

- Spring Boot Backend: `src/main/java/com/realestate/`
- Node.js Backend: `backend-nodejs/src/`
- Implementation Plan: `IMPLEMENTATION_PLAN.md`

## ⚠️ Important Notes

1. **Port Conflict**: Node.js uses 8889, Spring Boot uses 8888
2. **Database**: Both can use same MongoDB (different from Spring Boot's MySQL)
3. **Authentication**: JWT tokens are compatible
4. **API Compatibility**: All endpoints must match exactly

## 🎯 Goal

Create a **100% functional replica** of the Spring Boot backend in Node.js + MongoDB, allowing seamless switching between backends with zero frontend changes.

---

**Status**: 🟡 **20% Complete** (10/50+ files created)
**Next**: Create remaining models and controllers
