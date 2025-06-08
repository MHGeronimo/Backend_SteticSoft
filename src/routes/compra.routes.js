import { Router } from 'express';
import * as compraController from '../controllers/compra.controller.js';

// CORRECCIÓN 1: 'authMiddleware' se importa sin llaves porque es una exportación por defecto.
import authMiddleware from '../middlewares/auth.middleware.js';

// CORRECCIÓN 2: Se importa directamente el validador que se va a usar.
import { createCompraValidators } from '../validators/compra.validators.js';

import { checkPermission } from '../middlewares/authorization.middleware.js';

const router = Router();

/**
 * @swagger
 * /compras:
 * get:
 * summary: Obtiene todas las compras
 * tags: [Compras]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Lista de compras
 */
router.get(
  '/',
  authMiddleware,
  checkPermission('ver compras'),
  compraController.findAllCompras
);

/**
 * @swagger
 * /compras/{id}:
 * get:
 * summary: Obtiene una compra por ID
 * tags: [Compras]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Detalle de la compra
 */
router.get(
  '/:id',
  authMiddleware,
  checkPermission('ver compras'),
  compraController.findCompraById
);

/**
 * @swagger
 * /compras:
 * post:
 * summary: Crea una nueva compra
 * tags: [Compras]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Compra'
 * responses:
 * 201:
 * description: Compra creada
 */
router.post(
  '/',
  authMiddleware,
  checkPermission('gestionar compras'),
  // CORRECCIÓN 3: Se usa directamente el validador importado.
  createCompraValidators,
  compraController.createCompra
);

/**
 * @swagger
 * /compras/{id}/anular:
 * patch:
 * summary: Anula una compra existente
 * tags: [Compras]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * description: ID de la compra a anular.
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Compra anulada exitosamente.
 * 404:
 * description: La compra no fue encontrada.
 * 409:
 * description: La compra ya ha sido anulada.
 */
router.patch(
  '/:id/anular',
  authMiddleware,
  checkPermission('gestionar compras'),
  compraController.anularCompra // Esta es la corrección que ya habías aplicado y está perfecta.
);

export default router;