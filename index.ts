import * as readline from 'readline'
import * as puppeteer from 'puppeteer'

interface insertValues {
    id?: number
    category: string | null
    subcategory: string | null
    pname: string
    // etc ...
}

async function init() {
    try {
        const browser = await puppeteer.launch({ headless: false })
        const a = "hello world!"
    } catch (error) {
        console.error(error)
    }
}