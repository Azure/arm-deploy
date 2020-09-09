import { main } from "../src/main";
import * as assert from 'assert';

// Unit Tests
export async function runTests() {
    let result = await main()
    console.log(result)
}

runTests().catch(e => {
    console.error(e)
    process.exit(1)
})