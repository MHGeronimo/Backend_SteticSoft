import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:proyectomovil/models/producto.dart';
import 'package:proyectomovil/models/venta.dart';
import 'package:proyectomovil/models/producto_x_venta.dart';
import 'package:proyectomovil/providers/user_provider.dart';
import 'package:proyectomovil/services/venta_service.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  _CartScreenState createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  late Map<int, int> cart;
  late List<Producto> products;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
    cart = Map<int, int>.from(args["cart"] as Map);
    products = List<Producto>.from(args["products"] as List);
  }

  int get totalItems => cart.values.fold(0, (sum, qty) => sum + qty);

  double get subtotal {
    double sum = 0.0;
    for (var product in products) {
      int qty = cart[product.idProducto] ?? 0;
      sum += product.precio * qty;
    }
    return sum;
  }

  Future<void> _confirmOrder() async {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    if (userProvider.user?.clienteInfo?.idCliente == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Usuario no autenticado.")));
      return;
    }
    final int idCliente = userProvider.user!.clienteInfo!.idCliente!;

    final List<ProductoXVenta> productosPedido = cart.entries.map((entry) {
      final product = products.firstWhere((p) => p.idProducto == entry.key);
      return ProductoXVenta(
        idProductoXVenta: 0,
        idProducto: entry.key,
        cantidad: entry.value,
        valorUnitario: product.precio,
        idVenta: 0,
        producto: product,
      );
    }).toList();

    final ventaToCreate = Venta(
      idVenta: 0,
      fecha: DateTime.now().toIso8601String(),
      total: subtotal,
      iva: subtotal * 0.19,
      idCliente: idCliente,
      idEstado: 2,
      productos: productosPedido,
      servicios: [],
      cliente: null,
      estadoDetalle: null,
    );

    try {
      await VentaService.crearVenta(ventaToCreate);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Pedido confirmado correctamente.")));
      Navigator.pushNamedAndRemoveUntil(context, '/orders', (route) => false);
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Error al confirmar pedido.")));
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartProducts = products.where((p) => (cart[p.idProducto] ?? 0) > 0).toList();

    return Scaffold(
      appBar: AppBar(title: const Text("Carrito de Compras")),
      body: cartProducts.isEmpty
          ? const Center(child: Text("El carrito está vacío."))
          : Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: cartProducts.length,
                    itemBuilder: (context, index) {
                      final product = cartProducts[index];
                      final qty = cart[product.idProducto]!;
                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              product.imagen != null && product.imagen!.isNotEmpty
                                  ? Image.network(
                                      product.imagen!,
                                      width: 60,
                                      height: 60,
                                      fit: BoxFit.cover,
                                    )
                                  : const Icon(Icons.image, size: 60),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(product.nombre, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                    const SizedBox(height: 4),
                                    Text("Cantidad: $qty", style: const TextStyle(fontSize: 14)),
                                  ],
                                ),
                              ),
                              Text("\$${(product.precio * qty).toStringAsFixed(2)}", style: const TextStyle(fontSize: 16)),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 5, offset: Offset(0, -3))],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Total Items: $totalItems", style: const TextStyle(fontSize: 16)),
                          Text("Subtotal: \$${subtotal.toStringAsFixed(2)}", style: const TextStyle(fontSize: 16)),
                        ],
                      ),
                      ElevatedButton(
                        onPressed: _confirmOrder,
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                        child: const Text("Confirmar Pedido"),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
