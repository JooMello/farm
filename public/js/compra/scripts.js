<<<<<<< HEAD
quantidade.addEventListener('input', event => {
    var quantidadeValue = event.target.value


  unitario.addEventListener('input', event => {
    var unitarioValue = event.target.value

  
    var totalValue = (Number(quantidadeValue) * Number(unitarioValue))
    console.log(totalValue)
    document.getElementById('total').value = totalValue;


  })
=======
quantidade.addEventListener('input', event => {
    var quantidadeValue = event.target.value


  unitario.addEventListener('input', event => {
    var unitarioValue = event.target.value

  
    var totalValue = (Number(quantidadeValue) * Number(unitarioValue))
    console.log(totalValue)
    document.getElementById('total').value = totalValue;


  })
>>>>>>> 6360fe71f8adf10a2d666b75cdc64dac17910426
})