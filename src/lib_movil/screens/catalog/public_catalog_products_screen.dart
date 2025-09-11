import 'package:flutter/material.dart';
import 'package:proyectomovil/models/producto.dart';
import 'package:proyectomovil/services/producto_service.dart';
import 'package:proyectomovil/routes/app_routes.dart';

class PublicCatalogProductsScreen extends StatefulWidget {
  const PublicCatalogProductsScreen({super.key});

  @override
  _PublicCatalogProductsScreenState createState() =>
      _PublicCatalogProductsScreenState();
}

class _PublicCatalogProductsScreenState
    extends State<PublicCatalogProductsScreen> {
  late Future<List<Producto>> futureProducts;
  late int categoryId;
  late String categoryName;

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
    final List<Producto> allProducts = await ProductoService.fetchPublicProducts();
    return allProducts.where((p) => p.idCategoriaProducto == catId).toList();
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
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: products.length,
              itemBuilder: (context, index) {
                final product = products[index];
                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  child: ListTile(
                    leading:
                        product.imagen != null && product.imagen!.isNotEmpty
                            ? Image.network(
                              product.imagen!,
                              width: 50,
                              height: 50,
                              fit: BoxFit.cover,
                            )
                            : const Icon(Icons.image, size: 50),
                    title: Text(product.nombre),
                    subtitle: Text(
                      "Precio: \$${product.precio % 1 == 0 ? product.precio.toInt() : product.precio.toStringAsFixed(2)}",
                    ),
                    trailing: ElevatedButton(
                      onPressed: () {
                        Navigator.pushNamed(context, AppRoutes.login);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.black,
                      ),
                      child: const Text("+ Agregar"),
                    ),
                  ),
                );
              },
            );
          }
        },
      ),
    );
  }
}
