const request = require('request')

// https://docs.awesomeapi.com.br/

const moedas = 'USD-BRL'

// Variável global para cotação do dólar
let cotacao = 5.60; // Valor atualizado para refletir o valor real atual
let ultimaAtualizacao = null
let tentativas = 0
const MAX_TENTATIVAS = 3

// request{options, callback}

const options = {
    url: `https://economia.awesomeapi.com.br/last/${moedas}`,
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    timeout: 15000 // 15 segundos de timeout
}

const callback_dolar = function(erro, res, body){
    try {
        if (erro) {
            console.log('Erro na API do dólar:', erro.message)
            tentativas++
            if (tentativas < MAX_TENTATIVAS) {
                console.log(`Tentativa ${tentativas + 1} em 5 segundos...`)
                setTimeout(() => updateCotacao(), 5000)
            }
            return
        }
        
        if (!body) {
            console.log('API do dólar retornou resposta vazia')
            return
        }
        
        let json = JSON.parse(body)
        if (json && json.USDBRL && json.USDBRL.bid) {
            const novaCotacao = parseFloat(json.USDBRL['bid'])
            if (novaCotacao > 0) {
                cotacao = novaCotacao
                ultimaAtualizacao = new Date()
                tentativas = 0
                console.log('Cotação do dólar atualizada:', cotacao)
            } else {
                console.log('Valor da cotação inválido recebido da API')
            }
        } else {
            console.log('Formato de resposta da API do dólar inesperado:', JSON.stringify(json))
        }
    } catch (parseError) {
        console.log('Erro ao processar resposta da API do dólar:', parseError.message)
        tentativas++
        if (tentativas < MAX_TENTATIVAS) {
            console.log(`Tentativa ${tentativas + 1} em 5 segundos...`)
            setTimeout(() => updateCotacao(), 5000)
        }
    }
}

// Função para obter a cotação atual
function getCotacao() {
    // Se a cotação não foi atualizada há mais de 1 hora, tenta atualizar
    if (!ultimaAtualizacao || (new Date() - ultimaAtualizacao) > 3600000) {
        updateCotacao()
    }
    return cotacao
}

// Função para atualizar a cotação manualmente
function updateCotacao() {
    console.log('Atualizando cotação do dólar...')
    request(options, callback_dolar)
}

// Função para obter informações da última atualização
function getInfoAtualizacao() {
    return {
        cotacao: cotacao,
        ultimaAtualizacao: ultimaAtualizacao,
        tentativas: tentativas
    }
}

// Atualização automática a cada 30 minutos
setInterval(() => {
    updateCotacao()
}, 30 * 60 * 1000)

// Primeira atualização ao carregar o módulo
updateCotacao()

module.exports = {
    getCotacao,
    updateCotacao,
    getInfoAtualizacao,
    cotacao
}