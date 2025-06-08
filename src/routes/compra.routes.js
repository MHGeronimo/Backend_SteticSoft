// src/shared/src_api/routes/compra.routes.js

// CORRECCIÓN: Convertido a CommonJS
const { Router } = require('express');
const compraController = require('../controllers/compra.controller.js');
const authMiddleware = require('../middlewares/auth.middleware.js');
const { createCompraValidators } = require('../validators/compra.validators.js');
const { checkPermission } = require('../middlewares/authorization.middleware.js');

const router = Router();

router.get(
  '/',
  authMiddleware,
  checkPermission('ver compras'),
  compraController.findAllCompras
);

router.get(
  '/:id',
  authMiddleware,
  checkPermission('ver compras'),
  compraController.findCompraById
);

router.post(
  '/',
  authMiddleware,
  checkPermission('gestionar compras'),
  createCompraValidators,
  compraController.createCompra
);

router.patch(
  '/:id/anular',
  authMiddleware,
  checkPermission('gestionar compras'),
  compraController.anularCompra
);

// CORRECCIÓN: Exportando con module.exports
module.exports = router;