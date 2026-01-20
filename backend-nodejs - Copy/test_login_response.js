import axios from 'axios';

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:8889/api/auth/login', {
            email: 'admin@demo.com',
            password: 'wrongpassword'
        });
        console.log('Response:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data Type:', typeof error.response.data);
            console.log('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

testLogin();
