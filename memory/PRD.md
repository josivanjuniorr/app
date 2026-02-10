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

## Funcionalidades Implementadas (v2.1)

### Landing Page de Seleção de Loja ✅ (NOVO)
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

### Autenticação Multi-Tenant ✅
- [x] JWT com role (super_admin, loja_admin)
- [x] Redirecionamento automático por role
- [x] Isolamento de acesso por loja
- [x] Logout com limpeza de sessão

### Painel de Loja ✅
- [x] Dashboard com estatísticas da loja
- [x] CRUD de Modelos de celulares
- [x] CRUD de Produtos (cor, memória, bateria, IMEI, preço)
- [x] CRUD de Clientes (validação CPF/WhatsApp)
- [x] Ponto de Venda completo
- [x] Histórico de Vendas

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
- **Email**: superadmin@cellcontrol.com
- **Senha**: admin123

### Isaac Imports (Loja Exemplo)
- **URL**: /login -> /isaacimports
- **Email**: admin@isaacimports.com
- **Senha**: 123456

## Melhorias Futuras (Backlog)

### P0 (Crítico)
- [ ] Recuperação de senha
- [ ] Logs de atividade por loja

### P1 (Alta Prioridade)
- [ ] Máscaras de input para CPF e WhatsApp nos formulários de clientes
- [ ] Funcionalidade de "Imprimir" na página de detalhes de vendas
- [ ] Relatórios de vendas por período
- [ ] Exportação de dados (CSV/Excel)
- [ ] Notificações de estoque baixo

### P2 (Média Prioridade)
- [ ] Múltiplos usuários por loja (vendedor, gerente)
- [ ] Dashboard com gráficos
- [ ] Integração WhatsApp Business

### P3 (Baixa Prioridade)
- [ ] App mobile (PWA)
- [ ] Sistema de promoções/descontos
- [ ] API pública para integrações

## Histórico de Implementação

### 2026-02-10 - v2.1 Landing Page
- Landing page para seleção de loja (`/`)
- Endpoint `/api/loja/{slug}/verify` para validação
- Correção de bug com useState no Login.jsx
- Fluxo completo: Home → Verificar Loja → Login → Dashboard

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
- **Login Loja**: /login
- **Login Admin**: /admin/login
- **Dashboard Admin**: /admin
- **Dashboard Loja**: /{slug-da-loja}
- **API Base**: /api
- **API Admin**: /api/admin/*
- **API Loja**: /api/loja/{slug}/*
