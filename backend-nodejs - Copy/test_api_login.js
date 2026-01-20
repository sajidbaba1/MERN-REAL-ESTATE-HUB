import axios from 'axios';

async function testNewUserLogin() {
    const baseURL = 'http://localhost:8889/api';

    try {
        console.log('Step 1: Creating a new user via admin API...');

        // First, login as admin to get token
        const adminLogin = await axios.post(`${baseURL}/auth/login`, {
            email: 'admin@demo.com',
            password: 'Demo@12345'
        });

        const adminToken = adminLogin.data.token;
        console.log('✓ Admin logged in successfully');

        // Create a new test user
        const testEmail = 'newuser@test.com';
        const testPassword = 'TestPass123';

        try {
            await axios.post(`${baseURL}/admin/users`, {
                firstName: 'New',
                lastName: 'User',
                email: testEmail,
                password: testPassword,
                role: 'USER'
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log('✓ New user created successfully');
        } catch (err) {
            if (err.response?.status === 409) {
                console.log('! User already exists, will test login anyway');
            } else {
                throw err;
            }
        }

        console.log('\nStep 2: Attempting to login with the new user...');
        console.log(`Email: ${testEmail}`);
        console.log(`Password: ${testPassword}`);

        try {
            const loginResponse = await axios.post(`${baseURL}/auth/login`, {
                email: testEmail,
                password: testPassword
            });

            console.log('\n✓✓✓ LOGIN SUCCESSFUL! ✓✓✓');
            console.log('User data:', {
                email: loginResponse.data.email,
                role: loginResponse.data.role,
                firstName: loginResponse.data.firstName
            });
        } catch (loginErr) {
            console.log('\n✗✗✗ LOGIN FAILED! ✗✗✗');
            console.log('Status:', loginErr.response?.status);
            console.log('Error:', loginErr.response?.data);

            // Let's check what the user looks like in the database
            console.log('\nStep 3: Fetching user details from admin API...');
            const usersResponse = await axios.get(`${baseURL}/admin/users`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });

            const newUser = usersResponse.data.find(u => u.email === testEmail);
            if (newUser) {
                console.log('User found in database:');
                console.log(JSON.stringify(newUser, null, 2));
            } else {
                console.log('User NOT found in database!');
            }
        }

    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testNewUserLogin();
