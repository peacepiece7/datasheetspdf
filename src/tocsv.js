const sql = require("./sql")
const stringify = require("csv-stringify/lib/sync")
const fs = require("fs");

//! 이제 이것들 안 씀!

async function init() {
    try{
        const data = await sql.findAllByFlag();
        for(let i = 0 ; i < data.length; i++) {
            data[i].pdf_url = `https://www.google.com/search?q=${data[i].pname}`
        }
        const csvData = [];
        for(let i = 0 ; i < data.length; i++) {
            csvData.push([data[i].pname, data[i].page_url, data[i].mfr, data[i].pdf_url])
        }
        fs.writeFileSync("./datasheetspdf.csv", stringify(csvData))
        console.log("DONE")
    }catch(err){
        console.error(err)
    }
}

init()

async function test(){
    try{
        const data = await sql.findAllByFlag();
        for(let i = 0 ; i < data.length; i++) {
            data[i].google_search_url = `https://www.google.com/search?q=${data[i].pname}`
            await sql.updateGoogleUrlByid(data[i])
        }
        console.log("DONE")
    }catch(err){
        console.error(err)
    }
}

