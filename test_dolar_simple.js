const apiDolar = require('./modules/api_dolar.js')

console.log('=== Teste Simples da API do Dólar ===')

// Aguarda 3 segundos para a API carregar
setTimeout(() => {
    console.log('Cotação atual:', apiDolar.getCotacao())
    console.log('Informações:', apiDolar.getInfoAtualizacao())
    
    // Testa definir valor manualmente
    console.log('\nTestando definição manual...')
    if (apiDolar.setCotacaoManual(5.75)) {
        console.log('Valor definido com sucesso!')
        console.log('Nova cotação:', apiDolar.getCotacao())
    } else {
        console.log('Erro ao definir valor')
    }
    
    console.log('\nTeste concluído!')
}, 3000)
