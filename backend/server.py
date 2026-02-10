from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import json
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'cellcontrol_secret_key_2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

security = HTTPBearer()

# Create the main app
app = FastAPI(title="CellControl API")

# Create routers
api_router = APIRouter(prefix="/api")
admin_router = APIRouter(prefix="/api/admin")
loja_router = APIRouter(prefix="/api/loja")

# ============== PYDANTIC MODELS ==============

# Loja (Store)
class LojaBase(BaseModel):
    nome: str
    slug: str

class LojaCreate(LojaBase):
    pass

class LojaUpdate(BaseModel):
    nome: Optional[str] = None
    ativo: Optional[bool] = None

class Loja(LojaBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ativo: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LojaWithStats(Loja):
    total_modelos: int = 0
    total_produtos: int = 0
    total_clientes: int = 0
    total_vendas: int = 0
    valor_total_vendas: float = 0

# Usuario
class UsuarioBase(BaseModel):
    email: str
    nome: str

class UsuarioCreate(UsuarioBase):
    senha: str
    role: str = "loja_admin"  # super_admin, loja_admin
    loja_id: Optional[str] = None

class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    senha: Optional[str] = None
    ativo: Optional[bool] = None

class Usuario(UsuarioBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str = "loja_admin"
    loja_id: Optional[str] = None
    ativo: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UsuarioResponse(Usuario):
    loja_nome: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    senha: str

class LoginResponse(BaseModel):
    token: str
    user_id: str
    user_email: str
    user_nome: str
    role: str
    loja_id: Optional[str] = None
    loja_slug: Optional[str] = None

# Modelo
class ModeloBase(BaseModel):
    nome: str

class ModeloCreate(ModeloBase):
    pass

class Modelo(ModeloBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    loja_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ModeloWithQuantity(Modelo):
    quantidade_produtos: int = 0

# Produto
class ProdutoBase(BaseModel):
    modelo_id: str
    cor: str
    memoria: str
    bateria: Optional[int] = None
    imei: Optional[str] = None
    preco: float

class ProdutoCreate(ProdutoBase):
    pass

class ProdutoUpdate(BaseModel):
    cor: Optional[str] = None
    memoria: Optional[str] = None
    bateria: Optional[int] = None
    imei: Optional[str] = None
    preco: Optional[float] = None

class Produto(ProdutoBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    loja_id: str
    vendido: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProdutoWithModelo(Produto):
    modelo_nome: Optional[str] = None

# Cliente
class ClienteBase(BaseModel):
    nome: str
    cpf: str
    whatsapp: str
    email: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None

class ClienteCreate(ClienteBase):
    pass

class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    cpf: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None

class Cliente(ClienteBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    loja_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Venda
class VendaItem(BaseModel):
    produto_id: str
    modelo_id: str
    modelo_nome: str
    cor: str
    memoria: str
    preco: float

class VendaCreate(BaseModel):
    cliente_id: str
    produtos: List[str]
    forma_pagamento: str
    observacao: Optional[str] = None

class VendaConcluida(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    loja_id: str
    data: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    itens: str
    valor_total: float
    cliente_id: str
    forma_pagamento: str
    observacao: Optional[str] = None

class VendaConcluidaResponse(VendaConcluida):
    cliente_nome: Optional[str] = None
    itens_parsed: Optional[List[VendaItem]] = None

# Dashboard
class DashboardStats(BaseModel):
    total_modelos: int
    total_produtos: int
    total_clientes: int
    total_vendas: int
    valor_total_vendas: float
    modelos_com_estoque: List[ModeloWithQuantity]
    modelos_sem_estoque: List[Modelo]
    top_modelos: List[dict]

class AdminDashboardStats(BaseModel):
    total_lojas: int
    lojas_ativas: int
    total_usuarios: int
    total_vendas_global: int
    valor_total_global: float
    lojas: List[LojaWithStats]

# ============== HELPER FUNCTIONS ==============

def create_token(user_id: str, user_email: str, role: str, loja_id: Optional[str] = None) -> str:
    payload = {
        "user_id": user_id,
        "user_email": user_email,
        "role": role,
        "loja_id": loja_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

def require_super_admin(payload: dict = Depends(verify_token)):
    if payload.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Acesso negado. Requer super admin.")
    return payload

def require_loja_access(payload: dict = Depends(verify_token)):
    if payload.get("role") == "super_admin":
        return payload
    if not payload.get("loja_id"):
        raise HTTPException(status_code=403, detail="Acesso negado. Usuário não vinculado a uma loja.")
    return payload

async def get_loja_by_slug(slug: str):
    loja = await db.lojas.find_one({"slug": slug, "ativo": True}, {"_id": 0})
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    return loja

async def verify_loja_access(slug: str, payload: dict):
    loja = await get_loja_by_slug(slug)
    if payload.get("role") != "super_admin" and payload.get("loja_id") != loja["id"]:
        raise HTTPException(status_code=403, detail="Acesso negado a esta loja")
    return loja

def validate_cpf(cpf: str) -> bool:
    cpf_clean = re.sub(r'\D', '', cpf)
    return len(cpf_clean) == 11

def validate_whatsapp(whatsapp: str) -> bool:
    whatsapp_clean = re.sub(r'\D', '', whatsapp)
    return len(whatsapp_clean) in [10, 11]

def generate_slug(nome: str) -> str:
    slug = nome.lower().strip()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '', slug)
    return slug

# ============== AUTH ROUTES ==============

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user = await db.usuarios.find_one({"email": request.email, "ativo": True}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if user["senha"] != request.senha:
        raise HTTPException(status_code=401, detail="Senha incorreta.")
    
    loja_slug = None
    if user.get("loja_id"):
        loja = await db.lojas.find_one({"id": user["loja_id"]}, {"_id": 0})
        if loja:
            loja_slug = loja["slug"]
    
    token = create_token(user["id"], user["email"], user["role"], user.get("loja_id"))
    return LoginResponse(
        token=token, 
        user_id=user["id"], 
        user_email=user["email"],
        user_nome=user["nome"],
        role=user["role"],
        loja_id=user.get("loja_id"),
        loja_slug=loja_slug
    )

@api_router.get("/auth/me")
async def get_current_user(payload: dict = Depends(verify_token)):
    user = await db.usuarios.find_one({"id": payload["user_id"]}, {"_id": 0, "senha": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    loja_slug = None
    if user.get("loja_id"):
        loja = await db.lojas.find_one({"id": user["loja_id"]}, {"_id": 0})
        if loja:
            loja_slug = loja["slug"]
    
    return {**user, "loja_slug": loja_slug}

# ============== ADMIN ROUTES ==============

@admin_router.get("/dashboard", response_model=AdminDashboardStats)
async def admin_dashboard(payload: dict = Depends(require_super_admin)):
    lojas = await db.lojas.find({}, {"_id": 0}).to_list(1000)
    total_lojas = len(lojas)
    lojas_ativas = len([l for l in lojas if l.get("ativo", True)])
    total_usuarios = await db.usuarios.count_documents({})
    
    # Calculate global stats
    vendas = await db.vendas_concluidas.find({}, {"_id": 0}).to_list(10000)
    total_vendas_global = len(vendas)
    valor_total_global = sum(v.get("valor_total", 0) for v in vendas)
    
    # Stats per store
    lojas_with_stats = []
    for loja in lojas:
        loja_id = loja["id"]
        total_modelos = await db.modelos.count_documents({"loja_id": loja_id})
        total_produtos = await db.produtos.count_documents({"loja_id": loja_id, "vendido": False})
        total_clientes = await db.clientes.count_documents({"loja_id": loja_id})
        loja_vendas = [v for v in vendas if v.get("loja_id") == loja_id]
        total_vendas = len(loja_vendas)
        valor_total = sum(v.get("valor_total", 0) for v in loja_vendas)
        
        lojas_with_stats.append(LojaWithStats(
            **loja,
            total_modelos=total_modelos,
            total_produtos=total_produtos,
            total_clientes=total_clientes,
            total_vendas=total_vendas,
            valor_total_vendas=valor_total
        ))
    
    return AdminDashboardStats(
        total_lojas=total_lojas,
        lojas_ativas=lojas_ativas,
        total_usuarios=total_usuarios,
        total_vendas_global=total_vendas_global,
        valor_total_global=valor_total_global,
        lojas=lojas_with_stats
    )

@admin_router.get("/lojas", response_model=List[LojaWithStats])
async def list_lojas(payload: dict = Depends(require_super_admin)):
    lojas = await db.lojas.find({}, {"_id": 0}).to_list(1000)
    vendas = await db.vendas_concluidas.find({}, {"_id": 0}).to_list(10000)
    
    result = []
    for loja in lojas:
        loja_id = loja["id"]
        total_modelos = await db.modelos.count_documents({"loja_id": loja_id})
        total_produtos = await db.produtos.count_documents({"loja_id": loja_id, "vendido": False})
        total_clientes = await db.clientes.count_documents({"loja_id": loja_id})
        loja_vendas = [v for v in vendas if v.get("loja_id") == loja_id]
        
        result.append(LojaWithStats(
            **loja,
            total_modelos=total_modelos,
            total_produtos=total_produtos,
            total_clientes=total_clientes,
            total_vendas=len(loja_vendas),
            valor_total_vendas=sum(v.get("valor_total", 0) for v in loja_vendas)
        ))
    return result

@admin_router.post("/lojas", response_model=Loja)
async def create_loja(loja: LojaCreate, payload: dict = Depends(require_super_admin)):
    slug = generate_slug(loja.slug) if loja.slug else generate_slug(loja.nome)
    
    existing = await db.lojas.find_one({"slug": slug}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Já existe uma loja com este slug")
    
    loja_obj = Loja(nome=loja.nome, slug=slug)
    doc = loja_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.lojas.insert_one(doc)
    return loja_obj

@admin_router.get("/lojas/{loja_id}", response_model=LojaWithStats)
async def get_loja(loja_id: str, payload: dict = Depends(require_super_admin)):
    loja = await db.lojas.find_one({"id": loja_id}, {"_id": 0})
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    
    total_modelos = await db.modelos.count_documents({"loja_id": loja_id})
    total_produtos = await db.produtos.count_documents({"loja_id": loja_id, "vendido": False})
    total_clientes = await db.clientes.count_documents({"loja_id": loja_id})
    vendas = await db.vendas_concluidas.find({"loja_id": loja_id}, {"_id": 0}).to_list(10000)
    
    return LojaWithStats(
        **loja,
        total_modelos=total_modelos,
        total_produtos=total_produtos,
        total_clientes=total_clientes,
        total_vendas=len(vendas),
        valor_total_vendas=sum(v.get("valor_total", 0) for v in vendas)
    )

@admin_router.put("/lojas/{loja_id}", response_model=Loja)
async def update_loja(loja_id: str, loja: LojaUpdate, payload: dict = Depends(require_super_admin)):
    update_data = {k: v for k, v in loja.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    result = await db.lojas.update_one({"id": loja_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    
    updated = await db.lojas.find_one({"id": loja_id}, {"_id": 0})
    return Loja(**updated)

@admin_router.get("/usuarios", response_model=List[UsuarioResponse])
async def list_usuarios(payload: dict = Depends(require_super_admin)):
    usuarios = await db.usuarios.find({}, {"_id": 0, "senha": 0}).to_list(1000)
    result = []
    for user in usuarios:
        loja_nome = None
        if user.get("loja_id"):
            loja = await db.lojas.find_one({"id": user["loja_id"]}, {"_id": 0})
            if loja:
                loja_nome = loja["nome"]
        # Ensure nome field exists (backward compatibility)
        if "nome" not in user:
            user["nome"] = user.get("email", "").split("@")[0]
        result.append(UsuarioResponse(**user, loja_nome=loja_nome))
    return result

@admin_router.post("/usuarios", response_model=UsuarioResponse)
async def create_usuario(usuario: UsuarioCreate, payload: dict = Depends(require_super_admin)):
    existing = await db.usuarios.find_one({"email": usuario.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Já existe um usuário com este email")
    
    if usuario.role == "loja_admin" and not usuario.loja_id:
        raise HTTPException(status_code=400, detail="Usuário de loja deve ter loja_id")
    
    if usuario.loja_id:
        loja = await db.lojas.find_one({"id": usuario.loja_id}, {"_id": 0})
        if not loja:
            raise HTTPException(status_code=404, detail="Loja não encontrada")
    
    user_obj = Usuario(
        email=usuario.email,
        nome=usuario.nome,
        role=usuario.role,
        loja_id=usuario.loja_id
    )
    doc = user_obj.model_dump()
    doc['senha'] = usuario.senha
    doc['created_at'] = doc['created_at'].isoformat()
    await db.usuarios.insert_one(doc)
    
    loja_nome = None
    if usuario.loja_id:
        loja = await db.lojas.find_one({"id": usuario.loja_id}, {"_id": 0})
        if loja:
            loja_nome = loja["nome"]
    
    return UsuarioResponse(**user_obj.model_dump(), loja_nome=loja_nome)

@admin_router.put("/usuarios/{user_id}", response_model=UsuarioResponse)
async def update_usuario(user_id: str, usuario: UsuarioUpdate, payload: dict = Depends(require_super_admin)):
    update_data = {k: v for k, v in usuario.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    result = await db.usuarios.update_one({"id": user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    updated = await db.usuarios.find_one({"id": user_id}, {"_id": 0, "senha": 0})
    loja_nome = None
    if updated.get("loja_id"):
        loja = await db.lojas.find_one({"id": updated["loja_id"]}, {"_id": 0})
        if loja:
            loja_nome = loja["nome"]
    
    return UsuarioResponse(**updated, loja_nome=loja_nome)

@admin_router.delete("/usuarios/{user_id}")
async def delete_usuario(user_id: str, payload: dict = Depends(require_super_admin)):
    result = await db.usuarios.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"message": "Usuário excluído com sucesso"}

# ============== LOJA ROUTES ==============

@loja_router.get("/{slug}/dashboard", response_model=DashboardStats)
async def loja_dashboard(slug: str, mes: Optional[str] = None, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    loja_id = loja["id"]
    
    total_modelos = await db.modelos.count_documents({"loja_id": loja_id})
    total_produtos = await db.produtos.count_documents({"loja_id": loja_id, "vendido": False})
    total_clientes = await db.clientes.count_documents({"loja_id": loja_id})
    total_vendas = await db.vendas_concluidas.count_documents({"loja_id": loja_id})
    
    vendas = await db.vendas_concluidas.find({"loja_id": loja_id}, {"_id": 0}).to_list(1000)
    valor_total_vendas = sum(v.get("valor_total", 0) for v in vendas)
    
    modelos = await db.modelos.find({"loja_id": loja_id}, {"_id": 0}).to_list(1000)
    modelos_com_estoque = []
    modelos_sem_estoque = []
    
    for modelo in modelos:
        count = await db.produtos.count_documents({"modelo_id": modelo["id"], "vendido": False})
        modelo_with_qty = ModeloWithQuantity(**modelo, quantidade_produtos=count)
        if count > 0:
            modelos_com_estoque.append(modelo_with_qty)
        else:
            modelos_sem_estoque.append(Modelo(**modelo))
    
    # Top models
    modelo_sales = {}
    filtered_vendas = vendas
    if mes:
        filtered_vendas = [v for v in vendas if v.get("data", "").startswith(mes)]
    
    for venda in filtered_vendas:
        try:
            itens = json.loads(venda.get("itens", "[]"))
            for item in itens:
                modelo_id = item.get("modelo_id")
                modelo_nome = item.get("modelo_nome", "")
                if modelo_id:
                    if modelo_id not in modelo_sales:
                        modelo_sales[modelo_id] = {"nome": modelo_nome, "quantidade": 0, "valor": 0}
                    modelo_sales[modelo_id]["quantidade"] += 1
                    modelo_sales[modelo_id]["valor"] += item.get("preco", 0)
        except:
            pass
    
    top_modelos = [
        {"modelo_id": k, **v} 
        for k, v in sorted(modelo_sales.items(), key=lambda x: x[1]["quantidade"], reverse=True)[:10]
    ]
    
    return DashboardStats(
        total_modelos=total_modelos,
        total_produtos=total_produtos,
        total_clientes=total_clientes,
        total_vendas=total_vendas,
        valor_total_vendas=valor_total_vendas,
        modelos_com_estoque=modelos_com_estoque,
        modelos_sem_estoque=modelos_sem_estoque,
        top_modelos=top_modelos
    )

# Verify store exists (public endpoint)
@loja_router.get("/{slug}/verify")
async def verify_loja(slug: str):
    loja = await db.lojas.find_one({"slug": slug, "ativo": True}, {"_id": 0})
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    return {"exists": True, "nome": loja["nome"], "slug": loja["slug"]}

# Modelos
@loja_router.get("/{slug}/modelos", response_model=List[ModeloWithQuantity])
async def list_modelos(slug: str, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    modelos = await db.modelos.find({"loja_id": loja["id"]}, {"_id": 0}).to_list(1000)
    result = []
    for modelo in modelos:
        count = await db.produtos.count_documents({"modelo_id": modelo["id"], "vendido": False})
        result.append(ModeloWithQuantity(**modelo, quantidade_produtos=count))
    return result

@loja_router.post("/{slug}/modelos", response_model=Modelo)
async def create_modelo(slug: str, modelo: ModeloCreate, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    modelo_obj = Modelo(nome=modelo.nome, loja_id=loja["id"])
    doc = modelo_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.modelos.insert_one(doc)
    return modelo_obj

@loja_router.get("/{slug}/modelos/{modelo_id}", response_model=ModeloWithQuantity)
async def get_modelo(slug: str, modelo_id: str, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    modelo = await db.modelos.find_one({"id": modelo_id, "loja_id": loja["id"]}, {"_id": 0})
    if not modelo:
        raise HTTPException(status_code=404, detail="Modelo não encontrado")
    count = await db.produtos.count_documents({"modelo_id": modelo_id, "vendido": False})
    return ModeloWithQuantity(**modelo, quantidade_produtos=count)

@loja_router.put("/{slug}/modelos/{modelo_id}", response_model=Modelo)
async def update_modelo(slug: str, modelo_id: str, modelo: ModeloCreate, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    result = await db.modelos.update_one(
        {"id": modelo_id, "loja_id": loja["id"]}, 
        {"$set": {"nome": modelo.nome}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Modelo não encontrado")
    updated = await db.modelos.find_one({"id": modelo_id}, {"_id": 0})
    return Modelo(**updated)

@loja_router.delete("/{slug}/modelos/{modelo_id}")
async def delete_modelo(slug: str, modelo_id: str, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    count = await db.produtos.count_documents({"modelo_id": modelo_id})
    if count > 0:
        raise HTTPException(status_code=400, detail="Não é possível excluir modelo com produtos vinculados")
    result = await db.modelos.delete_one({"id": modelo_id, "loja_id": loja["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Modelo não encontrado")
    return {"message": "Modelo excluído com sucesso"}

# Produtos
@loja_router.get("/{slug}/produtos", response_model=List[ProdutoWithModelo])
async def list_produtos(slug: str, modelo_id: Optional[str] = None, vendido: Optional[bool] = None, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    query = {"loja_id": loja["id"]}
    if modelo_id:
        query["modelo_id"] = modelo_id
    if vendido is not None:
        query["vendido"] = vendido
    
    produtos = await db.produtos.find(query, {"_id": 0}).to_list(1000)
    result = []
    for produto in produtos:
        modelo = await db.modelos.find_one({"id": produto["modelo_id"]}, {"_id": 0})
        modelo_nome = modelo["nome"] if modelo else "Modelo removido"
        result.append(ProdutoWithModelo(**produto, modelo_nome=modelo_nome))
    return result

@loja_router.post("/{slug}/produtos", response_model=Produto)
async def create_produto(slug: str, produto: ProdutoCreate, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    if not produto.cor or not produto.memoria:
        raise HTTPException(status_code=400, detail="Cor e memória são obrigatórios")
    
    modelo = await db.modelos.find_one({"id": produto.modelo_id, "loja_id": loja["id"]}, {"_id": 0})
    if not modelo:
        raise HTTPException(status_code=404, detail="Modelo não encontrado")
    
    produto_obj = Produto(**produto.model_dump(), loja_id=loja["id"])
    doc = produto_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.produtos.insert_one(doc)
    return produto_obj

@loja_router.get("/{slug}/produtos/{produto_id}", response_model=ProdutoWithModelo)
async def get_produto(slug: str, produto_id: str, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    produto = await db.produtos.find_one({"id": produto_id, "loja_id": loja["id"]}, {"_id": 0})
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    modelo = await db.modelos.find_one({"id": produto["modelo_id"]}, {"_id": 0})
    modelo_nome = modelo["nome"] if modelo else "Modelo removido"
    return ProdutoWithModelo(**produto, modelo_nome=modelo_nome)

@loja_router.put("/{slug}/produtos/{produto_id}", response_model=Produto)
async def update_produto(slug: str, produto_id: str, produto: ProdutoUpdate, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    update_data = {k: v for k, v in produto.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    result = await db.produtos.update_one(
        {"id": produto_id, "loja_id": loja["id"]}, 
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    updated = await db.produtos.find_one({"id": produto_id}, {"_id": 0})
    return Produto(**updated)

@loja_router.delete("/{slug}/produtos/{produto_id}")
async def delete_produto(slug: str, produto_id: str, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    result = await db.produtos.delete_one({"id": produto_id, "loja_id": loja["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return {"message": "Produto excluído com sucesso"}

# Clientes
@loja_router.get("/{slug}/clientes", response_model=List[Cliente])
async def list_clientes(slug: str, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    clientes = await db.clientes.find({"loja_id": loja["id"]}, {"_id": 0}).to_list(1000)
    return [Cliente(**c) for c in clientes]

@loja_router.post("/{slug}/clientes", response_model=Cliente)
async def create_cliente(slug: str, cliente: ClienteCreate, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    if not validate_cpf(cliente.cpf):
        raise HTTPException(status_code=400, detail="CPF inválido (deve ter 11 dígitos)")
    if not validate_whatsapp(cliente.whatsapp):
        raise HTTPException(status_code=400, detail="WhatsApp inválido (deve ter 10 ou 11 dígitos)")
    
    cliente_obj = Cliente(**cliente.model_dump(), loja_id=loja["id"])
    doc = cliente_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.clientes.insert_one(doc)
    return cliente_obj

@loja_router.get("/{slug}/clientes/{cliente_id}", response_model=Cliente)
async def get_cliente(slug: str, cliente_id: str, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    cliente = await db.clientes.find_one({"id": cliente_id, "loja_id": loja["id"]}, {"_id": 0})
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return Cliente(**cliente)

@loja_router.put("/{slug}/clientes/{cliente_id}", response_model=Cliente)
async def update_cliente(slug: str, cliente_id: str, cliente: ClienteUpdate, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    update_data = {k: v for k, v in cliente.model_dump().items() if v is not None}
    
    if "cpf" in update_data and not validate_cpf(update_data["cpf"]):
        raise HTTPException(status_code=400, detail="CPF inválido")
    if "whatsapp" in update_data and not validate_whatsapp(update_data["whatsapp"]):
        raise HTTPException(status_code=400, detail="WhatsApp inválido")
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    result = await db.clientes.update_one(
        {"id": cliente_id, "loja_id": loja["id"]}, 
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    updated = await db.clientes.find_one({"id": cliente_id}, {"_id": 0})
    return Cliente(**updated)

@loja_router.delete("/{slug}/clientes/{cliente_id}")
async def delete_cliente(slug: str, cliente_id: str, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    result = await db.clientes.delete_one({"id": cliente_id, "loja_id": loja["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return {"message": "Cliente excluído com sucesso"}

# Vendas
@loja_router.get("/{slug}/vendas", response_model=List[VendaConcluidaResponse])
async def list_vendas(slug: str, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    vendas = await db.vendas_concluidas.find({"loja_id": loja["id"]}, {"_id": 0}).to_list(1000)
    result = []
    for venda in vendas:
        cliente = await db.clientes.find_one({"id": venda["cliente_id"]}, {"_id": 0})
        cliente_nome = cliente["nome"] if cliente else "Cliente removido"
        itens_parsed = json.loads(venda.get("itens", "[]"))
        result.append(VendaConcluidaResponse(
            **venda,
            cliente_nome=cliente_nome,
            itens_parsed=[VendaItem(**item) for item in itens_parsed]
        ))
    return result

@loja_router.post("/{slug}/vendas", response_model=VendaConcluidaResponse)
async def create_venda(slug: str, venda: VendaCreate, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    
    cliente = await db.clientes.find_one({"id": venda.cliente_id, "loja_id": loja["id"]}, {"_id": 0})
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    if not venda.produtos or len(venda.produtos) == 0:
        raise HTTPException(status_code=400, detail="Selecione ao menos um produto")
    
    if not venda.forma_pagamento:
        raise HTTPException(status_code=400, detail="Forma de pagamento é obrigatória")
    
    itens = []
    valor_total = 0
    
    for produto_id in venda.produtos:
        produto = await db.produtos.find_one({"id": produto_id, "loja_id": loja["id"]}, {"_id": 0})
        if not produto:
            raise HTTPException(status_code=404, detail=f"Produto {produto_id} não encontrado")
        if produto.get("vendido", False):
            raise HTTPException(status_code=400, detail=f"Produto {produto_id} já foi vendido")
        
        modelo = await db.modelos.find_one({"id": produto["modelo_id"]}, {"_id": 0})
        modelo_nome = modelo["nome"] if modelo else "Modelo removido"
        
        itens.append({
            "produto_id": produto["id"],
            "modelo_id": produto["modelo_id"],
            "modelo_nome": modelo_nome,
            "cor": produto["cor"],
            "memoria": produto["memoria"],
            "preco": produto["preco"]
        })
        valor_total += produto["preco"]
    
    for produto_id in venda.produtos:
        await db.produtos.update_one({"id": produto_id}, {"$set": {"vendido": True}})
    
    venda_obj = VendaConcluida(
        loja_id=loja["id"],
        itens=json.dumps(itens),
        valor_total=valor_total,
        cliente_id=venda.cliente_id,
        forma_pagamento=venda.forma_pagamento,
        observacao=venda.observacao
    )
    
    doc = venda_obj.model_dump()
    doc['data'] = doc['data'].isoformat()
    await db.vendas_concluidas.insert_one(doc)
    
    return VendaConcluidaResponse(
        **venda_obj.model_dump(),
        cliente_nome=cliente["nome"],
        itens_parsed=[VendaItem(**item) for item in itens]
    )

@loja_router.get("/{slug}/vendas/{venda_id}", response_model=VendaConcluidaResponse)
async def get_venda(slug: str, venda_id: str, payload: dict = Depends(require_loja_access)):
    loja = await verify_loja_access(slug, payload)
    venda = await db.vendas_concluidas.find_one({"id": venda_id, "loja_id": loja["id"]}, {"_id": 0})
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    
    cliente = await db.clientes.find_one({"id": venda["cliente_id"]}, {"_id": 0})
    cliente_nome = cliente["nome"] if cliente else "Cliente removido"
    itens_parsed = json.loads(venda.get("itens", "[]"))
    
    return VendaConcluidaResponse(
        **venda,
        cliente_nome=cliente_nome,
        itens_parsed=[VendaItem(**item) for item in itens_parsed]
    )

# ============== ROOT ==============

@api_router.get("/")
async def root():
    return {"message": "CellControl API", "version": "2.0.0"}

# Include routers
app.include_router(api_router)
app.include_router(admin_router)
app.include_router(loja_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    # Create super admin if not exists
    existing_admin = await db.usuarios.find_one({"role": "super_admin"}, {"_id": 0})
    if not existing_admin:
        super_admin = {
            "id": str(uuid.uuid4()),
            "email": "superadmin@cellcontrol.com",
            "nome": "Super Admin",
            "senha": "admin123",
            "role": "super_admin",
            "loja_id": None,
            "ativo": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.usuarios.insert_one(super_admin)
        logger.info("Super Admin criado: superadmin@cellcontrol.com / admin123")
    
    # Create Isaac Imports store if not exists
    existing_loja = await db.lojas.find_one({"slug": "isaacimports"}, {"_id": 0})
    if not existing_loja:
        loja_id = str(uuid.uuid4())
        isaac_imports = {
            "id": loja_id,
            "nome": "Isaac Imports",
            "slug": "isaacimports",
            "ativo": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.lojas.insert_one(isaac_imports)
        logger.info("Loja Isaac Imports criada")
        
        # Create admin for Isaac Imports
        existing_loja_admin = await db.usuarios.find_one({"email": "admin@isaacimports.com"}, {"_id": 0})
        if not existing_loja_admin:
            loja_admin = {
                "id": str(uuid.uuid4()),
                "email": "admin@isaacimports.com",
                "nome": "Admin Isaac",
                "senha": "123456",
                "role": "loja_admin",
                "loja_id": loja_id,
                "ativo": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.usuarios.insert_one(loja_admin)
            logger.info("Admin da loja criado: admin@isaacimports.com / 123456")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
