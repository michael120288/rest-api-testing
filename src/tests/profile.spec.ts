import axios, { AxiosResponse } from 'axios';
import { config } from "../config";
import { expectRejected } from "../test-units";
import { TEST_CLEANUP_SECRET } from '../fixtures';

const credentials = {
    username: config.TEST_USERNAME,
    password: config.TEST_PASSWORD
}
const url = `${config.BASE_URL}/signin`;
const currentUserUrl = `${config.BASE_URL}/currentuser`;
const signoutUrl = `${config.BASE_URL}/signout`;
const settingsUrl = `${config.BASE_URL}/user/profile/settings`;
const basicInfoUrl = `${config.BASE_URL}/user/profile/basic-info`;

let signInResponse!: AxiosResponse;
let sessionCookie: string;

//Values captured before we change them 
let originalWork: string = ''
let originalQuote: string = ''
let originalReactions: boolean = true
let originalFollows: boolean = true


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

    const currentUserResponse = await axios.get(currentUserUrl, {
        headers: { Cookie: sessionCookie },
        validateStatus: () => true,
    })
    //console.log('Current user response:', currentUserResponse.data);

    originalWork = currentUserResponse.data.user?.work ?? ''
    originalQuote = currentUserResponse.data.user?.quote ?? ''
    originalReactions = currentUserResponse.data.user?.notifications?.reactions ?? true
    originalFollows = currentUserResponse.data.user?.notifications?.follows ?? true

    await axios.put(settingsUrl, {
        messages: true, reactions: originalReactions, comments: true, follows: originalFollows
    },
        {
            headers: { Cookie: sessionCookie },
            validateStatus: () => true,

        })
})

afterAll(async () => {
    await axios.put(basicInfoUrl, {
        work: originalWork, quote: originalQuote
    }, {
        headers: { Cookie: sessionCookie },
        validateStatus: () => true,
    })
    await axios.get(currentUserUrl, {
        headers: { Cookie: sessionCookie },
        validateStatus: () => true,
    }).then(console.log)
    //console.log(currentUserResponse)

})

describe('Update basic info', () => {
    it('update should be successful with status 200', async () => {
        const res = await axios.put(basicInfoUrl, {
            work: 'Senior QA Engineer', quote: 'Testing is my passion!!!!!!!!!!!!'
        },
            { headers: { Cookie: sessionCookie }, validateStatus: () => true, })
        //console.log('Update basic info response:', res.data);

        const currentUserResponse = await axios.get(currentUserUrl, {
            headers: { Cookie: sessionCookie },
            validateStatus: () => true,
        })
        //console.log('Current user after update:', currentUserResponse.data);
        expect(res.status).toBe(200);
    });
    it('message is "Updated successfully"', async () => {
        const res = await axios.put(basicInfoUrl, {
            work: 'Senior QA Engineer'
        },
            { headers: { Cookie: sessionCookie }, validateStatus: () => true, })

        expect(res.data.message).toBe('Updated successfully');
    });
})


describe('State verification', () => {

    const run = Date.now();

    const testWork = `Senior QA Engineer-${run}`
    const testQuote = `Testing is my passion!!!!!!!!!!!!-${run}`

    beforeAll(async () => {
        await axios.put(basicInfoUrl, {
            work: testWork,
            quote: testQuote
        },
            {
                headers: { Cookie: sessionCookie },
                validateStatus: () => true,
            })
    })

    it('GET /currentuser reflects the updated work field', async () => {
        const res = await axios.get(currentUserUrl,
            { headers: { Cookie: sessionCookie }, validateStatus: () => true, })

        const work = res.data.user.work?.replace(/^"|"?$/g, ''); // Remove surrounding quotes if present
        console.log(res.data)
        expect(work).toBe(testWork);
        console.log(work, testWork)
    });
})

describe('Update notification settings', () => {



    it('GET /currentuser reflects the updated work field', async () => {
        const res = await axios.put(settingsUrl, {
            reactions: false, follows: false
        },
            { headers: { Cookie: sessionCookie }, validateStatus: () => true, })
        expect(res.status).toBe(200);
    });
    it('message is "Notification settings updated successfully"', async () => {
        const res = await axios.put(settingsUrl, {
            reactions: false
        },
            { headers: { Cookie: sessionCookie }, validateStatus: () => true, })
        expect(res.data.message).toBe('Notification settings updated successfully');
    });
    it('GET /currentuser reflects the updated notification settings', async () => {
        await axios.put(settingsUrl, {
            reactions: false
        },
            { headers: { Cookie: sessionCookie }, validateStatus: () => true, })
        const currentUserResponse = await axios.get(currentUserUrl, {
            headers: { Cookie: sessionCookie },
            validateStatus: () => true,
        })
        expect(currentUserResponse.data.user.notifications.reactions).toBe(false);
    });
})
