import requests
import sys
import json
from datetime import datetime

class IsaacImportsAPITester:
    def __init__(self, base_url="https://cellphonecontrol.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'modelos': [],
            'produtos': [],
            'clientes': [],
            'vendas': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

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

    def test_seed_data(self):
        """Test seed data creation"""
        success, response = self.run_test(
            "Seed Data",
            "POST",
            "seed",
            200
        )
        return success

    def test_login(self):
        """Test login and get token"""
        success, response = self.run_test(
            "Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@isaac.com", "senha": "123456"}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_auth_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_dashboard(self):
        """Test dashboard endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard",
            200
        )
        if success:
            required_fields = ['total_modelos', 'total_produtos', 'total_clientes', 'total_vendas']
            for field in required_fields:
                if field not in response:
                    print(f"   Warning: Missing field {field} in dashboard response")
        return success

    def test_create_modelo(self):
        """Test creating a modelo"""
        success, response = self.run_test(
            "Create Modelo",
            "POST",
            "modelos",
            200,
            data={"nome": "iPhone 15 Pro Max"}
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
            "modelos",
            200
        )
        return success

    def test_get_modelo(self, modelo_id):
        """Test getting a specific modelo"""
        success, response = self.run_test(
            "Get Modelo",
            "GET",
            f"modelos/{modelo_id}",
            200
        )
        return success

    def test_update_modelo(self, modelo_id):
        """Test updating a modelo"""
        success, response = self.run_test(
            "Update Modelo",
            "PUT",
            f"modelos/{modelo_id}",
            200,
            data={"nome": "iPhone 15 Pro Max Updated"}
        )
        return success

    def test_create_produto(self, modelo_id):
        """Test creating a produto"""
        success, response = self.run_test(
            "Create Produto",
            "POST",
            "produtos",
            200,
            data={
                "modelo_id": modelo_id,
                "cor": "Dourado",
                "memoria": "256GB",
                "bateria": 100,
                "imei": "123456789012345",
                "preco": 8999.99
            }
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
            "produtos",
            200
        )
        return success

    def test_create_cliente(self):
        """Test creating a cliente"""
        success, response = self.run_test(
            "Create Cliente",
            "POST",
            "clientes",
            200,
            data={
                "nome": "João Silva",
                "cpf": "12345678901",
                "whatsapp": "11987654321",
                "email": "joao@email.com"
            }
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
            "clientes",
            200
        )
        return success

    def test_cpf_validation(self):
        """Test CPF validation"""
        success, response = self.run_test(
            "CPF Validation (Invalid)",
            "POST",
            "clientes",
            400,
            data={
                "nome": "Test Invalid CPF",
                "cpf": "123",  # Invalid CPF
                "whatsapp": "11987654321"
            }
        )
        return success  # Success means it correctly rejected invalid CPF

    def test_whatsapp_validation(self):
        """Test WhatsApp validation"""
        success, response = self.run_test(
            "WhatsApp Validation (Invalid)",
            "POST",
            "clientes",
            400,
            data={
                "nome": "Test Invalid WhatsApp",
                "cpf": "12345678901",
                "whatsapp": "123"  # Invalid WhatsApp
            }
        )
        return success  # Success means it correctly rejected invalid WhatsApp

    def test_create_venda(self, cliente_id, produto_ids):
        """Test creating a venda"""
        success, response = self.run_test(
            "Create Venda",
            "POST",
            "vendas",
            200,
            data={
                "cliente_id": cliente_id,
                "produtos": produto_ids,
                "forma_pagamento": "pix",
                "observacao": "Venda de teste"
            }
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
            "vendas",
            200
        )
        return success

    def test_get_venda(self, venda_id):
        """Test getting a specific venda"""
        success, response = self.run_test(
            "Get Venda",
            "GET",
            f"vendas/{venda_id}",
            200
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