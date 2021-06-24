import { main } from "../src/main";

// Unit Tests
export async function runTests() {
    let result = await main()
    if(result)
    {
        console.log(result)
    }
}

runTests().catch(e => {
    if(process.env.EXPECTED_TO === 'pass'){
        console.error(e)
        process.exit(1)
    }
})
