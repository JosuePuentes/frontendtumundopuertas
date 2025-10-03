
const getApiUrl = () => {
  const apiUrlFromEnv = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  if (apiUrlFromEnv.includes('onrender.com')) {
    return apiUrlFromEnv.replace('http://', 'https://');
  }
  return apiUrlFromEnv;
};

const getToken = () => {
  return localStorage.getItem('token');
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

export default api;
