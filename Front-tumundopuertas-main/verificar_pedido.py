#!/usr/bin/env python3
"""
Script para verificar el estado de un pedido específico
y diagnosticar por qué no aparece en el módulo de pagos
"""

import requests
import json
from datetime import datetime

# Configuración
API_URL = "https://crafteo.onrender.com"  # URL del backend
PEDIDO_ID = "68f0525e877f4f05dfeec494"

def verificar_pedido():
    """Verifica el estado de un pedido específico"""
    print(f"🔍 Verificando pedido: {PEDIDO_ID}")
    print(f"🌐 API URL: {API_URL}")
    print("-" * 50)
    
    try:
        # 1. Verificar si el pedido existe
        print("1️⃣ Verificando si el pedido existe...")
        response = requests.get(f"{API_URL}/pedidos/id/{PEDIDO_ID}/")
        
        if response.status_code == 404:
            print("❌ ERROR: El pedido no existe en la base de datos")
            return
        
        if response.status_code != 200:
            print(f"❌ ERROR: Error al obtener el pedido - Status: {response.status_code}")
            print(f"Response: {response.text}")
            return
        
        pedido = response.json()
        print("✅ El pedido existe")
        
        # 2. Mostrar información del pedido
        print("\n2️⃣ Información del pedido:")
        print(f"   📋 ID: {pedido.get('_id', 'N/A')}")
        print(f"   👤 Cliente: {pedido.get('cliente_nombre', 'N/A')}")
        print(f"   📅 Fecha creación: {pedido.get('fecha_creacion', 'N/A')}")
        print(f"   🏷️ Estado general: {pedido.get('estado_general', 'N/A')}")
        print(f"   💰 Estado pago: {pedido.get('pago', 'N/A')}")
        
        # 3. Verificar si el estado está en la lista de estados permitidos
        print("\n3️⃣ Verificando estados permitidos en módulo de pagos...")
        estados_permitidos = ["orden1", "orden2", "orden3", "orden4", "orden5", "orden6", "pendiente"]
        estado_actual = pedido.get('estado_general', '')
        
        print(f"   📊 Estados permitidos: {estados_permitidos}")
        print(f"   🎯 Estado actual: '{estado_actual}'")
        
        if estado_actual in estados_permitidos:
            print("   ✅ El estado está permitido en el módulo de pagos")
        else:
            print("   ❌ PROBLEMA: El estado NO está permitido en el módulo de pagos")
            print(f"   💡 Solución: Cambiar el estado a uno de: {estados_permitidos}")
        
        # 4. Verificar filtros de fecha
        print("\n4️⃣ Verificando filtros de fecha...")
        fecha_creacion = pedido.get('fecha_creacion', '')
        if fecha_creacion:
            try:
                # Convertir fecha a formato legible
                if 'T' in fecha_creacion:
                    fecha_obj = datetime.fromisoformat(fecha_creacion.replace('Z', '+00:00'))
                else:
                    fecha_obj = datetime.fromisoformat(fecha_creacion)
                
                print(f"   📅 Fecha creación: {fecha_obj.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"   📅 Fecha creación (ISO): {fecha_creacion}")
            except Exception as e:
                print(f"   ⚠️ Error al parsear fecha: {e}")
        else:
            print("   ⚠️ No hay fecha de creación")
        
        # 5. Probar endpoint del módulo de pagos
        print("\n5️⃣ Probando endpoint del módulo de pagos...")
        estados_params = "&".join([f"estado_general={estado}" for estado in estados_permitidos])
        url_pagos = f"{API_URL}/pedidos/estado/?{estados_params}"
        
        print(f"   🔗 URL: {url_pagos}")
        
        response_pagos = requests.get(url_pagos)
        if response_pagos.status_code == 200:
            pedidos_pagos = response_pagos.json()
            print(f"   📊 Total pedidos en módulo de pagos: {len(pedidos_pagos)}")
            
            # Buscar nuestro pedido específico
            pedido_encontrado = False
            for p in pedidos_pagos:
                if p.get('_id') == PEDIDO_ID:
                    pedido_encontrado = True
                    break
            
            if pedido_encontrado:
                print("   ✅ El pedido SÍ aparece en el módulo de pagos")
            else:
                print("   ❌ El pedido NO aparece en el módulo de pagos")
                print("   🔍 Posibles causas:")
                print("      - El estado no está en la lista permitida")
                print("      - Hay filtros de fecha aplicados")
                print("      - El pedido fue eliminado o tiene problemas de datos")
        else:
            print(f"   ❌ Error al probar endpoint: {response_pagos.status_code}")
            print(f"   Response: {response_pagos.text}")
        
        # 6. Recomendaciones
        print("\n6️⃣ Recomendaciones:")
        if estado_actual not in estados_permitidos:
            print("   🔧 ACCIÓN REQUERIDA: Actualizar el estado del pedido")
            print(f"   📝 Comando sugerido:")
            print(f"      PUT {API_URL}/pedidos/actualizar-estado-general/")
            print(f"      Body: {{'pedido_id': '{PEDIDO_ID}', 'nuevo_estado_general': 'orden6'}}")
        else:
            print("   ✅ El pedido debería aparecer en el módulo de pagos")
            print("   🔍 Revisar si hay filtros de fecha aplicados en el frontend")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR de conexión: {e}")
    except Exception as e:
        print(f"❌ ERROR inesperado: {e}")

if __name__ == "__main__":
    verificar_pedido()
