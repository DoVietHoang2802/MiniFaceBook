const axios = require('axios');
const http = require('http');

const BACKEND_URL = 'http://localhost:8080/api';
const MAILPIT_URL = 'http://localhost:8025/api/v1';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    const email = `testuser_${Date.now()}@example.com`;
    const password = 'Password123';
    const name = 'Test User';

    console.log(`1. Registering user: ${email}...`);
    try {
        await axios.post(`${BACKEND_URL}/auth/register`, {
            email,
            password,
            name
        });
    } catch (err) {
        console.error('Register failed:', err.response?.data || err.message);
        return;
    }

    console.log('2. Waiting for verification email in Mailpit...');
    await delay(1500);

    let verifyUrl = null;
    try {
        const mailRes = await axios.get(`${MAILPIT_URL}/messages`);
        const messages = mailRes.data.messages;
        const userMail = messages.find(m => m.To.some(t => t.Address === email));
        const bodyRes = await axios.get(`${MAILPIT_URL}/message/${userMail.ID}`);
        const text = bodyRes.data.HTML || bodyRes.data.Text;
        const match = text.match(/href="([^"]+verify[^"]+)"/) || text.match(/(http[s]?:\/\/[^\s]+verify[^\s]+)/);
        verifyUrl = match[1].replace(/&amp;/g, '&');
    } catch (err) {
        console.error('Mailpit interaction failed:', err.message);
        return;
    }

    console.log('3. Verifying email...');
    try {
        await axios.get(verifyUrl);
    } catch (err) {
        console.error('Verification failed:', err.response?.data || err.message);
        return;
    }

    console.log('4. Logging in...');
    let cookieHeaders = [];
    try {
        const loginRes = await axios.post(`${BACKEND_URL}/auth/login`, {
            email,
            password
        });
        cookieHeaders = loginRes.headers['set-cookie'] || [];
    } catch (err) {
        console.error('Login failed:', err.response?.data || err.message);
        return;
    }

    const cookies = cookieHeaders.map(c => c.split(';')[0]).join('; ');
    const accessToken = cookieHeaders.find(c => c.startsWith('accessToken='))?.split(';')[0].split('=')[1];

    const client = axios.create({
        baseURL: BACKEND_URL,
        headers: {
            'Cookie': cookies
        }
    });

    console.log('5. Creating a post...');
    let postId = null;
    try {
        const postRes = await client.post('/posts', {
            content: 'Hello, testing comment deletion!'
        }, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        postId = postRes.data.data.id;
    } catch (err) {
        console.error('Post creation failed:', err.response?.data || err.message);
        return;
    }

    console.log('6. Connecting to SSE `/api/events/comment` globally...');
    const ssePath = `/api/events/comment?access_token=${encodeURIComponent(accessToken)}`;
    
    const req = http.request({
        hostname: 'localhost',
        port: 8080,
        path: ssePath,
        method: 'GET',
        headers: {
            'Cookie': cookies,
            'Accept': 'text/event-stream'
        }
    }, (res) => {
        console.log(`SSE Connection status: ${res.statusCode}`);
        res.on('data', (chunk) => {
            console.log('--- RECEIVED SSE CHUNK ---');
            console.log(chunk.toString());
            console.log('---------------------------');
        });
    });

    req.on('error', (err) => {
        console.error('SSE connection error:', err);
    });

    req.end();

    await delay(1000);

    console.log('7. Adding a comment...');
    let commentId = null;
    try {
        const commentRes = await client.post(`/posts/${postId}/comments`, {
            content: 'Test comment content'
        }, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        commentId = commentRes.data.data.id;
    } catch (err) {
        console.error('Comment creation failed:', err.response?.data || err.message);
        req.destroy();
        return;
    }

    await delay(1000);

    console.log('8. Deleting the comment...');
    try {
        const deleteRes = await client.delete(`/posts/comments/${commentId}`);
        console.log('Delete response:', deleteRes.data);
    } catch (err) {
        console.error('Delete comment failed:', err.response?.data || err.message);
    }

    await delay(2000);
    console.log('Closing SSE Connection...');
    req.destroy();
    console.log('Test completed.');
}

runTest();
