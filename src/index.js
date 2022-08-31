const puppeteer = require("puppeteer")
const referers = require('./referers.json')
const userAgents = require("./useAgents.json")
const fs = require("fs")
const parse = require("csv-parse/lib/sync")
const stringify = require("csv-stringify/lib/sync")
const sql = require("./sql")
const { fileURLToPath } = require("url")


async function readCsvData(dir) {
   try{
        const month = await new Promise((res) => {
            fs.readFile(dir, (err,data) => {
                if(data) return res(parse(data.toString()))
                return res([])
            })
        })
        return month
   }catch(err){
    console.error(err)
   }
}
async function writeAdditionalInfo(dir, pnumInfo) {
    try{
        if(!dir || !pnumInfo) throw new Error("잘못된 입력입니다.")
        const prevInfo = await new Promise((res, rej) => {
            fs.readFile(dir, (err,data) => {
                if(data) res(parse(data.toString()))
                if(err) rej(err)
                return res(null)
            })
        })
        const curInfo = [...pnumInfo, ...prevInfo];
        // need to converting format like backtick, qutation, unsupported string 
        // .. 
        fs.writeFileSync(dir, stringify(curInfo))
    }catch(err){
        console.error(err)
    }
}

async function init() {
    try {
        const browser = await puppeteer.launch({
            headless: false
        })
        const page = await browser.newPage();
        const randomReferer = referers[Math.floor(Math.random() * referers.length)]
        const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)]
        await page.setUserAgent(randomUserAgent)
        await page.setExtraHTTPHeaders({ referer: randomReferer })
        // // month.csv에 날짜 정보가 있다면, 해당 정보를 읽고, 없으면 month를 먼저 파싱
        let month = await readCsvData("datasheetspdf/month.csv")
        console.log(month)
        if(!month?.length) {
            await page.goto('https://datasheetspdf.com/date/2020/01/01.html', {waitUntil : "networkidle0"});
            const mlist = await page.evaluate(() => {
                if(!document.querySelector("#remC a")) return []
                return Array.from(document.querySelectorAll("#remC a")).map((v) => {
                    if(v.href) return [v.textContent.trim(),v.href]
                    else null
                })
            }) 
            fs.writeFileSync("datasheetspdf/month.csv", (stringify(mlist.reverse())))
        }
        month = await readCsvData("datasheetspdf/month.csv");
        if(!month) throw new Error("요소가 존재하지 않습니다.")
        
        for(let m of month) { // m[0] = month-year,  m[1] = month href
            await page.goto(m[1],{waitUntil : "networkidle0"});
            const days = await page.evaluate((...m) => {
                if(!document.querySelector("table:nth-child(6) a")) return []
                return Array.from(document.querySelectorAll("table:nth-child(6) a")).map((v) => {
                    if(v.textContent && v.href) return [...m, v.textContent, v.href]
                    else null
                })
            },...m)
            for(let day of days) { // day[0] = m[0], day[1] = m[1], day[2] = day number, day[3] = day href 
                // 해당 day(이)가 이미 분석 됐는지 체크
                let answer = await sql.isItDownload(day[3])
                if(answer) continue
                await page.goto(day[3], {waitUntil : "networkidle0"})
                const currentDate = await page.evaluate(() => {
                    if(!document.querySelector("table:nth-child(9) h2")) return null;
                    return document.querySelector("table:nth-child(9) h2").textContent.trim()
                })
                if(!currentDate) continue
                const pnumInfo = await page.evaluate((...day) => {
                    if(!document.querySelector("table:nth-child(9) a")) return [];
                    return Array.from(document.querySelectorAll("table:nth-child(9) a")).map((v) => {
                        if(v.textContent && v.href) return [...day, v.textContent.trim(), v.href.trim()]
                        else return []
                    })
                },...day, currentDate)

                for(let i = 0 ; i < pnumInfo.length; i++) {
                    const obj = {
                        pub_date : `Updated: ${pnumInfo[i][4].split(":")[1].trim()}`,
                        mfr : pnumInfo[i][6].split("/")[5],
                        pname : pnumInfo[i][5],
                        page_url : pnumInfo[i][6],
                        pdf_url : pnumInfo[i][6].replace("https://datasheetspdf.com/pdf", "https://datasheetspdf.com/pdf-file"),
                        google_search_url : `https://www.google.com/search?q=${pnumInfo[i][5]}`
                    }

                    if(!obj.pub_date.length || !obj.mfr.length || !obj.pname.length || !obj.pdf_url.length || !obj.google_search_url.length) continue;
                    await sql.insertDatasheet(obj)
                }
                await sql.insertDownloadDoneUrl(day[3])
            }
        }
        fs.writeFileSync('datasheetspdf/month.csv', "")
       // const datasheets = await sql.findAllByMfrIsNull();
       // for(let ds of datasheets)
       // {
            // await page.goto(ds.page_url, {timeout: 0, waitUntil : "networkidle0"})
            // const info = await page.evaluate(() => {
            //     const ob = {}
            //     if(!document.querySelector("#MO th")) return null;
            //      Array.from(document.querySelectorAll("#MO th")).map((v) => {
            //         if(v?.textContent == "Manufacture") {
            //             ob.mfr = v.nextElementSibling.textContent
            //         }
            //         if(v?.textContent == "Description") {
            //             // 혹시나 500자 넘을까봐
            //             ob.description = v.nextElementSibling.textContent.length >= 500 ? "" : v.nextElementSibling.textContent
            //         }
            //         if(v?.textContent == "Datasheet") {
            //             ob.pdf_url = v.nextElementSibling.querySelector("a")?.href ? v.nextElementSibling.querySelector("a")?.href : null
            //         }
            //     })
            //     return ob
            // })
            // if(info.pdf_url && info.description && info.mfr) {
            //     sql.updateOneByid(ds.id, info)
            // }else {
            //     throw new Error(
            //         `------------------------------------------------------------------------\n
            //         아래 데이터 확인 필요!! 일부 정보가 누락됨\n
            //         ${info}\n
            //         ${ds}\n
            //         -------------------------------------------------------------------------\n
            //         `
            //     )
            // }
        // }
        await page.waitForTimeout(Math.floor(Math.random() * 100000) + 5000)
        await page.close();
        await browser.close();
        console.log("DONE!")

    } catch (err) {
        console.error(err)
    }
}
init()