import User from '../models/User.js';
import Property from '../models/Property.js';
import Location from '../models/Location.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Create demo users
        await seedUsers();

        // Create locations
        await seedLocations();

        // Create properties
        await seedProperties();

        console.log('✅ All data seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

const seedUsers = async () => {
    const users = [
        {
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@demo.com',
            password: 'Demo@12345',
            role: 'ADMIN',
            enabled: true
        },
        {
            firstName: 'Agent',
            lastName: 'User',
            email: 'agent@demo.com',
            password: 'Demo@12345',
            role: 'AGENT',
            enabled: true
        },
        {
            firstName: 'Client',
            lastName: 'User',
            email: 'user@demo.com',
            password: 'Demo@12345',
            role: 'USER',
            enabled: true
        }
    ];

    for (const userData of users) {
        // Remove existing user to ensure fresh data (fixes double hashing issue from previous run)
        await User.deleteOne({ email: userData.email });

        // Create new user (password will be hashed by User model pre-save hook)
        const user = new User(userData);
        await user.save();
        console.log(`✓ Created user: ${userData.email}`);
    }
};

const seedLocations = async () => {
    const locations = [
        { name: 'New York', description: 'The Big Apple - bustling metropolis with endless opportunities' },
        { name: 'Los Angeles', description: 'City of Angels - entertainment capital with beautiful weather' },
        { name: 'Chicago', description: 'The Windy City - architectural marvel on Lake Michigan' },
        { name: 'Miami', description: 'Magic City - tropical paradise with vibrant culture' },
        { name: 'Boston', description: 'Historic city with rich culture and excellent education' },
        { name: 'Denver', description: 'Mile High City - gateway to the Rocky Mountains' }
    ];

    for (const locationData of locations) {
        const existingLocation = await Location.findOne({ name: locationData.name });
        if (!existingLocation) {
            const location = new Location(locationData);
            await location.save();
            console.log(`✓ Created location: ${locationData.name}`);
        } else {
            console.log(`- Location already exists: ${locationData.name}`);
        }
    }
};

const seedProperties = async () => {
    // Determine owners
    const agent = await User.findOne({ email: 'agent@demo.com' });
    const admin = await User.findOne({ email: 'admin@demo.com' });

    // Clear existing properties (optional, if you want a fresh start every time)
    await Property.deleteMany({});
    console.log('Cleared existing properties');

    const agentId = agent ? agent._id : null;
    const adminId = admin ? admin._id : null;

    const properties = [
        // New York
        {
            title: 'Modern Downtown Apartment',
            description: 'Beautiful modern apartment in the heart of downtown with stunning city views. Features include hardwood floors, granite countertops, and in-unit laundry.',
            price: 450000,
            address: '123 Main Street',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            bedrooms: 2,
            bathrooms: 2,
            squareFeet: 1200,
            propertyType: 'APARTMENT',
            status: 'FOR_SALE',
            imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00',
            listingType: 'SALE',
            priceType: 'ONE_TIME',
            owner: agentId,
            approvalStatus: 'APPROVED'
        },
        {
            title: 'Luxury Penthouse Suite',
            description: 'Exclusive penthouse with panoramic skyline views. Private elevator access, rooftop terrace, and state-of-the-art smart home features.',
            price: 2500000,
            address: '500 5th Avenue',
            city: 'New York',
            state: 'NY',
            zipCode: '10018',
            bedrooms: 3,
            bathrooms: 3.5,
            squareFeet: 2800,
            propertyType: 'APARTMENT',
            status: 'FOR_SALE',
            imageUrl: 'https://images.unsplash.com/photo-1512918760383-5658ccb4e615',
            listingType: 'SALE',
            priceType: 'ONE_TIME',
            owner: adminId,
            approvalStatus: 'APPROVED'
        },
        {
            title: 'Chic SoHo Loft',
            description: 'Authentic artist loft in the heart of SoHo. High ceilings, exposed brick, and massive windows. Perfect for creative professionals.',
            price: 6500,
            address: '88 Spring St',
            city: 'New York',
            state: 'NY',
            zipCode: '10012',
            bedrooms: 1,
            bathrooms: 1.5,
            squareFeet: 1500,
            propertyType: 'APARTMENT',
            status: 'FOR_RENT',
            imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
            listingType: 'RENT',
            priceType: 'MONTHLY',
            owner: agentId,
            approvalStatus: 'APPROVED'
        },

        // Los Angeles
        {
            title: 'Luxury Family Villa',
            description: 'Spacious 4-bedroom villa with private pool and garden. Located in a quiet neighborhood with excellent schools nearby. Features include a gourmet kitchen, home theater, and 3-car garage.',
            price: 1250000,
            address: '456 Oak Avenue',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210',
            bedrooms: 4,
            bathrooms: 3,
            squareFeet: 3500,
            propertyType: 'VILLA',
            status: 'FOR_SALE',
            imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
            listingType: 'SALE',
            priceType: 'ONE_TIME',
            owner: agentId,
            approvalStatus: 'APPROVED'
        },
        {
            title: 'Modern Hollywood Hills Home',
            description: 'Contemporary masterpiece with sweeping city views. Open concept living, infinity pool, and expansive deck for entertaining.',
            price: 3200000,
            address: '1500 Blue Jay Way',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90069',
            bedrooms: 3,
            bathrooms: 4,
            squareFeet: 3200,
            propertyType: 'HOUSE',
            status: 'FOR_SALE',
            imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
            listingType: 'SALE',
            priceType: 'ONE_TIME',
            owner: adminId,
            approvalStatus: 'APPROVED'
        },
        {
            title: 'Beachfront Condo in Santa Monica',
            description: 'Direct beach access and ocean views. Steps from the pier and downtown Santa Monica. Secure building with concierge.',
            price: 5500,
            address: '101 Ocean Ave',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90401',
            bedrooms: 2,
            bathrooms: 2,
            squareFeet: 1100,
            propertyType: 'CONDO',
            status: 'FOR_RENT',
            imageUrl: 'https://images.unsplash.com/photo-1574362848149-11496d97a7bc',
            listingType: 'RENT',
            priceType: 'MONTHLY',
            owner: agentId,
            approvalStatus: 'APPROVED'
        },

        // Chicago
        {
            title: 'Cozy Studio Apartment',
            description: 'Charming studio apartment perfect for young professionals. Recently renovated with modern fixtures and appliances. Building features include gym, rooftop terrace, and 24/7 security.',
            price: 3500,
            address: '789 Pine Street',
            city: 'Chicago',
            state: 'IL',
            zipCode: '60601',
            bedrooms: 1,
            bathrooms: 1,
            squareFeet: 600,
            propertyType: 'APARTMENT',
            status: 'FOR_RENT',
            imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e',
            listingType: 'RENT',
            priceType: 'MONTHLY',
            owner: agentId,
            approvalStatus: 'APPROVED'
        },
        {
            title: 'Spacious Lakeview Walk-up',
            description: 'Classic Chicago walk-up with vintage charm. Hardwood floors, separate dining room, and proximity to Wrigley Field and the lakefront.',
            price: 2800,
            address: '3400 N Clark',
            city: 'Chicago',
            state: 'IL',
            zipCode: '60657',
            bedrooms: 2,
            bathrooms: 1,
            squareFeet: 1000,
            propertyType: 'APARTMENT',
            status: 'FOR_RENT',
            imageUrl: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511',
            listingType: 'RENT',
            priceType: 'MONTHLY',
            owner: adminId,
            approvalStatus: 'APPROVED'
        },
        {
            title: 'Luxury Gold Coast Condo',
            description: 'Premier location on the Gold Coast. Full amenity building with pool, gym, and doorman. Stunning lake views.',
            price: 750000,
            address: '1000 N Lake Shore Dr',
            city: 'Chicago',
            state: 'IL',
            zipCode: '60611',
            bedrooms: 2,
            bathrooms: 2,
            squareFeet: 1400,
            propertyType: 'CONDO',
            status: 'FOR_SALE',
            imageUrl: 'https://images.unsplash.com/photo-1484154218962-a1c00207099b',
            listingType: 'SALE',
            priceType: 'ONE_TIME',
            owner: agentId,
            approvalStatus: 'APPROVED'
        },

        // Miami
        {
            title: 'Waterfront Condo',
            description: 'Stunning waterfront condo with panoramic ocean views. Features include floor-to-ceiling windows, gourmet kitchen with stainless steel appliances, and access to private beach.',
            price: 850000,
            address: '101 Beach Boulevard',
            city: 'Miami',
            state: 'FL',
            zipCode: '33139',
            bedrooms: 3,
            bathrooms: 2,
            squareFeet: 1800,
            propertyType: 'CONDO',
            status: 'FOR_SALE',
            imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
            listingType: 'SALE',
            priceType: 'ONE_TIME',
            owner: agentId,
            approvalStatus: 'APPROVED'
        },
        {
            title: 'Modern Art Deco Villa',
            description: 'Restored Art Deco gem in South Beach. Private courtyard pool, guest house, and lush landscaping.',
            price: 4500000,
            address: '800 Ocean Dr',
            city: 'Miami',
            state: 'FL',
            zipCode: '33139',
            bedrooms: 5,
            bathrooms: 5,
            squareFeet: 4200,
            propertyType: 'VILLA',
            status: 'FOR_SALE',
            imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d',
            listingType: 'SALE',
            priceType: 'ONE_TIME',
            owner: adminId,
            approvalStatus: 'APPROVED'
        },
        {
            title: 'Brickell High-Rise Apartment',
            description: 'Live in the financial heart of Miami. Walking distance to shops and restaurants. Building features rooftop loung and business center.',
            price: 4200,
            address: '1200 Brickell Bay Dr',
            city: 'Miami',
            state: 'FL',
            zipCode: '33131',
            bedrooms: 2,
            bathrooms: 2,
            squareFeet: 1100,
            propertyType: 'APARTMENT',
            status: 'FOR_RENT',
            imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
            listingType: 'RENT',
            priceType: 'MONTHLY',
            owner: agentId,
            approvalStatus: 'APPROVED'
        },

        // Boston
        {
            title: 'Historic Townhouse',
            description: 'Beautifully restored historic townhouse in a vibrant neighborhood. Features original hardwood floors, crown molding, and a private garden. Close to parks, restaurants, and public transportation.',
            price: 750000,
            address: '202 Heritage Lane',
            city: 'Boston',
            state: 'MA',
            zipCode: '02108',
            bedrooms: 3,
            bathrooms: 2,
            squareFeet: 2200,
            propertyType: 'TOWNHOUSE',
            status: 'FOR_SALE',
            imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
            listingType: 'SALE',
            priceType: 'ONE_TIME',
            owner: agentId,
            approvalStatus: 'APPROVED'
        },
        {
            title: 'Beacon Hill Brownstone',
            description: 'Quintessential Boston living on a gas-lit street. Roof deck with Charles River views. Chef\'s kitchen and library.',
            price: 3800000,
            address: '74 Chestnut St',
            city: 'Boston',
            state: 'MA',
            zipCode: '02108',
            bedrooms: 4,
            bathrooms: 3.5,
            squareFeet: 3000,
            propertyType: 'TOWNHOUSE',
            status: 'FOR_SALE',
            imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
            listingType: 'SALE',
            priceType: 'ONE_TIME',
            owner: adminId,
            approvalStatus: 'APPROVED'
        },
        {
            title: 'Seaport District Loft',
            description: 'Modern industrial loft in the booming Seaport District. Floor-to-ceiling windows, polished concrete floors, and tech-ready features.',
            price: 5000,
            address: '50 Liberty Dr',
            city: 'Boston',
            state: 'MA',
            zipCode: '02210',
            bedrooms: 1,
            bathrooms: 1,
            squareFeet: 900,
            propertyType: 'APARTMENT',
            status: 'FOR_RENT',
            imageUrl: 'https://images.unsplash.com/photo-1554995207-c18c203602cb',
            listingType: 'RENT',
            priceType: 'MONTHLY',
            owner: agentId,
            approvalStatus: 'APPROVED'
        },

        // Denver
        {
            title: 'Mountain View Cabin',
            description: 'Rustic cabin with breathtaking mountain views. Perfect for weekend getaways or as a permanent residence. Features include a stone fireplace, large deck, and access to hiking trails.',
            price: 2200,
            address: '303 Forest Road',
            city: 'Denver',
            state: 'CO',
            zipCode: '80202',
            bedrooms: 2,
            bathrooms: 1,
            squareFeet: 1100,
            propertyType: 'HOUSE',
            status: 'FOR_RENT',
            imageUrl: 'https://images.unsplash.com/photo-1502005097973-6a7082348e28',
            listingType: 'RENT',
            priceType: 'MONTHLY',
            owner: agentId,
            approvalStatus: 'APPROVED'
        },
        {
            title: 'Modern Highland Home',
            description: 'Newly built modern home in the trendy Highland neighborhood. Open layout, rooftop deck with city views, and energy-efficient design.',
            price: 850000,
            address: '3200 Tejon St',
            city: 'Denver',
            state: 'CO',
            zipCode: '80211',
            bedrooms: 3,
            bathrooms: 2.5,
            squareFeet: 2100,
            propertyType: 'HOUSE',
            status: 'FOR_SALE',
            imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6',
            listingType: 'SALE',
            priceType: 'ONE_TIME',
            owner: adminId,
            approved: true
        },
        {
            title: 'LoDo Brick Loft',
            description: 'Historic loft in Lower Downtown near Union Station. Exposed beams and brick, walk to Coors Field.',
            price: 3200,
            address: '1600 Wynkoop St',
            city: 'Denver',
            state: 'CO',
            zipCode: '80202',
            bedrooms: 1,
            bathrooms: 1,
            squareFeet: 1000,
            propertyType: 'APARTMENT',
            status: 'FOR_RENT',
            imageUrl: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9',
            listingType: 'RENT',
            priceType: 'MONTHLY',
            owner: agentId,
            approved: true
        }
    ];

    for (const propertyData of properties) {
        const property = new Property(propertyData);
        await property.save();
        console.log(`✓ Created property: ${propertyData.title}`);
    }
};

// Run the seeder
seedData();
