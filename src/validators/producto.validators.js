const { body, param } = require("express-validator");
const { handleValidationErrors } = require("../middlewares/validation.middleware.js");
const db = require("../models");

const crearProductoValidators = [
    body("nombre")
        .trim()
        .notEmpty().withMessage("El nombre del producto es obligatorio.")
        .isString().withMessage("El nombre del producto debe ser texto.")
        .isLength({ min: 3, max: 45 }).withMessage("El nombre del producto debe tener entre 3 y 45 caracteres."),

    body("descripcion")
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isString().withMessage("La descripción debe ser texto."),

    // --- VALIDACIONES NUEVAS AÑADIDAS ---
    body("tipoUso")
        .optional()
        .isIn(['Interno', 'Venta Directa', 'Otro'])
        .withMessage("El tipo de uso debe ser 'Interno', 'Venta Directa' u 'Otro'."),

    body("vidaUtilDias")
        .optional({ nullable: true })
        .isInt({ min: 0 })
        .withMessage("La vida útil debe ser un número entero no negativo."),
    // --- FIN DE VALIDACIONES NUEVAS ---

    body("existencia")
        .optional({ nullable: true })
        .isInt({ min: 0 }).withMessage("La existencia debe ser un número entero no negativo.")
        .toInt(),

    body("precio")
        .optional({ nullable: true })
        .isFloat({ gt: -0.01 }).withMessage("El precio debe ser un número no negativo.")
        .toFloat(),

    body("stockMinimo")
        .optional({ nullable: true })
        .isInt({ min: 0 }).withMessage("El stock mínimo debe ser un número entero no negativo.")
        .toInt(),

    body("stockMaximo")
        .optional({ nullable: true })
        .isInt({ min: 0 }).withMessage("El stock máximo debe ser un número entero no negativo.")
        .toInt()
        .custom((value, { req }) => {
            if (req.body.stockMinimo !== undefined && value < req.body.stockMinimo) {
                throw new Error("El stock máximo no puede ser menor que el stock mínimo.");
            }
            return true;
        }),

    body("imagen")
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isString().withMessage("La URL de la imagen debe ser texto.")
        .isURL().withMessage("Debe proporcionar una URL válida para la imagen del producto (si se incluye)."),

    body("estado")
        .optional()
        .isBoolean().withMessage("El estado debe ser un valor booleano (true o false)."),

    body("categoriaProductoId")
        .optional({ nullable: true })
        .isInt({ gt: 0 }).withMessage("El ID de la categoría de producto debe ser un entero positivo si se proporciona.")
        .custom(async (value) => {
            if (value) {
                const categoria = await db.CategoriaProducto.findByPk(value);
                if (!categoria) {
                    throw new Error("La categoría de producto especificada no existe.");
                }
                if (!categoria.estado) {
                    throw new Error("La categoría de producto especificada no está activa.");
                }
            }
        }),
        
    handleValidationErrors,
];

const actualizarProductoValidators = [
    param("idProducto")
        .isInt({ gt: 0 }).withMessage("El ID del producto debe ser un entero positivo."),

    body("nombre")
        .optional()
        .trim()
        .notEmpty().withMessage("El nombre del producto no puede estar vacío si se proporciona.")
        .isString().withMessage("El nombre del producto debe ser texto.")
        .isLength({ min: 3, max: 45 }).withMessage("El nombre del producto debe tener entre 3 y 45 caracteres."),

    body("descripcion")
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isString().withMessage("La descripción debe ser texto."),

    // --- VALIDACIONES NUEVAS AÑADIDAS ---
    body("tipoUso")
        .optional()
        .isIn(['Interno', 'Venta Directa', 'Otro'])
        .withMessage("El tipo de uso debe ser 'Interno', 'Venta Directa' u 'Otro'."),

    body("vidaUtilDias")
        .optional({ nullable: true })
        .isInt({ min: 0 })
        .withMessage("La vida útil debe ser un número entero no negativo."),
    // --- FIN DE VALIDACIONES NUEVAS ---
    
    body("existencia")
        .optional({ nullable: true })
        .isInt({ min: 0 }).withMessage("La existencia debe ser un número entero no negativo.")
        .toInt(),

    body("precio")
        .optional({ nullable: true })
        .isFloat({ gt: -0.01 }).withMessage("El precio debe ser un número no negativo.")
        .toFloat(),

    body("stockMinimo")
        .optional({ nullable: true })
        .isInt({ min: 0 }).withMessage("El stock mínimo debe ser un número entero no negativo.")
        .toInt(),

    body("stockMaximo")
        .optional({ nullable: true })
        .isInt({ min: 0 }).withMessage("El stock máximo debe ser un número entero no negativo.")
        .toInt()
        .custom((value, { req }) => {
            const stockMinimoBody = req.body.stockMinimo;
            if (stockMinimoBody !== undefined && value < stockMinimoBody) {
                throw new Error("El stock máximo no puede ser menor que el stock mínimo proporcionado.");
            }
            return true;
        }),

    body("imagen")
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isString().withMessage("La URL de la imagen debe ser texto.")
        .isURL().withMessage("Debe proporcionar una URL válida para la imagen (si se actualiza)."),

    body("estado")
        .optional()
        .isBoolean().withMessage("El estado debe ser un valor booleano (true o false)."),

    body("categoriaProductoId")
        .optional({ nullable: true })
        .custom(async (value) => {
            if (value !== null && value !== undefined) {
                if (!(Number.isInteger(value) && value > 0)) {
                    throw new Error("El ID de la categoría de producto debe ser un entero positivo o null.");
                }
                const categoria = await db.CategoriaProducto.findByPk(value);
                if (!categoria) {
                    throw new Error("La categoría de producto especificada para actualizar no existe.");
                }
                if (!categoria.estado) {
                    throw new Error("La categoría de producto especificada para actualizar no está activa.");
                }
            }
            return true;
        }),

    handleValidationErrors,
];

const idProductoValidator = [
    param("idProducto")
        .isInt({ gt: 0 }).withMessage("El ID del producto debe ser un entero positivo."),
    handleValidationErrors,
];

const cambiarEstadoProductoValidators = [
    param("idProducto")
        .isInt({ gt: 0 }).withMessage("El ID del producto debe ser un entero positivo."),
    body("estado")
        .exists({ checkFalsy: false }).withMessage("El campo 'estado' es obligatorio en el cuerpo de la solicitud.")
        .isBoolean().withMessage("El valor de 'estado' debe ser un booleano (true o false)."),
    handleValidationErrors,
];

module.exports = {
    crearProductoValidators,
    actualizarProductoValidators,
    idProductoValidator,
    cambiarEstadoProductoValidators,
};