# Guia de Testes - Mercado Pago Sandbox

## Cartões de Teste do Mercado Pago

No ambiente Sandbox, você precisa usar cartões de teste específicos com dados corretos.

### Cartões Válidos para Teste:

#### Mastercard (Aprovado)
- **Número:** `5031 4332 1540 6351`
- **CVV:** `123`
- **Vencimento:** Qualquer data futura (ex: `11/30`)
- **Nome:** `APRO` (obrigatório para aprovação)
- **CPF:** `12345678909` ou qualquer CPF válido

#### Visa (Aprovado)
- **Número:** `4509 9535 6623 3704`
- **CVV:** `123`
- **Vencimento:** Qualquer data futura
- **Nome:** `APRO`
- **CPF:** `12345678909`

#### Mastercard (Recusado - para testar recusas)
- **Número:** `5031 4332 1540 6351`
- **CVV:** `123`
- **Vencimento:** Qualquer data futura
- **Nome:** `OTOR` (causa recusa)
- **CPF:** `12345678909`

#### Visa (Recusado)
- **Número:** `4509 9535 6623 3704`
- **CVV:** `123`
- **Vencimento:** Qualquer data futura
- **Nome:** `OTOR`
- **CPF:** `12345678909`

### ⚠️ IMPORTANTE:

1. **Nome do Titular:** 
   - Use `APRO` para pagamentos aprovados
   - Use `OTOR` para pagamentos recusados
   - Use `CONT` para pagamentos pendentes

2. **CPF:** Pode ser qualquer CPF válido (ex: `12345678909`)

3. **Ambiente:** Certifique-se de estar usando credenciais de **TESTE** (Sandbox)

## Como Testar:

1. No PDV, adicione produtos ao carrinho
2. Selecione "Cartão"
3. Clique em "Finalizar Venda"
4. Preencha o modal com os dados do cartão de teste:
   - Número: `5031 4332 1540 6351`
   - Nome: `APRO` (obrigatório!)
   - Vencimento: `11/30`
   - CVV: `123`
   - CPF: `12345678909`
5. Clique em "Pagar"
6. Você será redirecionado para o Checkout Pro do Mercado Pago
7. Complete o pagamento lá

## Problemas Comuns:

### Erro: "Não foi possível processar seu pagamento"
- ✅ Verifique se o nome do titular é `APRO` (para aprovação)
- ✅ Verifique se está usando um cartão de teste válido
- ✅ Verifique se está no ambiente Sandbox (não produção)

### Pagamento não aparece no histórico
- No Sandbox, os pagamentos podem não aparecer na interface normal
- Use o painel do desenvolvedor: https://www.mercadopago.com.br/developers/panel
- Vá em "Suas integrações" > "Pagamentos"

## Documentação Oficial:
https://www.mercadopago.com.br/developers/pt/docs/checkout-api-v2/integration-test/cards

