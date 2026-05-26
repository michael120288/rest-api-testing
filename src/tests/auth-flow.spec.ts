import axios, { AxiosResponse } from 'axios';
import { config } from "../config";
import { TEST_CLEANUP_SECRET } from '../fixtures';
import { expectRejected } from '../test-units';

const url = `${config.BASE_URL}/signin`;
const currentUserUrl = `${config.BASE_URL}/currentuser`;
const signoutUrl = `${config.BASE_URL}/signout`;

const credentials = {
    username: config.TEST_USERNAME,
    password: config.TEST_PASSWORD
}
let signInResponse!: AxiosResponse;
let sessionCookie: string;
beforeAll(async () => {
    signInResponse = await axios.post(url, credentials, {
        headers: {
            'x-test-secret': TEST_CLEANUP_SECRET,
        },
        validateStatus: () => true,
    })
    const raw = signInResponse.headers['set-cookie']
    const cookies = (() => {
        if (Array.isArray(raw)) return raw;
        if (raw) return [raw]
        return []
    })()
    sessionCookie = cookies.map(c => c.split(';')[0]).join('; ')
})

afterAll(async () => {
    if(!sessionCookie) return;
    await axios.post(signoutUrl, {}, {
        headers: { Cookie: sessionCookie },
        validateStatus: () => true,
    })
})


describe('Auth flow', () => {
    it('status code 200', async () => {
        expect(signInResponse.status).toBe(200);
    });
    it('should sign in successfully', async () => {
        expect(signInResponse.data.message).toBe('User login successfully');
    });

    it('response body has the correct top-level shape', async () => {
        expect(signInResponse.data).toMatchObject({
            message: expect.any(String),
            token: expect.any(String),
            user: expect.any(Object),
        });
    });
})
describe('Auth flow - negative cases', () => {
    it('token is not empty string', async () => {
        expect(typeof signInResponse.data.token).toBe('string');
        expect(signInResponse.data.token.length).toBeGreaterThan(0);
    });
    it('token has JWT format - three dot-separated parts', async () => {
        const token: string = signInResponse.data.token;
        const parts = token.split('.');
        expect(parts).toHaveLength(3);
        parts.forEach(part => {
            expect(part.length).toBeGreaterThan(0);
        })
    });
})

describe('Session cookies', () => {
    it('set-cookies header is present in the response', async () => {
        expect(signInResponse.headers['set-cookie']).toBeDefined();
    });

    it('set-cookies header is an array', async () => {
        expect(Array.isArray(signInResponse.headers['set-cookie'])).toBe(true);
    });

    it('set-cookies header contains HttpOnly directive', async () => {
        const raw = signInResponse.headers['set-cookie'] ?? []
        const rawStr = Array.isArray(raw) ? raw.join(';') : raw;
        expect(rawStr.toLowerCase()).toContain('httponly');
    });

})

describe('User object', () => {
    it('user object has expected fields', async () => {
        expect(signInResponse.data.user).toMatchObject({
            _id: expect.any(String),
            username: expect.any(String),
            email: expect.any(String),
            avatarColor: expect.any(String),
            postsCount: expect.any(Number),
            followersCount: expect.any(Number),
            followingCount: expect.any(Number),
        });
    });

    it('postsCount, followersCount, and followingCount are positive numbers', async () => {
        const { postsCount, followersCount, followingCount } = signInResponse.data.user;
        expect(postsCount).toBeGreaterThanOrEqual(0);
        expect(followersCount).toBeGreaterThanOrEqual(0);
        expect(followingCount).toBeGreaterThanOrEqual(0);
    });
})

describe('Authenticated request', () => {

    it('GET /currentuser with cookie returns 200', async () => {
        const response = await axios.get(currentUserUrl, {
            headers: { Cookie: sessionCookie },
            validateStatus: () => true,
        })
        expect(response.status).toBe(200);
    });
    it('GET /currentuser without cookie returns 401', async () => {
        const response = await axios.get(currentUserUrl, {
            headers: {},
            validateStatus: () => true,
        })
        expect(response.status).toBe(401);
    });
})

describe('NEGATIVE CASES', () => {
    it('wrong password returns 400', async () => {
      const res = await axios.post(url, {
        username: config.TEST_USERNAME,
        password: 'WrongPassword123'
      },{
        validateStatus: () => true,
      })
      expectRejected(res.status);
      if(res.status === 400) expect(res.data.message).toBe('Invalid credentials');
    });
    
})

describe('Response time', () => {
    it('signin response time is within acceptable limits', async () => {
      const start = Date.now();
      console.log(start)
      await axios.post(url, credentials, {
        validateStatus: () => true,
      });
      expect(Date.now() - start).toBeLessThan(2000); // example: response should be under 2 seconds
    }); 
    //add examples
})

describe('Regex', () => {
    it('token matches JWT regex pattern - toMatch', async () => {
     expect(signInResponse.data.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    }); 
})
