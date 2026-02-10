import requests
import sys
import json
from datetime import datetime

class CellControlAPITester:
    def __init__(self, base_url="https://cellphonecontrol.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.loja_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'lojas': [],
            'usuarios': [],
            'modelos': [],
            'produtos': [],
            'clientes': [],
            'vendas': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if token:
            test_headers['Authorization'] = f'Bearer {token}'
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_super_admin_login(self):
        """Test super admin login"""
        success, response = self.run_test(
            "Super Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "superadmin@cellcontrol.com", "senha": "admin123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_loja_admin_login(self):
        """Test loja admin login"""
        success, response = self.run_test(
            "Loja Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@isaacimports.com", "senha": "123456"}
        )
        if success and 'token' in response:
            self.loja_token = response['token']
            print(f"   Loja token obtained: {self.loja_token[:20]}...")
            return True
        return False

    def test_admin_dashboard(self):
        """Test admin dashboard"""
        success, response = self.run_test(
            "Admin Dashboard",
            "GET",
            "admin/dashboard",
            200,
            token=self.admin_token
        )
        if success:
            required_fields = ['total_lojas', 'lojas_ativas', 'total_usuarios', 'total_vendas_global']
            for field in required_fields:
                if field not in response:
                    print(f"   Warning: Missing field {field} in admin dashboard")
        return success

    def test_admin_list_lojas(self):
        """Test admin list lojas"""
        success, response = self.run_test(
            "Admin List Lojas",
            "GET",
            "admin/lojas",
            200,
            token=self.admin_token
        )
        return success

    def test_admin_create_loja(self):
        """Test admin create loja"""
        success, response = self.run_test(
            "Admin Create Loja",
            "POST",
            "admin/lojas",
            200,
            data={"nome": "Test Store", "slug": "teststore"},
            token=self.admin_token
        )
        if success and 'id' in response:
            self.created_ids['lojas'].append(response['id'])
            print(f"   Created loja ID: {response['id']}")
        return success, response.get('id') if success else None

    def test_admin_list_usuarios(self):
        """Test admin list usuarios"""
        success, response = self.run_test(
            "Admin List Usuarios",
            "GET",
            "admin/usuarios",
            200,
            token=self.admin_token
        )
        return success

    def test_admin_create_usuario(self, loja_id):
        """Test admin create usuario"""
        success, response = self.run_test(
            "Admin Create Usuario",
            "POST",
            "admin/usuarios",
            200,
            data={
                "email": "test@teststore.com",
                "nome": "Test User",
                "senha": "testpass",
                "role": "loja_admin",
                "loja_id": loja_id
            },
            token=self.admin_token
        )
        if success and 'id' in response:
            self.created_ids['usuarios'].append(response['id'])
            print(f"   Created usuario ID: {response['id']}")
        return success, response.get('id') if success else None

    def test_loja_dashboard(self):
        """Test loja dashboard"""
        success, response = self.run_test(
            "Loja Dashboard",
            "GET",
            "loja/isaacimports/dashboard",
            200,
            token=self.loja_token
        )
        if success:
            required_fields = ['total_modelos', 'total_produtos', 'total_clientes', 'total_vendas']
            for field in required_fields:
                if field not in response:
                    print(f"   Warning: Missing field {field} in loja dashboard")
        return success

    def test_create_modelo(self):
        """Test creating a modelo"""
        success, response = self.run_test(
            "Create Modelo",
            "POST",
            "loja/isaacimports/modelos",
            200,
            data={"nome": "iPhone 15 Pro Max"},
            token=self.loja_token
        )
        if success and 'id' in response:
            self.created_ids['modelos'].append(response['id'])
            print(f"   Created modelo ID: {response['id']}")
        return success, response.get('id') if success else None

    def test_list_modelos(self):
        """Test listing modelos"""
        success, response = self.run_test(
            "List Modelos",
            "GET",
            "loja/isaacimports/modelos",
            200,
            token=self.loja_token
        )
        return success

    def test_get_modelo(self, modelo_id):
        """Test getting a specific modelo"""
        success, response = self.run_test(
            "Get Modelo",
            "GET",
            f"loja/isaacimports/modelos/{modelo_id}",
            200,
            token=self.loja_token
        )
        return success

    def test_update_modelo(self, modelo_id):
        """Test updating a modelo"""
        success, response = self.run_test(
            "Update Modelo",
            "PUT",
            f"loja/isaacimports/modelos/{modelo_id}",
            200,
            data={"nome": "iPhone 15 Pro Max Updated"},
            token=self.loja_token
        )
        return success

    def test_create_produto(self, modelo_id):
        """Test creating a produto"""
        success, response = self.run_test(
            "Create Produto",
            "POST",
            "loja/isaacimports/produtos",
            200,
            data={
                "modelo_id": modelo_id,
                "cor": "Dourado",
                "memoria": "256GB",
                "bateria": 100,
                "imei": "123456789012345",
                "preco": 8999.99
            },
            token=self.loja_token
        )
        if success and 'id' in response:
            self.created_ids['produtos'].append(response['id'])
            print(f"   Created produto ID: {response['id']}")
        return success, response.get('id') if success else None

    def test_list_produtos(self):
        """Test listing produtos"""
        success, response = self.run_test(
            "List Produtos",
            "GET",
            "loja/isaacimports/produtos",
            200,
            token=self.loja_token
        )
        return success

    def test_create_cliente(self):
        """Test creating a cliente"""
        success, response = self.run_test(
            "Create Cliente",
            "POST",
            "loja/isaacimports/clientes",
            200,
            data={
                "nome": "João Silva",
                "cpf": "12345678901",
                "whatsapp": "11987654321",
                "email": "joao@email.com"
            },
            token=self.loja_token
        )
        if success and 'id' in response:
            self.created_ids['clientes'].append(response['id'])
            print(f"   Created cliente ID: {response['id']}")
        return success, response.get('id') if success else None

    def test_list_clientes(self):
        """Test listing clientes"""
        success, response = self.run_test(
            "List Clientes",
            "GET",
            "loja/isaacimports/clientes",
            200,
            token=self.loja_token
        )
        return success

    def test_cpf_validation(self):
        """Test CPF validation"""
        success, response = self.run_test(
            "CPF Validation (Invalid)",
            "POST",
            "loja/isaacimports/clientes",
            400,
            data={
                "nome": "Test Invalid CPF",
                "cpf": "123",  # Invalid CPF
                "whatsapp": "11987654321"
            },
            token=self.loja_token
        )
        return success  # Success means it correctly rejected invalid CPF

    def test_whatsapp_validation(self):
        """Test WhatsApp validation"""
        success, response = self.run_test(
            "WhatsApp Validation (Invalid)",
            "POST",
            "loja/isaacimports/clientes",
            400,
            data={
                "nome": "Test Invalid WhatsApp",
                "cpf": "12345678901",
                "whatsapp": "123"  # Invalid WhatsApp
            },
            token=self.loja_token
        )
        return success  # Success means it correctly rejected invalid WhatsApp

    def test_create_venda(self, cliente_id, produto_ids):
        """Test creating a venda"""
        success, response = self.run_test(
            "Create Venda",
            "POST",
            "loja/isaacimports/vendas",
            200,
            data={
                "cliente_id": cliente_id,
                "produtos": produto_ids,
                "forma_pagamento": "pix",
                "observacao": "Venda de teste"
            },
            token=self.loja_token
        )
        if success and 'id' in response:
            self.created_ids['vendas'].append(response['id'])
            print(f"   Created venda ID: {response['id']}")
        return success, response.get('id') if success else None

    def test_list_vendas(self):
        """Test listing vendas"""
        success, response = self.run_test(
            "List Vendas",
            "GET",
            "loja/isaacimports/vendas",
            200,
            token=self.loja_token
        )
        return success

    def test_get_venda(self, venda_id):
        """Test getting a specific venda"""
        success, response = self.run_test(
            "Get Venda",
            "GET",
            f"loja/isaacimports/vendas/{venda_id}",
            200,
            token=self.loja_token
        )
        return success

    def test_data_isolation(self):
        """Test that loja admin cannot access other loja's data"""
        # Try to access admin endpoints with loja token (should fail)
        success, response = self.run_test(
            "Data Isolation - Admin Dashboard Access",
            "GET",
            "admin/dashboard",
            403,  # Should be forbidden
            token=self.loja_token
        )
        return success

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete vendas first (they reference produtos and clientes)
        for venda_id in self.created_ids['vendas']:
            self.run_test(f"Delete Venda {venda_id}", "DELETE", f"vendas/{venda_id}", 200)
        
        # Delete produtos (they reference modelos)
        for produto_id in self.created_ids['produtos']:
            self.run_test(f"Delete Produto {produto_id}", "DELETE", f"produtos/{produto_id}", 200)
        
        # Delete clientes
        for cliente_id in self.created_ids['clientes']:
            self.run_test(f"Delete Cliente {cliente_id}", "DELETE", f"clientes/{cliente_id}", 200)
        
        # Delete modelos last
        for modelo_id in self.created_ids['modelos']:
            self.run_test(f"Delete Modelo {modelo_id}", "DELETE", f"modelos/{modelo_id}", 200)

def main():
    print("🚀 Starting Isaac Imports API Tests")
    print("=" * 50)
    
    tester = IsaacImportsAPITester()
    
    try:
        # Test seed data
        if not tester.test_seed_data():
            print("❌ Seed data test failed, but continuing...")

        # Test authentication
        if not tester.test_login():
            print("❌ Login failed, stopping tests")
            return 1

        if not tester.test_auth_me():
            print("❌ Auth verification failed")
            return 1

        # Test dashboard
        if not tester.test_dashboard():
            print("❌ Dashboard test failed")

        # Test modelos
        modelo_success, modelo_id = tester.test_create_modelo()
        if not modelo_success:
            print("❌ Modelo creation failed, stopping tests")
            return 1

        if not tester.test_list_modelos():
            print("❌ List modelos failed")

        if not tester.test_get_modelo(modelo_id):
            print("❌ Get modelo failed")

        if not tester.test_update_modelo(modelo_id):
            print("❌ Update modelo failed")

        # Test produtos
        produto_success, produto_id = tester.test_create_produto(modelo_id)
        if not produto_success:
            print("❌ Produto creation failed")

        if not tester.test_list_produtos():
            print("❌ List produtos failed")

        # Test clientes
        cliente_success, cliente_id = tester.test_create_cliente()
        if not cliente_success:
            print("❌ Cliente creation failed")

        if not tester.test_list_clientes():
            print("❌ List clientes failed")

        # Test validations
        if not tester.test_cpf_validation():
            print("❌ CPF validation test failed")

        if not tester.test_whatsapp_validation():
            print("❌ WhatsApp validation test failed")

        # Test vendas (only if we have cliente and produto)
        if cliente_id and produto_id:
            venda_success, venda_id = tester.test_create_venda(cliente_id, [produto_id])
            if venda_success:
                if not tester.test_get_venda(venda_id):
                    print("❌ Get venda failed")
            else:
                print("❌ Venda creation failed")

            if not tester.test_list_vendas():
                print("❌ List vendas failed")

        # Clean up test data
        tester.cleanup_test_data()

    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return 1

    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run}")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 Backend tests mostly successful!")
        return 0
    else:
        print("⚠️  Backend has significant issues")
        return 1

if __name__ == "__main__":
    sys.exit(main())