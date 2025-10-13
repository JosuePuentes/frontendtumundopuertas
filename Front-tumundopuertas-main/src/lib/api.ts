
export const getApiUrl = () => {
  const apiUrlFromEnv = import.meta.env.VITE_API_URL || 'https://crafteo.onrender.com';
  if (apiUrlFromEnv.includes('onrender.com')) {
    return apiUrlFromEnv.replace('http://', 'https://');
  }
  return apiUrlFromEnv;
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
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
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


export default api;

