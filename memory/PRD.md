# CellControl - Product Requirements Document

## Visão Geral
Sistema multi-tenant de controle de celulares para múltiplas lojas de importados. Permite que um Super Admin gerencie várias lojas, cada uma com seu próprio domínio e dados isolados.

## Stack Tecnológica
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (multi-tenant)
- **Autenticação**: JWT

## Arquitetura Multi-Tenant
- Super Admin: Acesso em `/admin`, gerencia todas as lojas
- Admin de Loja: Acesso em `/{slug-da-loja}`, gerencia apenas sua loja
- Dados completamente isolados por loja

## Personas
1. **Super Admin**: Cria lojas, gerencia usuários, vê estatísticas globais
2. **Admin de Loja**: Gerencia estoque, clientes e realiza vendas na sua loja

## Funcionalidades Implementadas (v2.2)

### Landing Page de Seleção de Loja ✅
- [x] Página inicial em `/` para inserir domínio da loja
- [x] Validação de slug da loja via API `/api/loja/{slug}/verify`
- [x] Redirecionamento para login da loja correta
- [x] Acesso rápido ao painel Super Admin
- [x] UI elegante e responsiva

### Painel Super Admin ✅
- [x] Login separado em /admin/login
- [x] Dashboard com estatísticas globais
- [x] CRUD de Lojas (criar, ativar/desativar)
- [x] CRUD de Usuários (criar admin para cada loja)
- [x] Visualização de performance por loja
- [x] Upload de logo personalizado para lojas (URL ou arquivo)
- [x] Ferramenta de importação de dados (CSV)

### Autenticação Multi-Tenant ✅
- [x] JWT com role (super_admin, loja_admin)
- [x] Redirecionamento automático por role
- [x] Isolamento de acesso por loja
- [x] Logout com limpeza de sessão

### Painel de Loja ✅
- [x] Dashboard com estatísticas da loja
- [x] CRUD de Modelos de celulares
- [x] CRUD de Produtos (cor, memória, bateria, IMEI, preço)
- [x] CRUD de Clientes (com máscaras de CPF e WhatsApp)
- [x] Histórico do Cliente (compras e trocas)
- [x] Ponto de Venda completo com campo de garantia e desconto
- [x] Fluxo de Troca no PDV (celular recebido vai para estoque)
- [x] Histórico de Vendas com paginação
- [x] Impressão de comprovante de venda
- [x] Edição de venda (forma de pagamento e observação)
- [x] Exclusão de venda (com devolução de produtos ao estoque)
- [x] Desconto em vendas (valor em R$, exibe subtotal/desconto/total)

### Sistema de Garantias ✅ (v2.2)
- [x] Campo de garantia no Ponto de Venda (0, 1, 3, 6, 12 meses)
- [x] Cálculo automático da data de vencimento da garantia
- [x] Página dedicada de gestão de garantias (`/{slug}/garantias`)
- [x] Cards de estatísticas (Ativas, Vencendo em 30 dias, Vencidas)
- [x] Filtros por tabs (Ativas, Vencidas, Todas)
- [x] Tabela com cliente, produto, data da venda, período de garantia, vencimento e status
- [x] Busca por cliente ou produto
- [x] Paginação na lista de garantias
- [x] Status dinâmico calculado (ativa, vencida, vencendo)
- [x] Exibição de garantia no detalhe da venda (período, status, data de vencimento)

### Paginação ✅
- [x] Paginação na lista de Vendas
- [x] Paginação na lista de Clientes
- [x] Paginação na lista de Produtos
- [x] Paginação na lista de Modelos
- [x] Componente reutilizável de paginação

## Design System
- **Super Admin**: Paleta roxa (#9333EA)
- **Lojas**: Paleta dourada (#D4AF37)
- **Background**: #0A0A0A (Dark)
- **Fonte Títulos**: Outfit
- **Fonte Corpo**: Manrope

## Lojas Cadastradas

### Isaac Imports
- **URL**: /isaacimports
- **Admin**: admin@isaacimports.com / 123456
- **Status**: Ativa

## Credenciais de Acesso

### Super Admin
- **URL**: /admin/login
- **Email**: jjunyorj@gmail.com
- **Senha**: Control2@

### Isaac Imports (Loja Exemplo)
- **URL**: / → inserir "isaacimports" → /isaacimports/login
- **Email**: admin@isaacimports.com
- **Senha**: 123456

## Melhorias Futuras (Backlog)

### P0 (Crítico)
- [ ] Recuperação de senha
- [ ] Logs de atividade por loja

### P1 (Alta Prioridade)
- [x] Máscaras de input para CPF e WhatsApp nos formulários de clientes ✅
- [x] Funcionalidade de "Imprimir" na página de detalhes de vendas ✅
- [x] Sistema de Garantias ✅
- [x] Paginação em todas as listas ✅
- [ ] Dashboard com relatórios e gráficos de vendas
- [ ] Exportação de dados (CSV/Excel)
- [ ] Notificações de estoque baixo

### P2 (Média Prioridade)
- [ ] Múltiplos usuários por loja (vendedor, gerente com permissões)
- [ ] Dashboard com gráficos
- [ ] Integração WhatsApp Business

### P3 (Baixa Prioridade)
- [ ] App mobile (PWA)
- [ ] Sistema de promoções/descontos
- [ ] API pública para integrações
- [ ] Sistema de assinatura/cobrança para lojas

## Histórico de Implementação

### 2026-03-02 - v2.2 Sistema de Garantias e Desconto
- Campo de garantia no Ponto de Venda (0, 1, 3, 6, 12 meses)
- Cálculo automático de data de vencimento usando `python-dateutil`
- Nova página `/garantias` com estatísticas e gestão de garantias
- Filtros por status (ativas, vencidas, todas)
- Busca por cliente ou produto
- Paginação e ordenação inteligente
- Campo de desconto no Ponto de Venda (valor em R$)
- Exibição de subtotal, desconto e total na venda
- Exibição de garantia e desconto no detalhe da venda

### 2026-03-09 - v2.3 Layout Responsivo Mobile
- Header mobile com menu hamburger (três traços)
- Menu lateral deslizante com overlay escuro
- Layout adaptado para telas pequenas
- Tabelas com scroll horizontal no mobile
- Elementos ocultos/compactos no mobile para melhor usabilidade
- Mantida compatibilidade total com versão desktop

### 2026-02-10 - v2.1 Landing Page + P1 Features
- Landing page para seleção de loja (`/`)
- Endpoint `/api/loja/{slug}/verify` para validação
- Correção de bug com useState no Login.jsx
- Fluxo completo: Home → Verificar Loja → Login → Dashboard
- Máscaras de CPF (`123.456.789-01`) e WhatsApp (`(11) 99999-8888`)
- Funcionalidade de impressão de comprovante de venda
- Estilos CSS otimizados para impressão (A4)

### 2026-02-10 - v2.0 Multi-Tenant
- Arquitetura multi-tenant completa
- Painel Super Admin para gestão de lojas
- Criação de usuários por loja
- Isolamento de dados por loja
- Taxa de sucesso nos testes: 94.6%

### 2026-02-10 - v1.0 MVP
- Sistema single-tenant para Isaac Imports
- Dashboard, Modelos, Produtos, Clientes
- Ponto de Venda e Histórico de Vendas

## URLs do Sistema
- **Landing Page**: / (entrada principal com seleção de loja)
- **Login Loja**: /{slug}/login
- **Login Admin**: /admin/login
- **Dashboard Admin**: /admin
- **Dashboard Loja**: /{slug}
- **Garantias**: /{slug}/garantias
- **Ponto de Venda**: /{slug}/ponto-venda
- **API Base**: /api
- **API Admin**: /api/admin/*
- **API Loja**: /api/loja/{slug}/*
- **Verificar Loja**: /api/loja/{slug}/verify
