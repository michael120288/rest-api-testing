import axios, { AxiosResponse } from 'axios';
import {config} from "../config";
import {expectRejected} from "../test-units";

const url = `${config.BASE_URL}/signin`;
const wrongCredentials = {
  username: 'notarealuser99999',
  password: 'WrongPass@9999',
};

let sharedResponse: AxiosResponse;

beforeAll(async () => {
    sharedResponse = await axios.post(url, wrongCredentials, {
        validateStatus: () => true,
    });
})


describe("Exact value ",() =>{
    it("should return 400 for wrong credentials", () =>{
        if(sharedResponse.status === 429) return 
        expectRejected(sharedResponse.status);
        expect(sharedResponse.statusText).toBe('Bad Request'); //example 
        expect(sharedResponse.statusText).toContain('Bad '); //example
    })

    it("response body has a message field", () =>{
        expect(sharedResponse.data).toHaveProperty('message');
    })

    it("response body has a status field", () =>{
        expect(sharedResponse.data).toHaveProperty('status');
    })
})
describe("Exact value assertions",() =>{
    it("message is exactly 'Invalid credentials'", () =>{
        if(sharedResponse.status === 429) return 
        expect(sharedResponse.data.message).toBe('Invalid credentials');
    })

    it("statusCode inside body matches HTTP status", () =>{
        if(sharedResponse.status === 429) return 
        expect(sharedResponse.data.statusCode).toBe(sharedResponse.status);
    })
       

    it("message is a non-empty string", () =>{
        expect(typeof sharedResponse.data.message).toBe('string');
        expect(sharedResponse.data.message).not.toBe('');
        expect(sharedResponse.data.message.length).toBeGreaterThan(0);
    })
})

describe("SHAPE VALIDATION",() =>{
    it("response body matches the expected error shape", () =>{
        if(sharedResponse.status === 429) {
            expect(sharedResponse.data).toHaveProperty('message');
            return 
        }
        expect(sharedResponse.data).toMatchObject({
            message: expect.any(String), // any string value
            status: "error", // exact value
            statusCode: expect.any(Number), // any number value
        })
    })
})

describe("Boundary Value Analysis",() =>{
    it("username shorter than 4 chars", async() =>{
       
        const res = await axios.post(url, {username: 'abc', password: 'ValidPass@123'}, {validateStatus: () => true});
        if(res.status === 400) {
            expect(res.data).toHaveProperty('message');
            expectRejected(res.status);
            expect(res.data.message).toBe('Invalid username');
        }
    })
     it("password longer than 128 chars", async() =>{
       
        const res = await axios.post(url, {username: 'validuser', password: 'A@1' + 'a'.repeat(128)}, {validateStatus: () => true});
        if(res.status === 400) {
            expect(res.data).toHaveProperty('message');
            expectRejected(res.status);
            expect(res.data.message).toBe('Invalid password');
        }
    })
})

describe.only("Verifing headers",() =>{
    it("username shorter than 4 chars", async() =>{
        const res = await axios.post(url, {username: 'abc', password: 'ValidPass@123'}, {validateStatus: () => true});
        expect(res.headers['content-type']).toContain('application/json');
    })   
})