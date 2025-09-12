const authService = require("../services/auth.service");
const clienteService = require("../services/cliente.service");
const servicioService = require("../services/servicio.service");
const productoService = require("../services/producto.service");
const categoriaService = require("../services/categoria.service");
const citaService = require("../services/cita.service");
const ventaService = require("../services/venta.service");

async function loginUsuarioMovil(req, res, next) {
  try {
    const { email, password } = req.body;
    const { token, usuario } = await authService.login({ email, password });
    const clienteInfo = await clienteService.getPerfilClientePorUsuarioId(
      usuario.id
    );
    res.json({ token, permisos: usuario?.permisos || [], clienteInfo });
  } catch (e) {
    next(e);
  }
}

async function registrarUsuarioMovil(req, res, next) {
  try {
    const usuario = await authService.registrar({
      ...req.body,
      rol: "Cliente",
    });
    res.status(201).json(usuario);
  } catch (e) {
    next(e);
  }
}

async function getMiPerfilMovil(req, res, next) {
  try {
    const clienteInfo = await clienteService.getPerfilClientePorUsuarioId(
      req.user.id
    );
    res.json(clienteInfo);
  } catch (e) {
    next(e);
  }
}

async function updateMiPerfilMovil(req, res, next) {
  try {
    const updated = await clienteService.updatePerfilClientePorUsuarioId(
      req.user.id,
      req.body
    );
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

async function listarServiciosPublicosMovil(req, res, next) {
  try {
    const servicios = await servicioService.listarActivosPublicos();
    res.json(servicios);
  } catch (e) {
    next(e);
  }
}

async function listarProductosPublicosMovil(req, res, next) {
  try {
    const productos = await productoService.listarActivosExternosPublicos();
    res.json(productos);
  } catch (e) {
    next(e);
  }
}

async function listarCategoriasServicioPublicasMovil(req, res, next) {
  try {
    const categorias =
      await categoriaService.listarCategoriasServicioPublicas();
    res.json(categorias);
  } catch (e) {
    next(e);
  }
}

async function listarCategoriasProductoPublicasMovil(req, res, next) {
  try {
    const categorias =
      await categoriaService.listarCategoriasProductoPublicas();
    res.json(categorias);
  } catch (e) {
    next(e);
  }
}

async function listarMisCitasMovil(req, res, next) {
  try {
    const citas = await citaService.listarPorCliente(req.user.clienteId);
    res.json(citas);
  } catch (e) {
    next(e);
  }
}

async function crearMiCitaMovil(req, res, next) {
  try {
    const created = await citaService.crearParaCliente(
      req.user.clienteId,
      req.body
    );
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
}

async function listarNovedadesAgendablesMovil(req, res, next) {
  try {
    const novedades = await citaService.listarNovedadesAgendables();
    res.json(novedades);
  } catch (e) {
    next(e);
  }
}

async function listarDiasDisponiblesMovil(req, res, next) {
  try {
    const { novedadId, mes, anio } = req.query;
    const dias = await citaService.listarDiasDisponibles(novedadId, mes, anio);
    res.json(dias);
  } catch (e) {
    next(e);
  }
}

async function listarHorasDisponiblesMovil(req, res, next) {
  try {
    const { novedadId, fecha } = req.query;
    const horas = await citaService.listarHorasDisponibles(novedadId, fecha);
    res.json(horas);
  } catch (e) {
    next(e);
  }
}

async function cancelarMiCitaMovil(req, res, next) {
  try {
    const { idCita } = req.params;
    const updated = await citaService.cancelarCitaDeCliente(
      req.user.clienteId,
      idCita
    );
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

async function listarMisVentasMovil(req, res, next) {
  try {
    const ventas = await ventaService.listarPorCliente(req.user.clienteId);
    res.json(ventas);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  loginUsuarioMovil,
  registrarUsuarioMovil,
  getMiPerfilMovil,
  updateMiPerfilMovil,
  listarServiciosPublicosMovil,
  listarProductosPublicosMovil,
  listarCategoriasServicioPublicasMovil,
  listarCategoriasProductoPublicasMovil,
  listarMisCitasMovil,
  crearMiCitaMovil,
  listarNovedadesAgendablesMovil,
  listarDiasDisponiblesMovil,
  listarHorasDisponiblesMovil,
  cancelarMiCitaMovil,
  listarMisVentasMovil,
};
