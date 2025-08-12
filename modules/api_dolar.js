const request = require('request')

// https://docs.awesomeapi.com.br/

const moedas = 'USD-BRL'

// Variável global para cotação do dólar
let cotacao = 5.60; // Valor atualizado para refletir o valor real atual
let ultimaAtualizacao = null
let tentativas = 0
const MAX_TENTATIVAS = 3

// Cache para evitar múltiplas requisições simultâneas
let isUpdating = false
let updateQueue = []

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
                console.log(`Tentativa ${tentativas + 1} em 10 segundos...`)
                setTimeout(() => updateCotacao(), 10000) // Aumentado para 10 segundos
            } else {
                console.log('Máximo de tentativas atingido. Mantendo valor atual.')
            }
            isUpdating = false
            processQueue()
            return
        }
        
        if (!body) {
            console.log('API do dólar retornou resposta vazia')
            isUpdating = false
            processQueue()
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
            console.log(`Tentativa ${tentativas + 1} em 10 segundos...`)
            setTimeout(() => updateCotacao(), 10000)
        }
    }
    
    isUpdating = false
    processQueue()
}

// Função para processar fila de atualizações
function processQueue() {
    if (updateQueue.length > 0 && !isUpdating) {
        const callback = updateQueue.shift()
        if (callback) callback()
    }
}

// Função para obter a cotação atual
function getCotacao() {
    // Se a cotação não foi atualizada há mais de 2 horas, tenta atualizar
    if (!ultimaAtualizacao || (new Date() - ultimaAtualizacao) > 7200000) {
        updateCotacao()
    }
    return cotacao
}

// Função para atualizar a cotação manualmente
function updateCotacao() {
    if (isUpdating) {
        // Se já está atualizando, adiciona à fila
        updateQueue.push(() => updateCotacao())
        return
    }
    
    isUpdating = true
    console.log('Atualizando cotação do dólar...')
    request(options, callback_dolar)
}

// Função para definir a cotação manualmente (útil para produção)
function setCotacaoManual(valor) {
    if (typeof valor === 'number' && valor > 0) {
        cotacao = valor
        ultimaAtualizacao = new Date()
        console.log('Cotação do dólar definida manualmente:', cotacao)
        return true
    }
    return false
}

// Função para obter informações da última atualização
function getInfoAtualizacao() {
    return {
        cotacao: cotacao,
        ultimaAtualizacao: ultimaAtualizacao,
        tentativas: tentativas,
        isUpdating: isUpdating,
        queueLength: updateQueue.length
    }
}

// Atualização automática a cada 1 hora (reduzido para evitar rate limiting)
setInterval(() => {
    updateCotacao()
}, 60 * 60 * 1000)

// Primeira atualização ao carregar o módulo (com delay para evitar sobrecarga)
setTimeout(() => {
    updateCotacao()
}, 5000)

module.exports = {
    getCotacao,
    updateCotacao,
    setCotacaoManual,
    getInfoAtualizacao,
    cotacao
}