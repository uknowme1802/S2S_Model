function generateSHA215Hash(data){
    return cryptoJS.SHA512(data).toString(cryptoJS.enc.Hex)
}

function encryptData(data, key){
    const iv=crypto.lib.WordArray.random(16)
    const encrypted=cryptoJS.AES.encrypt(data, cryptoJS.enc.Hex.parse(key),{iv}).toString()

    return iv.toString()+encrypted
}

async function fetchCheckoutData() {
    const orderDetails={
        order_id: 'ORD1234519',
        transaction_amount: '900.00',
        player_id: 'CUST7892',
        player_name: 'Alice Johnson',
        player_email: 'alice.johnson@example.com',
        player_mobile: '9876543210',
        payment_method: 'UPI',
        return_url:"https://www.google.co.in"
    }

    const saltedData=process.env.REQUEST_SALT+JSON.stringify(orderDetails)

    const requestHash=generateSHA215Hash(saltedData)

    const encryptedData=encryptData(saltedData+requestHash, process.env.REQUEST_ENCRYPTION_KEY)

    try{
        const response= await fetch(URL,{
            method: 'POST',
            headers: {
                'Content-Type':'application/json'
            },
            body: JSON.stringify({
                mid:process.env.MID,
                data: encryptedData
            })
        })
        const data = await response.json()
        if(response.ok){
            const qrCodeContainer=document.getElementById("qrCodeContainer")
            const qrCodeImg=document.createElement('img')
            qrCodeImg.src=data.qrCode
            qrCodeContainer.appendChild(qrCodeImg)

            const responseHash = generateSHA215Hash(data.message+data.status)
            if(responseHash!==data.response_Hash){
                alert('Data integrity verification Failed')
            }
            const statusMessage=document.getElementById('statusMessage')
            statusMessage.innerHTML=`Status: ${data.status}(${data.status_code})<br>${data.message}`

            const MerchantName=document.getElementById('merchantName')
            MerchantName.innerHTML=`Merchant:${data.merchantName}`
        }
        else {
            document.getElementById('statusMessage').innerText='Error fetching checkout Page'
        }

    }
    catch(error){
        console.error('Error: ',error)
        document.getElementById('statusMessage').innerText='Error during checkkout process' 
    }
}

window.onload = fetchCheckoutData