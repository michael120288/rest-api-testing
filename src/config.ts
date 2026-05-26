const BASE_URL = process.env.BASE_URL;
const TEST_USERNAME = process.env.TEST_USERNAME;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!BASE_URL) {
    throw new Error('Missing env var: BASE_URL — copy .env.example to .env');
}

if (!TEST_USERNAME) {
    throw new Error('Missing env var: TEST_USERNAME — copy .env.example to .env');
}

if (!TEST_PASSWORD) {
    throw new Error('Missing env var: TEST_PASSWORD — copy .env.example to .env');
}

export const config = { BASE_URL, TEST_USERNAME, TEST_PASSWORD } as const;