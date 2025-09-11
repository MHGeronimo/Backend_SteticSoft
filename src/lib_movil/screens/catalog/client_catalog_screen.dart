import 'package:flutter/material.dart';
import 'package:proyectomovil/models/categoria_producto.dart';
import 'package:proyectomovil/services/categoria_producto_service.dart';
import 'package:proyectomovil/routes/app_routes.dart';
import 'package:proyectomovil/widgets/custom_navbar.dart';
import 'package:provider/provider.dart';
import 'package:proyectomovil/providers/user_provider.dart';

class ClientCatalogScreen extends StatefulWidget {
  const ClientCatalogScreen({super.key});

  @override
  _ClientCatalogScreenState createState() => _ClientCatalogScreenState();
}

class _ClientCatalogScreenState extends State<ClientCatalogScreen> {
  late Future<List<CategoriaProducto>> futureCategories;

  @override
  void initState() {
    super.initState();
    futureCategories = CategoriaProductoService.fetchProductCategories();
  }

  void navigateToProducts(int categoryId, String categoryName) {
    Navigator.pushNamed(
      context,
      AppRoutes.catalogClientProducts,
      arguments: {'idCategoria': categoryId, 'nombreCategoria': categoryName},
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Consumer<UserProvider>(
          builder: (context, userProvider, child) {
            if (userProvider.user != null) {
              return Text("Catálogo - ${userProvider.user!.clienteInfo?.nombre}");
            }
            return const Text("Catálogo Clientes");
          },
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            child: Text(
              "¿Qué categoría te gustaría ver?",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
          ),
          Expanded(
            child: FutureBuilder<List<CategoriaProducto>>(
              future: futureCategories,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                } else if (snapshot.hasError) {
                  return Center(child: Text("Error: ${snapshot.error}"));
                } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  return const Center(child: Text("No hay categorías disponibles."));
                } else {
                  final categories = snapshot.data!;
                  return GridView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 16,
                          crossAxisSpacing: 16,
                          childAspectRatio: 1.2,
                        ),
                    itemCount: categories.length,
                    itemBuilder: (context, index) {
                      final category = categories[index];
                      return GestureDetector(
                        onTap:
                            () => navigateToProducts(
                              category.idCategoriaProducto,
                              category.nombre,
                            ),
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            border: Border.all(color: Colors.blueAccent),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                category.nombre,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                category.descripcion ?? "Categoría del catálogo",
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Colors.black87,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                }
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: const CustomNavBar(currentIndex: 1),
    );
  }
}
