import { leetcodeService } from './services/leetcode.service';

async function test() {
    const handle = 'adityasingh3012'; // User's handle
    console.log(`Testing LeetCode fetch for handle: ${handle}...`);
    try {
        const result = await leetcodeService(handle);
        console.log('Success! Result:', JSON.stringify(result, null, 2));
    } catch (error: any) {
        console.error('Test failed:', error.message);
    }
}

test();
