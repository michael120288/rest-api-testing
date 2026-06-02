import axios, { AxiosResponse } from 'axios';
import { config } from "../config";
import { TEST_AVATAR_COLOR, TEST_AVATAR_IMAGE, TEST_CLEANUP_SECRET } from '../fixtures';
import { faker } from '@faker-js/faker';

const signupUrl = `${config.BASE_URL}/signup`;
const cleanupUrl = (userId: string) => `${config.BASE_URL}/test/cleanup/user/${userId}`;

const newUser = {
    "username": `vitest${faker.string.alphanumeric(8).toLowerCase()}`,
    "email": faker.internet.email().toLowerCase(),
    "password": process.env.TEST_PASSWORD,
    "avatarColor": TEST_AVATAR_COLOR,
    "avatarImage": TEST_AVATAR_IMAGE
}
console.log('New user for signup test:', newUser);

let signupResponse: AxiosResponse;
let authId: string;

beforeAll(async () => {
    signupResponse = await axios.post(signupUrl, newUser, {
        headers: {
            'x-test-secret': TEST_CLEANUP_SECRET,
        },
        validateStatus: () => true,
    })
    authId = signupResponse.data?.user?.authId ?? ''

    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('beforeAll');
})
beforeEach(async () => { console.log('1') })
afterEach(async () => { console.log('2') })
//DRY - do not repeat yourself - avoid making the same request in multiple tests. Make it once in beforeAll and share the response object across tests.
afterAll(async () => {
    await axios.delete(cleanupUrl(authId), {
        headers: {
            'x-test-secret': TEST_CLEANUP_SECRET,
        },
        validateStatus: () => true,
    })
    console.log('afterAll');
})

describe('Signup flow', () => {
    it('should sign up successfully', async () => {
        expect(signupResponse.status).toBe(201);
    });
    it('should contain correct message for signup', async () => {
        expect(signupResponse.data.message).toBe('User created successfully');
    });
    it('response body has the correct top-level shape', async () => {
        expect(signupResponse.data).toMatchObject({
            message: expect.any(String),
            token: expect.any(String),
            user: expect.any(Object)
        })
    });
})


describe('User object', () => {
    it('user has _id and authId', async () => {
        expect(signupResponse.data.user).toMatchObject({
            _id: expect.any(String),
            authId: expect.any(String),
        })
    });

    it('user has _id and authId', async () => {
        expect(signupResponse.data.user).toMatchObject({
            _id: expect.any(String),
            authId: expect.any(String),
        })
    });
    it('username is titled-cassed version of what was sent', async () => {
        const received = signupResponse.data.user.username.toLowerCase();
        expect(received).toBe(newUser.username.toLowerCase())
    });
    it('email is titled-cassed version of what was sent', async () => {
        const received = signupResponse.data.user.email.toLowerCase();
        expect(received).toBe(newUser.email.toLowerCase())
    });
    it('password is not in the user object', async () => {
        const received = signupResponse.data.user.password;
        expect(received).toBeUndefined();
        expect(signupResponse.data.user).not.toHaveProperty('password');
    });
})

describe('Cookies', () => {
    it('set-cookies headers is defined', async () => {
        expect(signupResponse.headers).toHaveProperty('set-cookie');
    });
})

describe('Protection checks', () => {
    it('return 403 with wrong secrets', async () => {
        const res = await axios.delete(cleanupUrl(authId), {
            headers: { "x-test-secret": "wrong-secret" },
            validateStatus: () => true,
        })
        expect(res.status).toBe(403);
    });
})