const request = require('request')

// https://docs.awesomeapi.com.br/

const moedas =  '78110002'

// request{options, callback}


const options = {
    url: `https://cep.awesomeapi.com.br/json/${moedas}`,
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8'
    },
}

const callback_cep = function(erro, res, body){
    let json = JSON.parse(body)
   // console.log(json)
}

const cep = request(options, callback_cep)

module.exports = cep;