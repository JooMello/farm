const quantidadeInput = document.getElementById('quantidade');
const valorInput = document.getElementById('valor');
const compraTable = document.getElementById('compraTable');

quantidadeInput.addEventListener('input', updateCompraTable);
valorInput.addEventListener('input', updateCompraTable);

function updateCompraTable() {
  const quantidade = parseInt(quantidadeInput.value) || 0;
  const valor = parseCurrency(valorInput.value) || 0;

  // Limpa a tabela atual
  compraTable.querySelector('tbody').innerHTML = '';

  // Verifica se a tabela deve ser exibida
  if (quantidade > 0 && valor > 0) {
    compraTable.style.display = 'table';
    // Preenche a tabela com base nos valores de quantidade e valor
    for (let i = 1; i <= quantidade; i++) {
      const newRow = compraTable.querySelector('tbody').insertRow();
      newRow.insertCell(0).innerHTML = `<input type="text" name="brinco${i}" placeholder="Brinco ${i}" />`;
      newRow.insertCell(1).innerHTML = `<input type="text" name="valor${i}" placeholder="Valor ${i}" value="${(valor / quantidade).toFixed(2)}" />`;
      newRow.insertCell(2).innerHTML = `<input type="text" name="peso${i}" placeholder="Peso ${i}" />`;
    }
  } else {
    compraTable.style.display = 'none';
  }
}

function parseCurrency(currencyString) {
  // Remove todos os caracteres não numéricos do valor de entrada
  const valorNumerico = currencyString.replace(/[^\d]/g, '');
  // Converte o valor em um número de ponto flutuante
  return parseFloat(valorNumerico) / 100;
}

// Chama a função inicialmente para verificar os valores iniciais
updateCompraTable();