const http = require('http');

// 1. MAKE SURE THIS MATCHES YOUR LOGIN EMAIL EXACTLY
const emailToPromote = 'admin@test.com'; 

const data = JSON.stringify({ email: emailToPromote });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/make-admin',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('\n--- SERVER RESPONSE ---');
    console.log(body);
    console.log('-----------------------\n');
  });
});

req.write(data);
req.end();
