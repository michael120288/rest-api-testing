import axios, { AxiosResponse } from 'axios';
import {config} from "../config";
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
    signupResponse = await axios.post(signupUrl,newUser,  {
        headers: {
            'x-test-secret': TEST_CLEANUP_SECRET,
        },
        validateStatus: () => true,
    })
    authId = signupResponse.data?.user?.authId ?? ''

    await new Promise(resolve => setTimeout(resolve, 1000));
})


//DRY - do not repeat yourself - avoid making the same request in multiple tests. Make it once in beforeAll and share the response object across tests.
afterAll(async () => {
    await axios.delete(cleanupUrl(authId),{
        headers: {
            'x-test-secret': TEST_CLEANUP_SECRET,
        },
        validateStatus: () => true,
    })
})

describe('Signup flow', () => {
    it('should sign up successfully', async () => {
        console.log('Signup response:', signupResponse.status, signupResponse.data);
        expect(signupResponse.status).toBe(201);
    });
})
