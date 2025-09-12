// api-client.js
// Esta función ahora solo maneja la lógica de autenticación y devuelve el objeto de respuesta del 'fetch' original.
const authenticatedFetch = async (url, options = {}) => {
  // Aquí puedes agregar la lógica para adjuntar el token de autenticación
  // a los headers de la solicitud, si lo necesitas.
  // Por ejemplo, const token = 'tu-token-de-auth';
  // options.headers = { ...options.headers, 'Authorization': `Bearer ${token}` };

  // El navegador establece el Content-Type para FormData.
  // No se debe añadir Content-Type si el cuerpo es FormData.
  const isFormData = options.body instanceof FormData;
  
  const headers = { ...options.headers };
  if (!isFormData && options.method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: headers,
    });

    // Retorna el objeto de respuesta completo.
    // Esto permite que la función que llama (fetchProductos)
    // maneje los diferentes estados (200, 401, etc.).
    return response;

  } catch (error) {
    console.error("Error en authenticatedFetch:", error);
    // El error de red (no del servidor) se lanzará aquí.
    throw error;
  }
};

export { authenticatedFetch };
