// src/config/cloudinary.config.js
const cloudinary = require('cloudinary').v2;
const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = require('./env.config.js');

// Configurar Cloudinary con las credenciales del entorno
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true, // Usar HTTPS
});

/**
 * Sube un archivo a Cloudinary desde un buffer de memoria.
 * @param {Buffer} fileBuffer - El buffer del archivo a subir.
 * @param {string} folder - La carpeta en Cloudinary donde se guardará el archivo.
 * @returns {Promise<object>} - Una promesa que se resuelve con el resultado de la subida.
 */
const uploadImage = (fileBuffer, folder = 'steticsoft') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    ).end(fileBuffer);
  });
};

/**
 * Elimina una imagen de Cloudinary usando su public_id.
 * @param {string} publicId - El ID público de la imagen a eliminar.
 * @returns {Promise<object>} - Una promesa que se resuelve con el resultado de la eliminación.
 */
const deleteImage = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error al eliminar la imagen de Cloudinary:", error);
    throw error;
  }
};

/**
 * Extrae el public_id de una URL de Cloudinary.
 * @param {string} imagen - La URL completa de la imagen (el valor del campo 'imagen').
 * @returns {string|null} - El public_id o null si no se puede extraer.
 */
const getPublicIdFromUrl = (imagen) => {
    if (!imagen || !imagen.includes('cloudinary.com')) {
        return null;
    }
    try {
        const parts = imagen.split('/');
        // La parte antes de la extensión es el nombre del archivo.
        const fileNameWithExtension = parts[parts.length - 1];
        const fileName = fileNameWithExtension.split('.')[0];
        
        // El public_id incluye la carpeta.
        const folder = parts[parts.length - 2];
        
        // Comprobamos si la penúltima parte es una versión (ej: v123456789)
        // si no, es parte de la ruta de la carpeta.
        if (folder.match(/^v\d+$/)) {
             return fileName; // Sin carpeta
        } else {
             return `${folder}/${fileName}`;
        }
    } catch (error) {
        console.error("No se pudo extraer el public_id de la URL:", imagen);
        return null;
    }
};


module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  getPublicIdFromUrl,
};

