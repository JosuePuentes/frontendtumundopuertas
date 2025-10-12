import React, { useState } from 'react';
import { getApiUrl } from '@/lib/api';

interface DiagnosticoBackendProps {
  pedidoId?: string;
  itemId?: string;
}

const DiagnosticoBackend: React.FC<DiagnosticoBackendProps> = ({ 
  pedidoId = "68eaa1b4ec5ddcf8f5df3c8d", 
  itemId = "68af25f710b63f047bce9650" 
}) => {
  const [diagnostico, setDiagnostico] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ejecutarDiagnostico = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DEL BACKEND');
      console.log('==========================================');
      
      const resultados = {
        timestamp: new Date().toISOString(),
        endpoint_problema: `${getApiUrl()}/pedidos/empleados-por-modulo/${pedidoId}/${itemId}`,
        pruebas: [] as any[]
      };

      // 1. Verificar que el endpoint existe
      console.log('1️⃣ Verificando endpoint problemático...');
      try {
        const response = await fetch(`${getApiUrl()}/pedidos/empleados-por-modulo/${pedidoId}/${itemId}`);
        resultados.pruebas.push({
          nombre: 'Endpoint problemático',
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          error: !response.ok ? await response.text() : null
        });
        console.log('📊 Endpoint problemático:', {
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
      } catch (err: any) {
        resultados.pruebas.push({
          nombre: 'Endpoint problemático',
          error: err.message,
          tipo: 'Network Error'
        });
        console.error('❌ Error de red:', err);
      }

      // 2. Verificar endpoints relacionados que funcionan
      console.log('2️⃣ Verificando endpoints relacionados...');
      
      const endpointsRelacionados = [
        `${getApiUrl()}/pedidos/id/${pedidoId}/`,
        `${getApiUrl()}/empleados/all/`,
        `${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?modulo=herreria`,
        `${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?modulo=masillar`,
        `${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?modulo=preparar`
      ];

      for (const endpoint of endpointsRelacionados) {
        try {
          const response = await fetch(endpoint);
          const data = await response.json();
          resultados.pruebas.push({
            nombre: `Endpoint relacionado: ${endpoint.split('/').pop()}`,
            status: response.status,
            ok: response.ok,
            data_type: Array.isArray(data) ? 'array' : typeof data,
            data_length: Array.isArray(data) ? data.length : Object.keys(data).length,
            sample_data: Array.isArray(data) ? data.slice(0, 2) : Object.keys(data).slice(0, 5)
          });
          console.log(`✅ ${endpoint.split('/').pop()}:`, {
            status: response.status,
            ok: response.ok,
            data_type: Array.isArray(data) ? 'array' : typeof data,
            data_length: Array.isArray(data) ? data.length : Object.keys(data).length
          });
        } catch (err: any) {
          resultados.pruebas.push({
            nombre: `Endpoint relacionado: ${endpoint.split('/').pop()}`,
            error: err.message,
            tipo: 'Network Error'
          });
          console.error(`❌ Error en ${endpoint.split('/').pop()}:`, err);
        }
      }

      // 3. Verificar datos específicos del pedido
      console.log('3️⃣ Verificando datos del pedido específico...');
      try {
        const pedidoResponse = await fetch(`${getApiUrl()}/pedidos/id/${pedidoId}/`);
        if (pedidoResponse.ok) {
          const pedidoData = await pedidoResponse.json();
          resultados.pruebas.push({
            nombre: 'Datos del pedido',
            pedido_existe: true,
            items_count: pedidoData.items ? pedidoData.items.length : 0,
            item_existe: pedidoData.items ? pedidoData.items.some((item: any) => item._id === itemId) : false,
            seguimiento_count: pedidoData.seguimiento ? pedidoData.seguimiento.length : 0,
            estado_general: pedidoData.estado_general,
            sample_item: pedidoData.items ? pedidoData.items.find((item: any) => item._id === itemId) : null
          });
          console.log('📋 Datos del pedido:', {
            pedido_existe: true,
            items_count: pedidoData.items ? pedidoData.items.length : 0,
            item_existe: pedidoData.items ? pedidoData.items.some((item: any) => item._id === itemId) : false,
            seguimiento_count: pedidoData.seguimiento ? pedidoData.seguimiento.length : 0,
            estado_general: pedidoData.estado_general
          });
        } else {
          resultados.pruebas.push({
            nombre: 'Datos del pedido',
            pedido_existe: false,
            error: await pedidoResponse.text()
          });
        }
      } catch (err: any) {
        resultados.pruebas.push({
          nombre: 'Datos del pedido',
          error: err.message,
          tipo: 'Network Error'
        });
      }

      // 4. Verificar empleados
      console.log('4️⃣ Verificando empleados...');
      try {
        const empleadosResponse = await fetch(`${getApiUrl()}/empleados/all/`);
        if (empleadosResponse.ok) {
          const empleadosData = await empleadosResponse.json();
          resultados.pruebas.push({
            nombre: 'Datos de empleados',
            empleados_count: Array.isArray(empleadosData) ? empleadosData.length : 0,
            empleados_type: Array.isArray(empleadosData) ? 'array' : typeof empleadosData,
            sample_empleados: Array.isArray(empleadosData) ? empleadosData.slice(0, 3) : null
          });
          console.log('👥 Empleados:', {
            count: Array.isArray(empleadosData) ? empleadosData.length : 0,
            type: Array.isArray(empleadosData) ? 'array' : typeof empleadosData
          });
        }
      } catch (err: any) {
        resultados.pruebas.push({
          nombre: 'Datos de empleados',
          error: err.message,
          tipo: 'Network Error'
        });
      }

      // 5. Probar diferentes combinaciones de pedido/item
      console.log('5️⃣ Probando diferentes combinaciones...');
      const combinaciones = [
        { pedido: "68e5351da05e21da5396c47d", item: "68daa0aa34c528896199960a" }, // Esta funciona
        { pedido: pedidoId, item: itemId }, // Esta falla
        { pedido: "68e7b0c8a05e21da5396c494", item: "68af158f10b63f047bce95f6" } // Otra que funciona
      ];

      for (const combo of combinaciones) {
        try {
          const response = await fetch(`${getApiUrl()}/pedidos/empleados-por-modulo/${combo.pedido}/${combo.item}`);
          resultados.pruebas.push({
            nombre: `Combinación: ${combo.pedido.slice(-6)}/${combo.item.slice(-6)}`,
            status: response.status,
            ok: response.ok,
            funciona: response.ok,
            error: !response.ok ? await response.text() : null
          });
          console.log(`🔍 ${combo.pedido.slice(-6)}/${combo.item.slice(-6)}:`, {
            status: response.status,
            ok: response.ok,
            funciona: response.ok
          });
        } catch (err: any) {
          resultados.pruebas.push({
            nombre: `Combinación: ${combo.pedido.slice(-6)}/${combo.item.slice(-6)}`,
            error: err.message,
            tipo: 'Network Error'
          });
        }
      }

      setDiagnostico(resultados);
      console.log('✅ DIAGNÓSTICO COMPLETADO');
      console.log('========================');
      console.log('📊 Resultados completos:', resultados);
      
    } catch (err: any) {
      console.error('❌ Error en diagnóstico:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportarDiagnostico = () => {
    if (!diagnostico) return;
    
    const dataStr = JSON.stringify(diagnostico, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagnostico-backend-${new Date().toISOString().slice(0, 19)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="diagnostico-backend p-4 bg-gray-50 rounded-lg border">
      <h3 className="text-lg font-bold mb-4">🔍 Diagnóstico del Backend</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Pedido ID (problemático):
        </label>
        <input
          type="text"
          value={pedidoId}
          onChange={() => setDiagnostico(null)}
          className="w-full p-2 border rounded"
          placeholder="ID del pedido que causa error 500"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Item ID (problemático):
        </label>
        <input
          type="text"
          value={itemId}
          onChange={() => setDiagnostico(null)}
          className="w-full p-2 border rounded"
          placeholder="ID del item que causa error 500"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={ejecutarDiagnostico}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '🔍 Ejecutando diagnóstico...' : '🚀 Ejecutar Diagnóstico'}
        </button>
        
        {diagnostico && (
          <button
            onClick={exportarDiagnostico}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            📥 Exportar Resultados
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          ❌ Error: {error}
        </div>
      )}

      {diagnostico && (
        <div className="diagnostico-resultados">
          <h4 className="font-bold mb-2">📊 Resultados del Diagnóstico:</h4>
          
          <div className="mb-4 p-3 bg-blue-100 rounded">
            <strong>Endpoint problemático:</strong> {diagnostico.endpoint_problema}
            <br />
            <strong>Timestamp:</strong> {new Date(diagnostico.timestamp).toLocaleString()}
          </div>

          <div className="space-y-2">
            {diagnostico.pruebas.map((prueba: any, index: number) => (
              <div key={index} className="p-3 border rounded">
                <div className="font-medium mb-1">{prueba.nombre}</div>
                
                {prueba.error ? (
                  <div className="text-red-600">
                    ❌ Error: {prueba.error}
                    {prueba.tipo && <span className="text-xs"> ({prueba.tipo})</span>}
                  </div>
                ) : (
                  <div className="text-green-600">
                    ✅ Status: {prueba.status} {prueba.ok ? '(OK)' : '(Error)'}
                    {prueba.data_type && (
                      <span className="text-xs ml-2">
                        Tipo: {prueba.data_type}, Cantidad: {prueba.data_length}
                      </span>
                    )}
                    {prueba.funciona !== undefined && (
                      <span className={`ml-2 ${prueba.funciona ? 'text-green-600' : 'text-red-600'}`}>
                        {prueba.funciona ? '✅ Funciona' : '❌ Falla'}
                      </span>
                    )}
                  </div>
                )}
                
                {prueba.sample_data && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-600 cursor-pointer">
                      Ver datos de muestra
                    </summary>
                    <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto">
                      {JSON.stringify(prueba.sample_data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticoBackend;
