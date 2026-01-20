# Data Seeder - Demo Users & Properties

## Overview
This seeder populates the MongoDB database with demo users and sample properties, matching the data from the Spring Boot backend.

## Demo Users Created

All demo users have the password: **`Demo@12345`**

| Email | Role | Description |
|-------|------|-------------|
| `admin@demo.com` | ADMIN | Full system access, can manage all users and properties |
| `agent@demo.com` | AGENT | Property agent, can list properties and manage bookings |
| `user@demo.com` | USER | Regular user, can browse and book properties |

## Sample Data Created

### Locations (6)
- New York, NY
- Los Angeles, CA
- Chicago, IL
- Miami, FL
- Boston, MA
- Denver, CO

### Properties (6)
1. **Modern Downtown Apartment** - New York, NY - $450,000 (For Sale)
2. **Luxury Family Villa** - Los Angeles, CA - $1,250,000 (For Sale)
3. **Cozy Studio Apartment** - Chicago, IL - $3,500/month (For Rent)
4. **Waterfront Condo** - Miami, FL - $850,000 (For Sale)
5. **Historic Townhouse** - Boston, MA - $750,000 (For Sale)
6. **Mountain View Cabin** - Denver, CO - $2,200/month (For Rent)

All properties are owned by the `agent@demo.com` user and are pre-approved.

## Running the Seeder

### First Time Setup
```bash
cd backend-nodejs
npm run seed
```

### Re-running the Seeder
The seeder is idempotent - it will:
- Skip creating users if they already exist (by email)
- Skip creating locations if they already exist (by name)
- Skip creating properties if any properties exist in the database

### Clear Database and Re-seed
If you want to start fresh:

```bash
# Connect to MongoDB and drop the database
mongosh
use realestate
db.dropDatabase()
exit

# Run the seeder again
npm run seed
```

## Testing the Demo Users

### Login as Admin
```
Email: admin@demo.com
Password: Demo@12345
```

### Login as Agent
```
Email: agent@demo.com
Password: Demo@12345
```

### Login as Regular User
```
Email: user@demo.com
Password: Demo@12345
```

## Data Migration from Spring Boot

The seeder creates the exact same demo data as the Spring Boot backend:
- Same user credentials
- Same property listings
- Same locations
- All data structures match the MongoDB models

## Verification

After running the seeder, you can verify the data:

```bash
mongosh
use realestate

# Check users
db.users.find({}, {email: 1, role: 1, firstName: 1, lastName: 1})

# Check properties
db.properties.find({}, {title: 1, city: 1, price: 1, status: 1})

# Check locations
db.locations.find({}, {name: 1, description: 1})
```

## Notes

- All passwords are hashed using bcrypt before storage
- Properties are automatically approved (approved: true)
- Agent user is set as the owner of all sample properties
- Data matches the Spring Boot `DataInitializer.java` and `DataSeeder.java`
