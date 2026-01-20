# Node.js + MongoDB Backend Implementation Plan
## 100% Compatible with Spring Boot Backend

### Project Structure
```
backend-nodejs/
├── src/
│   ├── config/
│   │   ├── database.js          ✅ CREATED
│   │   ├── jwt.js
│   │   └── cors.js
│   ├── models/
│   │   ├── User.js               ✅ CREATED
│   │   ├── Property.js
│   │   ├── PropertyInquiry.js
│   │   ├── Booking.js
│   │   ├── RentBooking.js
│   │   ├── PgBooking.js
│   │   ├── PgRoom.js
│   │   ├── PgBed.js
│   │   ├── MonthlyPayment.js
│   │   ├── BookingNotification.js
│   │   ├── BookingReview.js
│   │   ├── ChatMessage.js
│   │   ├── Favorite.js
│   │   ├── Lead.js
│   │   ├── LeadTask.js
│   │   ├── Location.js
│   │   ├── Notification.js
│   │   ├── OtpToken.js
│   │   ├── Wallet.js
│   │   └── WalletTransaction.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── propertyController.js
│   │   ├── propertyInquiryController.js
│   │   ├── bookingController.js
│   │   ├── bookingManagementController.js
│   │   ├── bookingNotificationController.js
│   │   ├── bookingReviewController.js
│   │   ├── bookingAnalyticsController.js
│   │   ├── chatController.js
│   │   ├── favoriteController.js
│   │   ├── leadController.js
│   │   ├── locationController.js
│   │   ├── notificationController.js
│   │   ├── otpController.js
│   │   ├── paymentController.js
│   │   ├── pgController.js
│   │   ├── walletController.js
│   │   ├── adminController.js
│   │   ├── agentController.js
│   │   ├── analyticsController.js
│   │   ├── analyticsExportController.js
│   │   ├── ragController.js
│   │   └── systemController.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── otpService.js
│   │   ├── mailService.js
│   │   ├── analyticsService.js
│   │   ├── reportService.js
│   │   ├── ragService.js
│   │   ├── favoriteService.js
│   │   ├── lateFeeService.js
│   │   └── bookingNotificationService.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── validator.js
│   │   └── roleCheck.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── property.routes.js
│   │   ├── booking.routes.js
│   │   ├── payment.routes.js
│   │   ├── admin.routes.js
│   │   ├── agent.routes.js
│   │   ├── analytics.routes.js
│   │   ├── notification.routes.js
│   │   ├── chat.routes.js
│   │   ├── wallet.routes.js
│   │   ├── pg.routes.js
│   │   ├── lead.routes.js
│   │   ├── location.routes.js
│   │   ├── otp.routes.js
│   │   ├── rag.routes.js
│   │   └── system.routes.js
│   ├── utils/
│   │   ├── generateToken.js
│   │   ├── validators.js
│   │   └── helpers.js
│   ├── socket/
│   │   └── chatSocket.js
│   └── server.js
├── .env                          ✅ CREATED
├── .gitignore
├── package.json                  ✅ CREATED
└── README.md
```

### API Endpoints to Implement (Matching Spring Boot)

#### Authentication & User Management
- POST   /api/auth/register
- POST   /api/auth/login
- POST   /api/auth/login-otp
- GET    /api/auth/me
- POST   /api/otp/send
- POST   /api/otp/verify
- GET    /api/users/profile
- PUT    /api/users/profile
- GET    /api/users (ADMIN)
- GET    /api/users/:id (ADMIN)
- PUT    /api/users/:id (ADMIN)
- DELETE /api/users/:id (ADMIN)

#### Property Management
- GET    /api/properties
- GET    /api/properties/approved
- GET    /api/properties/public/approved
- GET    /api/properties/:id
- POST   /api/properties (AGENT/ADMIN)
- PUT    /api/properties/:id (AGENT/ADMIN)
- DELETE /api/properties/:id (AGENT/ADMIN)
- PATCH  /api/properties/:id/approve (ADMIN)
- PATCH  /api/properties/:id/reject (ADMIN)
- GET    /api/properties/search
- GET    /api/properties/count/total
- GET    /api/properties/count/approved

#### Property Inquiries
- POST   /api/inquiries
- GET    /api/inquiries
- GET    /api/inquiries/:id
- PUT    /api/inquiries/:id
- DELETE /api/inquiries/:id
- PATCH  /api/inquiries/:id/status

#### Bookings
- POST   /api/bookings
- GET    /api/bookings
- GET    /api/bookings/:id
- PUT    /api/bookings/:id
- DELETE /api/bookings/:id
- GET    /api/bookings/user/:userId
- GET    /api/bookings/property/:propertyId
- PATCH  /api/bookings/:id/status
- POST   /api/bookings/:id/payments
- GET    /api/bookings/:id/payments

#### PG Management
- GET    /api/pg/properties
- GET    /api/pg/properties/:id
- POST   /api/pg/properties
- PUT    /api/pg/properties/:id
- GET    /api/pg/rooms/:propertyId
- POST   /api/pg/rooms
- GET    /api/pg/beds/:roomId
- POST   /api/pg/beds
- POST   /api/pg/bookings
- GET    /api/pg/bookings/:id

#### Payments & Wallet
- POST   /api/payments/create-order
- POST   /api/payments/verify
- GET    /api/wallet
- POST   /api/wallet/add-money
- POST   /api/wallet/withdraw
- GET    /api/wallet/transactions

#### Notifications
- GET    /api/notifications
- GET    /api/notifications/unread-count
- PATCH  /api/notifications/:id/read
- PATCH  /api/notifications/mark-all-read
- DELETE /api/notifications/:id

#### Analytics
- GET    /api/analytics/dashboard
- GET    /api/analytics/properties
- GET    /api/analytics/bookings
- GET    /api/analytics/revenue
- GET    /api/analytics/users
- GET    /api/analytics/export/business-data

#### Admin Functions
- GET    /api/admin/users
- GET    /api/admin/properties
- GET    /api/admin/bookings
- GET    /api/admin/stats
- POST   /api/admin/seed-demo-users

#### Agent Functions
- GET    /api/agent/properties
- GET    /api/agent/inquiries
- GET    /api/agent/stats

#### Leads
- POST   /api/leads
- GET    /api/leads
- GET    /api/leads/:id
- PUT    /api/leads/:id
- DELETE /api/leads/:id
- POST   /api/leads/:id/tasks
- GET    /api/leads/:id/tasks

#### Locations
- GET    /api/locations
- POST   /api/locations
- GET    /api/locations/:id
- PUT    /api/locations/:id
- DELETE /api/locations/:id

#### RAG (AI)
- POST   /api/rag/ingest
- POST   /api/rag/query

#### WebSocket
- /ws (Socket.IO for real-time chat)

### Database Models (19 total)
All models will match the Spring Boot JPA entities exactly.

### Next Steps
1. Create all Mongoose models
2. Implement authentication middleware
3. Create all controllers
4. Set up all routes
5. Implement services
6. Configure WebSocket
7. Add error handling
8. Test all endpoints
9. Seed demo data

### MongoDB Collections
- users
- properties
- propertyinquiries
- rentbookings
- pgbookings
- pgrooms
- pgbeds
- monthlypayments
- bookingnotifications
- bookingreviews
- chatmessages
- favorites
- leads
- leadtasks
- locations
- notifications
- otptokens
- wallets
- wallettransactions
