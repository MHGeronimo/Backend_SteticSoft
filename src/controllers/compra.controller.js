// src/shared/src_api/controllers/compra.controller.js

// CORRECCIÓN: Convertido a CommonJS
const compraService = require('../services/compra.service.js');

const createCompra = async (req, res, next) => {
  try {
    const compra = await compraService.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Compra creada exitosamente',
      data: compra
    });
  } catch (error) {
    next(error);
  }
};

const findAllCompras = async (req, res, next) => {
  try {
    const compras = await compraService.findAll();
    res.status(200).json({
      success: true,
      data: compras
    });
  } catch (error) {
    next(error);
  }
};

const findCompraById = async (req, res, next) => {
  try {
    const compra = await compraService.findById(req.params.id);
    res.status(200).json({
      success: true,
      data: compra
    });
  } catch (error) {
    next(error);
  }
};

const anularCompra = async (req, res, next) => {
  try {
    const { id } = req.params;
    const compraAnulada = await compraService.anular(id);
    res.status(200).json({
        success: true,
        message: 'Compra anulada exitosamente',
        data: compraAnulada
    });
  } catch (error) {
    next(error);
  }
};

// CORRECCIÓN: Exportando con module.exports
module.exports = {
  createCompra,
  findAllCompras,
  findCompraById,
  anularCompra
};