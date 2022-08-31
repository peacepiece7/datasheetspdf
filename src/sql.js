const mysql = require("mysql2")
const dotenv = require("dotenv")
dotenv.config();

const pool = mysql.createConnection({
    host : "127.0.0.1",
    user : "root",
    password : process.env.LOCAL_PASSWORD,
    database : process.env.LOCAL_DATASHEETSPDF_DATABASE
})

const promisePool = pool.promise();

const sql = {
    insertDatasheet : async (iv) => {
        const [res] = await promisePool.query(
            `
            insert into datasheets(pname,mfr, up_flag, server_upload, page_url, pdf_url, pub_date, google_search_url) 
            values("${iv.pname}","${iv.mfr}", 0, 0, "${iv.page_url}","${iv.pdf_url}", "${iv.pub_date}", "${iv.google_search_url}")
            `
        )
        console.log("insertDatasheet :",res.insertId);
        return;
    },
    isItDownload : async (url) => {
        try{
            const [res] = await promisePool.query(
                `select * from download_done_url where url = "${url}"`
            ) 
            if(res.length) return true
            return false
        }catch(err){
            console.error(err)
        }
    },
    insertDownloadDoneUrl : async (url) => {
        try{
            const [res] =  await promisePool.query(
                `
                insert into download_done_url(url)
                values("${url}")
                `
            )
            console.log("insertDownloadDoneUrl : ",res.insertId)
            return;
        }catch(err){
            console.error(err)
        }
    },
    findAllByMfrIsNull : async () => {
        try{

            const [rows] = await promisePool.query(
                `
                select * from datasheets where mfr is null order by pub_date desc
                `
            ) 
            return rows
        }catch(err){
            console.error(err)
        }
    },
    updateOneByid : async (id, iv) => {
        try{
            await promisePool.query(
                `
                update datasheets
                set mfr = "${iv.mfr}", pdf_url = "${iv.pdf_url}", description = "${iv.description}"
                where id = ${id}
                `
            )
            console.log(`update mfr = "${iv.mfr}" and pdf_url = "${iv.pdf_url}" and description = "${iv.description}"`)
            return;
        }catch(err){
            console.error(err)
        }
    },
    updateFlagByid : async (id) => {
        try{
            const [answer] = await promisePool.query(
                `
                update datsheets
                set up_flag = 1 where id = ${id}
                `
            )
            console.log("updated id", answer.insertId)
            return;
        }catch(err){
            console.error(err)
        }
    },
    findAllByFlag : async () => {
        try{

            const [rows] = await promisePool.query(
                `
                select id, pname, mfr, page_url from datasheets where up_flag = 0
                `
            )
            return rows
        }catch(err){
            console.error(err)
        }
    },
    updateGoogleUrlByid : async (iv) => {
        try{
            const [answer] = await promisePool.query(
                `
                update datasheets set google_search_url = "${iv.google_search_url}" where id = ${iv.id}
                `
            )
            console.log(answer.insertId)
            return;
        }catch(err){
            console.error(err)
        }
    },

}

module.exports = sql;


