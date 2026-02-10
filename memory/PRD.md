# Isaac Imports - Product Requirements Document

## Visão Geral
Sistema de controle de celulares para lojas de importados, permitindo gestão completa de estoque, clientes e vendas.

## Stack Tecnológica
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Autenticação**: JWT

## Personas
1. **Lojista/Admin**: Gerencia estoque, clientes e realiza vendas
2. **Funcionário**: Acessa o ponto de venda e cadastra produtos

## Funcionalidades Implementadas (v1.0)

### Autenticação ✅
- [x] Login com email/senha
- [x] JWT token com expiração 24h
- [x] Logout com limpeza de sessão
- [x] Usuário padrão: admin@isaac.com / 123456

### Dashboard ✅
- [x] Cards com estatísticas (modelos, produtos, clientes, vendas)
- [x] Lista de modelos sem estoque
- [x] Top modelos mais vendidos (com filtro por mês)
- [x] Lista de modelos com estoque

### Modelos de Celulares ✅
- [x] Listagem com busca
- [x] Criar modelo
- [x] Editar modelo
- [x] Excluir modelo (se não houver produtos vinculados)
- [x] Ver detalhes com produtos

### Produtos ✅
- [x] Listagem com busca e filtro por modelo
- [x] Criar produto (cor, memória, bateria, IMEI, preço)
- [x] Editar produto
- [x] Excluir produto
- [x] Validação: cor e memória obrigatórios

### Clientes ✅
- [x] Listagem com busca
- [x] Criar cliente (nome, CPF, WhatsApp)
- [x] Editar cliente
- [x] Excluir cliente
- [x] Validação: CPF 11 dígitos, WhatsApp 10-11 dígitos
- [x] Máscara de formatação

### Ponto de Venda ✅
- [x] Busca e seleção de cliente
- [x] Busca e adição de produtos ao carrinho
- [x] Remoção de produtos do carrinho
- [x] Cálculo automático do total
- [x] Seleção de forma de pagamento
- [x] Campo de observação
- [x] Finalização da venda

### Vendas ✅
- [x] Listagem com busca
- [x] Detalhes da venda
- [x] Itens vendidos
- [x] Informações do cliente
- [x] Botão imprimir

## Design System
- **Cor Primária**: #D4AF37 (Dourado)
- **Background**: #0A0A0A (Dark)
- **Fonte Títulos**: Outfit
- **Fonte Corpo**: Manrope
- **Tema**: Dark Luxury

## Melhorias Futuras (Backlog)

### P0 (Crítico)
- [ ] Relatórios de vendas por período
- [ ] Backup automático dos dados

### P1 (Alta Prioridade)
- [ ] Múltiplos usuários com níveis de acesso
- [ ] Histórico de compras por cliente
- [ ] Notificações de estoque baixo
- [ ] Impressão de recibo de venda

### P2 (Média Prioridade)
- [ ] Gráficos no dashboard (vendas por dia/mês)
- [ ] Exportação de dados (CSV/Excel)
- [ ] Cadastro de fornecedores
- [ ] Controle de garantia dos produtos

### P3 (Baixa Prioridade)
- [ ] App mobile (PWA)
- [ ] Integração com WhatsApp Business
- [ ] Sistema de promoções/descontos

## Histórico de Implementação

### 2026-02-10 - v1.0 MVP
- Implementação completa do sistema
- Dashboard com estatísticas
- CRUD de Modelos, Produtos, Clientes
- Ponto de Venda funcional
- Histórico de Vendas
- Design Dark Luxury com paleta dourada
- Autenticação JWT
- Taxa de sucesso nos testes: 97.6%

## Credenciais de Acesso
- **Email**: admin@isaac.com
- **Senha**: 123456

## URLs
- **Frontend**: https://cellphonecontrol.preview.emergentagent.com
- **API**: https://cellphonecontrol.preview.emergentagent.com/api
