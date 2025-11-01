
export const getApiUrl = () => {
  // Usar la variable de entorno o la URL por defecto
  const apiUrl = import.meta.env.VITE_API_URL || 'https://crafteo.onrender.com';
  return apiUrl;
};

const getToken = () => {
  return localStorage.getItem('access_token');
};

const api = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as any).Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiUrl()}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'Something went wrong';
    try {
      const error = await response.json();
      // Manejar diferentes formatos de error
      if (error.detail) {
        errorMessage = Array.isArray(error.detail) 
          ? error.detail.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ')
          : error.detail;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
    } catch {
      errorMessage = `Error ${response.status}: ${response.statusText}`;
    }
    const error = new Error(errorMessage);
    (error as any).response = response;
    throw error;
  }

  return response.json();
};

export const getPresignedUrl = async (
  objectName: string,
  operation: 'put_object' | 'get_object',
  contentType?: string,
  expiresIn?: number
): Promise<string> => {
  const defaultExpiresIn = operation === 'get_object' ? 3600 : 600;
  const data = await api('/files/presigned-url', {
    method: 'POST',
    body: JSON.stringify({
      object_name: objectName,
      operation: operation,
      content_type: contentType,
      expires_in: expiresIn || defaultExpiresIn,
    }),
  });

  if (!data.presigned_url) {
    throw new Error(data.error || `No se pudo obtener la URL prefirmada para ${operation}.`);
  }

  return data.presigned_url;
};


export const getMetodosPago = async () => {
  const metodos = await api('/metodos-pago');
  return metodos.map((metodo: any) => ({
    ...metodo,
    id: metodo._id,
  }));
};

export const createMetodoPago = async (data: any) => {
  return api('/metodos-pago', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateMetodoPago = async (id: string, data: any) => {
  return api(`/metodos-pago/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteMetodoPago = async (id: string) => {
  return api(`/metodos-pago/${id}`, {
    method: 'DELETE',
  });
};

export const depositarDinero = async (id: string, monto: number, concepto: string) => {
  return api(`/metodos-pago/${id}/deposito`, {
    method: 'POST',
    body: JSON.stringify({ monto, concepto }),
  });
};

export const transferirDinero = async (id: string, monto: number, concepto: string) => {
  return api(`/metodos-pago/${id}/transferir`, {
    method: 'POST',
    body: JSON.stringify({ monto, concepto }),
  });
};

export const getHistorialMetodo = async (id: string) => {
  return api(`/metodos-pago/${id}/historial`);
};

export const getHistorialCompleto = async () => {
  return api(`/metodos-pago/historial-completo`);
};

// Funciones para Cuentas por Pagar
export const getCuentasPorPagar = async () => {
  return api('/cuentas-por-pagar');
};

export const createCuentaPorPagar = async (data: any) => {
  return api('/cuentas-por-pagar', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const abonarCuentaPorPagar = async (id: string, monto: number, metodoPagoId: string) => {
  return api(`/cuentas-por-pagar/${id}/abonar`, {
    method: 'POST',
    body: JSON.stringify({ monto, metodo_pago_id: metodoPagoId }),
  });
};

export const getCuentaPorPagarById = async (id: string) => {
  return api(`/cuentas-por-pagar/${id}`);
};

// Funciones para Facturas Confirmadas (persistencia en backend)
export const guardarFacturaConfirmada = async (factura: any) => {
  return api('/facturas-confirmadas', {
    method: 'POST',
    body: JSON.stringify(factura),
  });
};

export const getFacturasConfirmadas = async () => {
  return api('/facturas-confirmadas');
};

export const eliminarFacturaConfirmada = async (pedidoId: string) => {
  return api(`/facturas-confirmadas/${pedidoId}`, {
    method: 'DELETE',
  });
};

// Funciones para Pedidos Cargados al Inventario (persistencia en backend)
export const guardarPedidoCargadoInventario = async (pedido: any) => {
  return api('/pedidos-cargados-inventario', {
    method: 'POST',
    body: JSON.stringify(pedido),
  });
};

export const getPedidosCargadosInventario = async () => {
  return api('/pedidos-cargados-inventario');
};

export const actualizarPedidoCargadoInventario = async (pedidoId: string, datos: any) => {
  return api(`/pedidos-cargados-inventario/${pedidoId}`, {
    method: 'PATCH',
    body: JSON.stringify(datos),
  });
};


export default api;

