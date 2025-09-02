// src/controllers/servicio.controller.js
const servicioService = require("../services/servicio.service.js");

const crearServicio = async (req, res, next) => {
  try {
    // El cuerpo de la solicitud que contiene los datos del servicio
    const servicioData = req.body;

    // Si se subió un archivo, su información estará en req.file
    if (req.file) {
      // Construimos la URL pública de la imagen.
      // La ruta guardada debe ser relativa a la carpeta 'public' para ser accesible.
      // Ejemplo: /uploads/servicios/nombre-unico-12345.jpg
      const imageUrl = `/uploads/servicios/${req.file.filename}`;
      servicioData.imagenUrl = imageUrl;
    }

    const nuevo = await servicioService.crearServicio(servicioData);
    res.status(201).json({
      success: true,
      message: "Servicio creado exitosamente.",
      data: nuevo,
    });
  } catch (error) {
    next(error);
  }
};

const listarServicios = async (req, res, next) => {
  try {
    const filtros = {
      busqueda: req.query.busqueda ?? undefined,
      estado: req.query.estado ?? undefined,
      idCategoriaServicio:
        req.query.idCategoriaServicio ??
        req.query.categoriaServicioId ??
        undefined,
    };

    const servicios = await servicioService.obtenerTodosLosServicios(filtros);
    res.status(200).json({ success: true, data: servicios });
  } catch (error) {
    next(error);
  }
};

const listarServiciosPublicos = async (req, res, next) => {
  try {
    const servicios = await servicioService.obtenerTodosLosServicios({
      estado: "Activo"
    });

    const serviciosPublicos = servicios.map(s => ({
      id: s.id,
      nombre: s.nombre,
      description: s.description,
      categoria: s.categoria,
      price: s.price,
      imagenURL: s.imagenURL
    }));

    res.status(200).json({ success: true, data: serviciosPublicos });
  } catch (error) {
    next(error);
  }
};

const obtenerServicioPorId = async (req, res, next) => {
  try {
    const { idServicio } = req.params;
    const servicio = await servicioService.obtenerServicioPorId(
      Number(idServicio)
    );
    res.status(200).json({ success: true, data: servicio });
  } catch (error) {
    next(error);
  }
};

const actualizarServicio = async (req, res, next) => {
  try {
    const { idServicio } = req.params;
    const servicioData = req.body;

    // Si se sube una nueva imagen, la añadimos a los datos a actualizar.
    if (req.file) {
      const imageUrl = `/uploads/servicios/${req.file.filename}`;
      servicioData.imagenUrl = imageUrl;
    }

    const actualizado = await servicioService.actualizarServicio(
      Number(idServicio),
      servicioData
    );

    res.status(200).json({
      success: true,
      message: "Servicio actualizado exitosamente.",
      data: actualizado,
    });
  } catch (error) {
    next(error);
  }
};

const cambiarEstadoServicio = async (req, res, next) => {
  try {
    const { idServicio } = req.params;
    const { estado } = req.body;
    const actualizado = await servicioService.cambiarEstadoServicio(
      Number(idServicio),
      estado
    );
    res.status(200).json({
      success: true,
      message: "Estado del servicio cambiado exitosamente.",
      data: actualizado,
    });
  } catch (error) {
    next(error);
  }
};

const eliminarServicioFisico = async (req, res, next) => {
  try {
    const { idServicio } = req.params;
    await servicioService.eliminarServicioFisico(Number(idServicio));
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearServicio,
  listarServicios,
  listarServiciosPublicos,
  obtenerServicioPorId,
  actualizarServicio,
  cambiarEstadoServicio,
  eliminarServicioFisico
};
