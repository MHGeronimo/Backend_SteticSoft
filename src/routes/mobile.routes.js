const express = require('express');
const router = express.Router();
const mobileCtrl = require('../controllers/mobile.controller');
const auth = require('../middlewares/auth.middleware'); // ajusta al nombre real

router.post('/login', mobileCtrl.loginUsuarioMovil);
router.post('/registro', mobileCtrl.registrarUsuarioMovil);

router.get('/perfil', auth, mobileCtrl.getMiPerfilMovil);
router.put('/perfil', auth, mobileCtrl.updateMiPerfilMovil);

router.get('/servicios', mobileCtrl.listarServiciosPublicosMovil);
router.get('/productos', mobileCtrl.listarProductosPublicosMovil);
router.get('/categorias/servicios', mobileCtrl.listarCategoriasServicioPublicasMovil);
router.get('/categorias/productos', mobileCtrl.listarCategoriasProductoPublicasMovil);

router.get('/citas', auth, mobileCtrl.listarMisCitasMovil);
router.post('/citas', auth, mobileCtrl.crearMiCitaMovil);
router.get('/citas/disponibilidad/novedades', mobileCtrl.listarNovedadesAgendablesMovil);
router.get('/citas/disponibilidad/dias', mobileCtrl.listarDiasDisponiblesMovil);
router.get('/citas/disponibilidad/horas', mobileCtrl.listarHorasDisponiblesMovil);
router.patch('/citas/:idCita/cancelar', auth, mobileCtrl.cancelarMiCitaMovil);

router.get('/ventas', auth, mobileCtrl.listarMisVentasMovil);

module.exports = router;