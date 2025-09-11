import 'package:flutter/material.dart';
import 'package:proyectomovil/models/venta.dart';
import 'package:intl/intl.dart';

class OrderDetailsScreen extends StatelessWidget {
  const OrderDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final Map arguments = ModalRoute.of(context)?.settings.arguments as Map? ?? {};
    final Venta order = arguments["order"] as Venta;

    return Scaffold(
      appBar: AppBar(
        title: Text("Detalles del Pedido #${order.idVenta}"),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Pedido #${order.idVenta}", style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Text("Estado: ${order.estadoDetalle?.nombreEstado ?? 'N/A'}"),
            const SizedBox(height: 8),
            Text("Total: \$${order.total.toStringAsFixed(2)}"),
            const SizedBox(height: 8),
            Text("Fecha: ${DateFormat('dd/MM/yyyy').format(DateTime.parse(order.fecha))}"),
            const SizedBox(height: 16),
            const Text("Productos:", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Expanded(
              child: ListView.builder(
                itemCount: order.productos?.length ?? 0,
                itemBuilder: (context, index) {
                  final productoVenta = order.productos![index];
                  final subtotal = productoVenta.cantidad * productoVenta.valorUnitario;

                  return Card(
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Nombre: ${productoVenta.producto?.nombre ?? 'N/A'}", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text("Cantidad: ${productoVenta.cantidad}", style: const TextStyle(fontSize: 14)),
                          const SizedBox(height: 4),
                          Text("Precio unitario: \$${productoVenta.valorUnitario.toStringAsFixed(2)}", style: const TextStyle(fontSize: 14)),
                          const SizedBox(height: 4),
                          Text("Subtotal: \$${subtotal.toStringAsFixed(2)}", style: const TextStyle(fontSize: 14)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
