export const getApiUrl = () => {
  // Usar la variable de entorno o la URL por defecto
  const apiUrl = import.meta.env.VITE_API_URL || 'https://crafteo.onrender.com';
  // Asegurar que siempre use HTTPS
  return apiUrl.includes('http') ? apiUrl : `https://${apiUrl}`;
};

/**
 * Función para obtener una URL prefirmada desde el backend.
 * @param objectName - El nombre del objeto en el bucket (ej. 'uploads/imagen.jpg').
 * @param operation - La operación deseada ('put_object' para subir, 'get_object' para descargar).
 * @param contentType - El tipo de contenido del archivo (ej. 'image/jpeg'), necesario para 'put_object'.
 * @param expiresIn - Duración de la validez de la URL en segundos (por defecto 1 hora para GET, 10 minutos para PUT).
 * @returns La URL prefirmada.
 * @throws Error si la URL prefirmada no se puede obtener.
 */
export async function getPresignedUrl(
  objectName: string,
  operation: "put_object" | "get_object",
  contentType?: string,
  expiresIn?: number
): Promise<string> {
  const defaultExpiresIn = operation === "get_object" ? 3600 : 600; // 1h para GET, 10min para PUT
  const apiUrl = getApiUrl();
  const url = `${apiUrl}/files/presigned-url`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      object_name: objectName,
      operation: operation,
      content_type: contentType, // Solo relevante para put_object
      expires_in: expiresIn || defaultExpiresIn,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.presigned_url) {
    throw new Error(
      data.error || `No se pudo obtener la URL prefirmada para ${operation}.`
    );
  }
  return data.presigned_url;
}