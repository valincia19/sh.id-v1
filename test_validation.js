const http = require('http');

const testPayloads = [
    { name: "Missing everything", payload: { key: "SH-id42d6b38ffc43e7c72eb4ff7d" } },
    { name: "Missing executor only", payload: { key: "SH-id42d6b38ffc43e7c72eb4ff7d", hwid: "TEST1", robloxUsername: "Test", robloxUserId: 123 } },
    { name: "Valid full payload", payload: { key: "SH-id42d6b38ffc43e7c72eb4ff7d", hwid: "TEST1", executor: "Krampus", robloxUsername: "Test", robloxUserId: 123 } }
];

async function runTests() {
    for (const test of testPayloads) {
        console.log(`\n--- Testing: ${test.name} ---`);
        const data = JSON.stringify(test.payload);

        await new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: 4001,
                path: '/api/v2/keys/validate',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    console.log(`Status: ${res.statusCode}`);
                    console.log(`Response: ${body}`);
                    resolve();
                });
            });
            req.write(data);
            req.end();
        });
    }
}

runTests();
