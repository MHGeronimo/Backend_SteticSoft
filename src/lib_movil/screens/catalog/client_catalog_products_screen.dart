import 'package:flutter/material.dart';
import 'package:proyectomovil/models/producto.dart';
import 'package:proyectomovil/services/producto_service.dart';
import 'package:proyectomovil/routes/app_routes.dart';
import 'package:proyectomovil/widgets/CartSummary.dart';

class ClientCatalogProductsScreen extends StatefulWidget {
  const ClientCatalogProductsScreen({super.key});

  @override
  _ClientCatalogProductsScreenState createState() =>
      _ClientCatalogProductsScreenState();
}

class _ClientCatalogProductsScreenState
    extends State<ClientCatalogProductsScreen> {
  late Future<List<Producto>> futureProducts;
  late int categoryId;
  late String categoryName;

  final Map<int, int> _cart = {};

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args =
        ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
    categoryId = args['idCategoria'] as int;
    categoryName = args['nombreCategoria'] as String;
    futureProducts = fetchProductsByCategory(categoryId);
  }

  Future<List<Producto>> fetchProductsByCategory(int catId) async {
    return await ProductoService.fetchProductos(categoryId: catId);
  }

  void _incrementProduct(Producto product) {
    setState(() {
      _cart[product.idProducto] = (_cart[product.idProducto] ?? 0) + 1;
    });
  }

  void _decrementProduct(Producto product) {
    setState(() {
      int current = _cart[product.idProducto] ?? 0;
      if (current > 0) {
        _cart[product.idProducto] = current - 1;
      }
    });
  }

  int _totalItems() => _cart.values.fold(0, (sum, qty) => sum + qty);

  double _subtotal(List<Producto> products) {
    double sum = 0.0;
    for (var product in products) {
      int qty = _cart[product.idProducto] ?? 0;
      sum += product.precio * qty;
    }
    return sum;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Productos - $categoryName")),
      body: FutureBuilder<List<Producto>>(
        future: futureProducts,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text("Error: ${snapshot.error}"));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(
              child: Text("No hay productos en esta categoría."),
            );
          } else {
            final products = snapshot.data!;
            return Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: products.length,
                    itemBuilder: (context, index) {
                      final product = products[index];
                      int quantity = _cart[product.idProducto] ?? 0;
                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Row(
                            children: [
                              product.imagen != null && product.imagen!.isNotEmpty
                                  ? Image.network(
                                    product.imagen!,
                                    width: 80,
                                    height: 80,
                                    fit: BoxFit.cover,
                                  )
                                  : const Icon(Icons.image, size: 80),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      product.nombre,
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(product.descripcion ?? ''),
                                    const SizedBox(height: 4),
                                    Text(
                                      "Precio: \$${product.precio % 1 == 0 ? product.precio.toInt() : product.precio.toStringAsFixed(2)}",
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                children: [
                                  ElevatedButton(
                                    onPressed: () => _incrementProduct(product),
                                    style: ElevatedButton.styleFrom(
                                      shape: const CircleBorder(),
                                      padding: const EdgeInsets.all(8),
                                    ),
                                    child: const Icon(Icons.add),
                                  ),
                                  Text(
                                    quantity.toString(),
                                    style: const TextStyle(fontSize: 16),
                                  ),
                                  ElevatedButton(
                                    onPressed: () => _decrementProduct(product),
                                    style: ElevatedButton.styleFrom(
                                      shape: const CircleBorder(),
                                      padding: const EdgeInsets.all(8),
                                    ),
                                    child: const Icon(Icons.remove),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                CartSummary(
                  totalItems: _totalItems(),
                  subtotal: _subtotal(products),
                  onViewCart: () {
                    Navigator.pushNamed(
                      context,
                      AppRoutes.cart,
                      arguments: {"cart": _cart, "products": products},
                    );
                  },
                ),
              ],
            );
          }
        },
      ),
    );
  }
}
