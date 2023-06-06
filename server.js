const { log } = require('console');
const mysql = require('mysql');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const PhStudio = require('./TMNFUNC.js');

app.use(bodyParser.json());

async function CheckLink(link, pnum) {
    const PHClass = await PhStudio(link, pnum);
    let response;
    switch (PHClass.status.code) {
        case "SUCCESS":
            response = {
                Status: 200,
                Message: "กดลิ้งค์สำเร็จ",
                Amount: PHClass.data.my_ticket.amount_baht
            };
            return response;
        case "CANNOT_GET_OWN_VOUCHER":
            response = {
                Status: 401,
                Message: "รับซองตัวเองไม่ได้",
                Amount: 0
            };
            return response;
        case "TARGET_USER_NOT_FOUND":
            response = {
                Status: 404,
                Message: "ไม่พบเบอร์นี้ในระบบ",
                Amount: 0
            };
            return response;
        case "INTERNAL_ERROR":
            response = {
                Status: 404,
                Message: "ไม่มีซองนี้ในระบบ หรือ URL ผิด",
                Amount: 0
            };
            return response;
        case "VOUCHER_OUT_OF_STOCK":
            response = {
                Status: 409,
                Message: "มีคนรับไปแล้ว",
                Amount: 0
            };
            return response;
        case "VOUCHER_NOT_FOUND":
            response = {
                Status: 404,
                Message: "ไม่พบซองในระบบ",
                Amount: 0
            };
            return response;
        case "VOUCHER_EXPIRED":
            response = {
                Status: 410,
                Message: "ซองวอเลทนี้หมดอายุแล้ว",
                Amount: 0
            };
            return response;
        default:
            break;
    }
}

const conn =  mysql.createConnection({
    host: "sql12.freemysqlhosting.net",
    user: 'sql12624078',
    password: 'QQinvtu7Fp',
    database: "sql12624078"
});

conn.connect((err)=>{
    if(err) throw err;
    log("Connect!")
})

app.get('/', (req, res)=>{
    const responce = {
        Message: "Hello Welcome To PhStudio"
    }
    res.send(responce);
})

app.post('/func/phclass', (req, res) => {
    const Username = req.body.Username;
    const Password = req.body.Password;
    const API_Key = req.body.API_Key;
    const L = req.body.L;
  
    let response = {}; // เปลี่ยนเป็นออบเจ็กต์เดียวกันสำหรับการเก็บข้อมูลเพิ่มเติม
  
    const sql = "SELECT * FROM users WHERE Username = '" + Username + "'";
  
    conn.query(sql, (err, result, fields) => {
        if (err) throw err;
        const r = result[0];
        const userPassword = r.Password;
        const Enc = r.Enc;
        const MyEnc = btoa(Password);
    
        if (MyEnc === Enc) {
            const LoginStatus = {
                Status: 200,
                Message: "เข้าสู่ระบบสำเร็จ"
            };
            response.LoginStatus = LoginStatus; // เพิ่มสถานะการเข้าสู่ระบบในออบเจ็กต์ตอบสนอง
            const My_Api_Key = r.API_Key;
    
            if (API_Key === My_Api_Key) {
                
                const APIKeyStatus = {
                    Status: 200,
                    Message: "เช็ก API Key สำเร็จ"
                };
                response.APIKeyStatus = APIKeyStatus;

                if(r.Request === 0){
                    response.YourRequetStatus = {
                        Status: 403,
                        Message: "รีเควสหมด"
                    }
                    res.send(response);
                }else{
                    const Phone_Number = r.Phone_Number;

                    CheckLink(L, Phone_Number).then((result) => {
                        const sql = "UPDATE `users` SET `Request`= `Request`-1 WHERE `ID` = '" + r.ID + "'";
                        conn.query(sql, (err)=>{
                            if(err) throw err;
                            response.CheckStatus = result;
                            res.send(response);
                        })}).catch((err) => {
                            console.log(err);
                    });
                }
            }else{
                const APIKeyStatus = {
                    Status: 400,
                    Message: "เช็ก API Key ไม่สำเร็จ"
                };
                response.APIKeyStatus = APIKeyStatus;
                res.send(response);
            }
        }else{
            const APIKeyStatus = {
                Status: 400,
                Message: "เช็ก API Key ไม่สำเร็จ"
            };
            response.LoginStatus = LoginStatus; // เพิ่มสถานะการเข้าสู่ระบบในออบเจ็กต์ตอบสนอง
            res.send(response);
        }
    });
});
  
app.get('/get/apiket', (req, res)=>{
    function generateAPIKey(length) {
        var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var apiKey = "";
      
        for (var i = 0; i < length; i++) {
          var randomIndex = Math.floor(Math.random() * charset.length);
          apiKey += charset.charAt(randomIndex);
        }
      
        return apiKey;
    }

    const API_Key = generateAPIKey(32)
    res.send(API_Key)
})

app.listen(5555, ()=>{
    log("Listen On Port 5555");
})