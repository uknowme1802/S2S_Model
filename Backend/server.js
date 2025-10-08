const axios=require('axios')
const qrcode=require('qrcode')
const crypto=require('cyrpto')
const { createHash } = require('crypto')
const { buffer } = require('stream/consumers')
require(dotenv).config()
const express=require('express')

const app=express()
app.use(express.json())

const {
    MID,
    BASE_URL,
    REQUEST_ENCRYPTION_KEY,
    REQUEST_SALT,
    RESPONSE_DECRYPTION_KEY,
    RESPONSE_SALT,
  } = process.env

function generateSHA215Hash(data){
    return crypto.createHash('sha512').update(data, 'utf-8').digest('hex')
}

function encryptData(data){
    const iv= crypto.randomByted(16)
    const cipher=crypto.createCipheriv('aes-256-cbc', Buffer.from(REQUEST_ENCRYPTION_KEY,'hex'), iv)

    let encrypted=cipher.update(data, 'utf-8', 'hex')
    encrypted+=cipher.final('hex')

    return iv.toString('hex')+encrypted
}

function decryptData(data){
    const iv= Buffer.from(encryptedData.slice(0,32), 'hex') //IV
    const encryptedText=encryptedData.slice(32) // rest data

    const decipher= crypto.createDicipheriv('aes-256-cbc', buffer.from(RESPONSE_DECRYPTION_KEY, 'hex'), iv)

    let decrypted=decipher.update(encryptedText, 'hex', 'utf-8')
    decrypted+=decipher.final('utf-8')

    return decrypted;
}

app.post('/create/transaction/ext', async (req,res)=>{
    const { mid, data:encryptedData } =req.body

    const decryptedData= decryptData(encryptedData)
    const decryptedJson=JSON.parse(decryptedData)
    const saltedData=REQUEST_SALT+JSON.stringify(decryptedJson)
    const computeHash=generateSHA215Hash(saltedData)

    if (computeHash!==decryptedJson.recieved_hash){
        return res.status(400).json({error:"Integrity issue"})
    }

    try{
        const response = await axios.post(URL,{
            mid: MID,
            data: encryptedData
        })
        const decryptedResponse=decryptData(response.data.data)
        const responseData=JSON.parse(decryptedResponse)

        const responseHash=generateSHA215Hash(decryptedResponse)
        if(responseHash !== response.data.sha512Hash){
            return res.status(400).json({error: 'Data Integrity Issue'})
        }

        res.json({
            message: responseData.message,
            status: responseData.status,
            statusCode: responseData.statusCode,
            data:{
                qrCode: responseData.qrCode
            }
        })
    }
    catch(error){
        console.error('Error', error)
        res.status(500).json({error:"Error occured while processing payment"})
    }
})

const port = 3000
app.listen(port, ()=>{
    console.log(`Server running at port: ${port}`)
})
