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
JWT_SECRET = os.environ.get('JWT_SECRET', 'isaac_imports_secret_key_2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

security = HTTPBearer()

# Create the main app
app = FastAPI(title="Isaac Imports API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== PYDANTIC MODELS ==============

class UsuarioBase(BaseModel):
    email: str

class UsuarioCreate(UsuarioBase):
    senha: str

class Usuario(UsuarioBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LoginRequest(BaseModel):
    email: str
    senha: str

class LoginResponse(BaseModel):
    token: str
    user_id: str
    user_email: str

class ModeloBase(BaseModel):
    nome: str

class ModeloCreate(ModeloBase):
    pass

class Modelo(ModeloBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ModeloWithQuantity(Modelo):
    quantidade_produtos: int = 0

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
    vendido: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProdutoWithModelo(Produto):
    modelo_nome: Optional[str] = None

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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VendaItem(BaseModel):
    produto_id: str
    modelo_id: str
    modelo_nome: str
    cor: str
    memoria: str
    preco: float

class VendaCreate(BaseModel):
    cliente_id: str
    produtos: List[str]  # List of produto IDs
    forma_pagamento: str
    observacao: Optional[str] = None

class VendaConcluida(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    data: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    itens: str  # JSON string
    valor_total: float
    cliente_id: str
    forma_pagamento: str
    observacao: Optional[str] = None

class VendaConcluidaResponse(VendaConcluida):
    cliente_nome: Optional[str] = None
    itens_parsed: Optional[List[VendaItem]] = None

class DashboardStats(BaseModel):
    total_modelos: int
    total_produtos: int
    total_clientes: int
    total_vendas: int
    valor_total_vendas: float
    modelos_com_estoque: List[ModeloWithQuantity]
    modelos_sem_estoque: List[Modelo]
    top_modelos: List[dict]

# ============== HELPER FUNCTIONS ==============

def create_token(user_id: str, user_email: str) -> str:
    payload = {
        "user_id": user_id,
        "user_email": user_email,
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

def validate_cpf(cpf: str) -> bool:
    cpf_clean = re.sub(r'\D', '', cpf)
    return len(cpf_clean) == 11

def validate_whatsapp(whatsapp: str) -> bool:
    whatsapp_clean = re.sub(r'\D', '', whatsapp)
    return len(whatsapp_clean) in [10, 11]

def parse_price(price_str: str) -> float:
    if isinstance(price_str, (int, float)):
        return float(price_str)
    price_str = price_str.replace('.', '').replace(',', '.')
    return float(price_str)

# ============== AUTH ROUTES ==============

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user = await db.usuarios.find_one({"email": request.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if user["senha"] != request.senha:
        raise HTTPException(status_code=401, detail="Senha incorreta.")
    
    token = create_token(user["id"], user["email"])
    return LoginResponse(token=token, user_id=user["id"], user_email=user["email"])

@api_router.get("/auth/me")
async def get_current_user(payload: dict = Depends(verify_token)):
    return {"user_id": payload["user_id"], "user_email": payload["user_email"]}

# ============== MODELO ROUTES ==============

@api_router.get("/modelos", response_model=List[ModeloWithQuantity])
async def list_modelos(payload: dict = Depends(verify_token)):
    modelos = await db.modelos.find({}, {"_id": 0}).to_list(1000)
    result = []
    for modelo in modelos:
        count = await db.produtos.count_documents({"modelo_id": modelo["id"], "vendido": False})
        result.append(ModeloWithQuantity(**modelo, quantidade_produtos=count))
    return result

@api_router.post("/modelos", response_model=Modelo)
async def create_modelo(modelo: ModeloCreate, payload: dict = Depends(verify_token)):
    modelo_obj = Modelo(**modelo.model_dump())
    doc = modelo_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.modelos.insert_one(doc)
    return modelo_obj

@api_router.get("/modelos/{modelo_id}", response_model=ModeloWithQuantity)
async def get_modelo(modelo_id: str, payload: dict = Depends(verify_token)):
    modelo = await db.modelos.find_one({"id": modelo_id}, {"_id": 0})
    if not modelo:
        raise HTTPException(status_code=404, detail="Modelo não encontrado")
    count = await db.produtos.count_documents({"modelo_id": modelo_id, "vendido": False})
    return ModeloWithQuantity(**modelo, quantidade_produtos=count)

@api_router.put("/modelos/{modelo_id}", response_model=Modelo)
async def update_modelo(modelo_id: str, modelo: ModeloCreate, payload: dict = Depends(verify_token)):
    result = await db.modelos.update_one({"id": modelo_id}, {"$set": {"nome": modelo.nome}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Modelo não encontrado")
    updated = await db.modelos.find_one({"id": modelo_id}, {"_id": 0})
    return Modelo(**updated)

@api_router.delete("/modelos/{modelo_id}")
async def delete_modelo(modelo_id: str, payload: dict = Depends(verify_token)):
    # Check if there are products linked
    count = await db.produtos.count_documents({"modelo_id": modelo_id})
    if count > 0:
        raise HTTPException(status_code=400, detail="Não é possível excluir modelo com produtos vinculados")
    result = await db.modelos.delete_one({"id": modelo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Modelo não encontrado")
    return {"message": "Modelo excluído com sucesso"}

# ============== PRODUTO ROUTES ==============

@api_router.get("/produtos", response_model=List[ProdutoWithModelo])
async def list_produtos(modelo_id: Optional[str] = None, vendido: Optional[bool] = None, payload: dict = Depends(verify_token)):
    query = {}
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

@api_router.post("/produtos", response_model=Produto)
async def create_produto(produto: ProdutoCreate, payload: dict = Depends(verify_token)):
    # Validate required fields
    if not produto.cor or not produto.memoria:
        raise HTTPException(status_code=400, detail="Cor e memória são obrigatórios")
    
    # Check if modelo exists
    modelo = await db.modelos.find_one({"id": produto.modelo_id}, {"_id": 0})
    if not modelo:
        raise HTTPException(status_code=404, detail="Modelo não encontrado")
    
    produto_obj = Produto(**produto.model_dump())
    doc = produto_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.produtos.insert_one(doc)
    return produto_obj

@api_router.get("/produtos/{produto_id}", response_model=ProdutoWithModelo)
async def get_produto(produto_id: str, payload: dict = Depends(verify_token)):
    produto = await db.produtos.find_one({"id": produto_id}, {"_id": 0})
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    modelo = await db.modelos.find_one({"id": produto["modelo_id"]}, {"_id": 0})
    modelo_nome = modelo["nome"] if modelo else "Modelo removido"
    return ProdutoWithModelo(**produto, modelo_nome=modelo_nome)

@api_router.put("/produtos/{produto_id}", response_model=Produto)
async def update_produto(produto_id: str, produto: ProdutoUpdate, payload: dict = Depends(verify_token)):
    update_data = {k: v for k, v in produto.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    result = await db.produtos.update_one({"id": produto_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    updated = await db.produtos.find_one({"id": produto_id}, {"_id": 0})
    return Produto(**updated)

@api_router.delete("/produtos/{produto_id}")
async def delete_produto(produto_id: str, payload: dict = Depends(verify_token)):
    result = await db.produtos.delete_one({"id": produto_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return {"message": "Produto excluído com sucesso"}

# ============== CLIENTE ROUTES ==============

@api_router.get("/clientes", response_model=List[Cliente])
async def list_clientes(payload: dict = Depends(verify_token)):
    clientes = await db.clientes.find({}, {"_id": 0}).to_list(1000)
    return [Cliente(**c) for c in clientes]

@api_router.post("/clientes", response_model=Cliente)
async def create_cliente(cliente: ClienteCreate, payload: dict = Depends(verify_token)):
    if not validate_cpf(cliente.cpf):
        raise HTTPException(status_code=400, detail="CPF inválido (deve ter 11 dígitos)")
    if not validate_whatsapp(cliente.whatsapp):
        raise HTTPException(status_code=400, detail="WhatsApp inválido (deve ter 10 ou 11 dígitos)")
    
    cliente_obj = Cliente(**cliente.model_dump())
    doc = cliente_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.clientes.insert_one(doc)
    return cliente_obj

@api_router.get("/clientes/{cliente_id}", response_model=Cliente)
async def get_cliente(cliente_id: str, payload: dict = Depends(verify_token)):
    cliente = await db.clientes.find_one({"id": cliente_id}, {"_id": 0})
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return Cliente(**cliente)

@api_router.put("/clientes/{cliente_id}", response_model=Cliente)
async def update_cliente(cliente_id: str, cliente: ClienteUpdate, payload: dict = Depends(verify_token)):
    update_data = {k: v for k, v in cliente.model_dump().items() if v is not None}
    
    if "cpf" in update_data and not validate_cpf(update_data["cpf"]):
        raise HTTPException(status_code=400, detail="CPF inválido (deve ter 11 dígitos)")
    if "whatsapp" in update_data and not validate_whatsapp(update_data["whatsapp"]):
        raise HTTPException(status_code=400, detail="WhatsApp inválido (deve ter 10 ou 11 dígitos)")
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    result = await db.clientes.update_one({"id": cliente_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    updated = await db.clientes.find_one({"id": cliente_id}, {"_id": 0})
    return Cliente(**updated)

@api_router.delete("/clientes/{cliente_id}")
async def delete_cliente(cliente_id: str, payload: dict = Depends(verify_token)):
    result = await db.clientes.delete_one({"id": cliente_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return {"message": "Cliente excluído com sucesso"}

# ============== VENDA ROUTES ==============

@api_router.get("/vendas", response_model=List[VendaConcluidaResponse])
async def list_vendas(payload: dict = Depends(verify_token)):
    vendas = await db.vendas_concluidas.find({}, {"_id": 0}).to_list(1000)
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

@api_router.post("/vendas", response_model=VendaConcluidaResponse)
async def create_venda(venda: VendaCreate, payload: dict = Depends(verify_token)):
    # Validate cliente
    cliente = await db.clientes.find_one({"id": venda.cliente_id}, {"_id": 0})
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    if not venda.produtos or len(venda.produtos) == 0:
        raise HTTPException(status_code=400, detail="Selecione ao menos um produto")
    
    if not venda.forma_pagamento:
        raise HTTPException(status_code=400, detail="Forma de pagamento é obrigatória")
    
    # Validate and collect products
    itens = []
    valor_total = 0
    
    for produto_id in venda.produtos:
        produto = await db.produtos.find_one({"id": produto_id}, {"_id": 0})
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
    
    # Mark products as sold
    for produto_id in venda.produtos:
        await db.produtos.update_one({"id": produto_id}, {"$set": {"vendido": True}})
    
    # Create venda
    venda_obj = VendaConcluida(
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

@api_router.get("/vendas/{venda_id}", response_model=VendaConcluidaResponse)
async def get_venda(venda_id: str, payload: dict = Depends(verify_token)):
    venda = await db.vendas_concluidas.find_one({"id": venda_id}, {"_id": 0})
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

# ============== DASHBOARD ROUTES ==============

@api_router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(mes: Optional[str] = None, payload: dict = Depends(verify_token)):
    # Count totals
    total_modelos = await db.modelos.count_documents({})
    total_produtos = await db.produtos.count_documents({"vendido": False})
    total_clientes = await db.clientes.count_documents({})
    total_vendas = await db.vendas_concluidas.count_documents({})
    
    # Calculate total sales value
    vendas = await db.vendas_concluidas.find({}, {"_id": 0}).to_list(1000)
    valor_total_vendas = sum(v.get("valor_total", 0) for v in vendas)
    
    # Get modelos with quantity
    modelos = await db.modelos.find({}, {"_id": 0}).to_list(1000)
    modelos_com_estoque = []
    modelos_sem_estoque = []
    
    for modelo in modelos:
        count = await db.produtos.count_documents({"modelo_id": modelo["id"], "vendido": False})
        modelo_with_qty = ModeloWithQuantity(**modelo, quantidade_produtos=count)
        if count > 0:
            modelos_com_estoque.append(modelo_with_qty)
        else:
            modelos_sem_estoque.append(Modelo(**modelo))
    
    # Calculate top models (most sold)
    modelo_sales = {}
    
    # Filter by month if specified
    filtered_vendas = vendas
    if mes:
        try:
            year, month = mes.split('-')
            filtered_vendas = [
                v for v in vendas 
                if v.get("data", "").startswith(mes)
            ]
        except:
            pass
    
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

# ============== SEED DATA ==============

@api_router.post("/seed")
async def seed_data():
    # Check if admin user exists
    existing = await db.usuarios.find_one({"email": "admin@isaac.com"}, {"_id": 0})
    if not existing:
        admin = {
            "id": str(uuid.uuid4()),
            "email": "admin@isaac.com",
            "senha": "123456",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.usuarios.insert_one(admin)
        return {"message": "Dados iniciais criados", "admin_created": True}
    return {"message": "Dados já existem", "admin_created": False}

@api_router.get("/")
async def root():
    return {"message": "Isaac Imports API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

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
    # Seed admin user on startup
    existing = await db.usuarios.find_one({"email": "admin@isaac.com"}, {"_id": 0})
    if not existing:
        admin = {
            "id": str(uuid.uuid4()),
            "email": "admin@isaac.com",
            "senha": "123456",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.usuarios.insert_one(admin)
        logger.info("Admin user created: admin@isaac.com / 123456")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
