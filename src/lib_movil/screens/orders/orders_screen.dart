import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:proyectomovil/models/venta.dart';
import 'package:proyectomovil/routes/app_routes.dart';
import 'package:proyectomovil/services/venta_service.dart';
import 'package:proyectomovil/providers/hidden_orders_provider.dart';
import 'package:proyectomovil/widgets/custom_navbar.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  _OrdersScreenState createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  late Future<List<Venta>> futureOrders;

  @override
  void initState() {
    super.initState();
    futureOrders = _fetchOrders();
  }

  Future<List<Venta>> _fetchOrders() async {
    try {
      final orders = await VentaService.fetchMisVentasMovil();
      orders.sort((a, b) {
        int priority(String? estado) {
          final s = estado?.toLowerCase().trim() ?? '';
          if (s == "en proceso" || s == "pendiente") return 0;
          if (s == "cancelado") return 1;
          if (s == "completado") return 2;
          return 3;
        }
        final pDiff = priority(a.estadoDetalle?.nombreEstado) - priority(b.estadoDetalle?.nombreEstado);
        if (pDiff != 0) return pDiff;
        return DateTime.parse(b.fecha).compareTo(DateTime.parse(a.fecha));
      });
      return orders;
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cargar los pedidos: $e')),
        );
      }
      return [];
    }
  }

  String _formatDate(String date) {
    return DateFormat('dd/MM/yyyy').format(DateTime.parse(date));
  }

  Future<void> _cancelOrder(Venta order) async {
    final estado = order.estadoDetalle?.nombreEstado.toLowerCase().trim() ?? '';
    if (estado != "pendiente" && estado != "en proceso") {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("El pedido no puede ser cancelado.")),
      );
      return;
    }

    bool? confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Cancelar Pedido"),
        content: const Text("¿Estás seguro de que deseas cancelar este pedido?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("No")),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text("Sí")),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await VentaService.cancelarVenta(order.idVenta);
      setState(() {
        futureOrders = _fetchOrders();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Pedido cancelado exitosamente.")),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error al cancelar el pedido: $e")),
      );
    }
  }

  void _removeOrder(Venta order) {
    final hiddenOrdersProvider = Provider.of<HiddenOrdersProvider>(context, listen: false);
    hiddenOrdersProvider.hideOrder(order.idVenta);
  }

  void _viewOrderDetails(Venta order) {
    Navigator.pushNamed(
      context,
      AppRoutes.orderDetails,
      arguments: {"order": order},
    );
  }

  @override
  Widget build(BuildContext context) {
    final hiddenOrdersProvider = Provider.of<HiddenOrdersProvider>(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text("Mis Pedidos"),
        centerTitle: true,
        automaticallyImplyLeading: false,
      ),
      body: FutureBuilder<List<Venta>>(
        future: futureOrders,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text("Error: ${snapshot.error}"));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text("No tienes pedidos."));
          } else {
            final orders = snapshot.data!.where((order) => !hiddenOrdersProvider.isHidden(order.idVenta)).toList();

            if (orders.isEmpty) {
              return const Center(child: Text("No tienes pedidos visibles."));
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: orders.length,
              itemBuilder: (context, index) {
                final order = orders[index];
                final estadoLower = order.estadoDetalle?.nombreEstado.toLowerCase().trim() ?? '';

                Color cardColor = Colors.white;
                if (estadoLower == "completado") {
                  cardColor = Colors.green.shade100;
                } else if (estadoLower == "cancelado") {
                  cardColor = Colors.grey.shade300;
                }

                return Card(
                  elevation: 4,
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  color: cardColor,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Pedido #${order.idVenta}", style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Text("Estado: ${order.estadoDetalle?.nombreEstado ?? 'N/A'}"),
                        const SizedBox(height: 8),
                        Text("Total: \$${order.total.toStringAsFixed(2)}"),
                        const SizedBox(height: 8),
                        Text("Fecha: ${_formatDate(order.fecha)}"),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            ElevatedButton(
                              onPressed: estadoLower == "cancelado" ? null : () => _viewOrderDetails(order),
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.blueAccent),
                              child: const Text("Ver detalles"),
                            ),
                            const SizedBox(width: 8),
                            if (estadoLower == "pendiente" || estadoLower == "en proceso")
                              ElevatedButton(
                                onPressed: () => _cancelOrder(order),
                                style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
                                child: const Text("Cancelar pedido"),
                              ),
                            if (estadoLower == "cancelado")
                              ElevatedButton(
                                onPressed: () => _removeOrder(order),
                                style: ElevatedButton.styleFrom(backgroundColor: Colors.deepOrange),
                                child: const Text("Ocultar"),
                              ),
                          ],
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
      bottomNavigationBar: const CustomNavBar(currentIndex: 2),
    );
  }
}
