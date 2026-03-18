import { gfgService } from './services/gfg.service';

async function test() {
    const handle = 'aditya30q2gj'; 
    console.log(`Testing GfG fetch for handle: ${handle}...`);
    try {
        const result = await gfgService(handle);
        console.log('Success! Result:', JSON.stringify(result, null, 2));
    } catch (error: any) {
        console.error('Test failed:', error.message);
    }
}

test();
