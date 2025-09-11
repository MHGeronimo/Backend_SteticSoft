import 'package:flutter/material.dart';
import 'package:proyectomovil/models/cita.dart';

class AppointmentDetailsScreen extends StatelessWidget {
  const AppointmentDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final Object? arguments = ModalRoute.of(context)!.settings.arguments;

    if (arguments == null || arguments is! Cita) {
      return Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: const Center(
          child: Text('No se pudo cargar el detalle de la cita. Argumento inválido.'),
        ),
      );
    }

    final Cita cita = arguments;

    final employeeName = cita.empleado?.empleadoInfo?.nombre != null
      ? '${cita.empleado!.empleadoInfo!.nombre} ${cita.empleado!.empleadoInfo!.apellido}'
      : 'No asignado';

    final clientName = '${cita.cliente?.nombre ?? ''} ${cita.cliente?.apellido ?? ''}';

    return Scaffold(
      appBar: AppBar(
        title: Text('Detalle de Cita #${cita.idCita}'),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            _buildDetailCard(
              'Información General',
              [
                _buildDetailRow('Cliente:', clientName),
                _buildDetailRow('Fecha:', cita.fecha),
                _buildDetailRow('Hora:', cita.horaInicio),
                _buildDetailRow('Estado:', cita.estadoDetalle?.nombreEstado ?? 'N/A'),
                _buildDetailRow('Empleado Asignado:', employeeName),
                _buildDetailRow('Precio Total:', '\$${cita.precioTotal?.toStringAsFixed(2) ?? '0.00'}'),
              ],
            ),
            const SizedBox(height: 16),
            if (cita.servicios.isNotEmpty)
              _buildDetailCard(
                'Servicios Incluidos',
                cita.servicios.map((servicio) => Card(
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  elevation: 1,
                  child: ListTile(
                    leading: const Icon(Icons.cut, color: Colors.blueAccent),
                    title: Text(servicio.nombre, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(servicio.descripcion ?? 'Sin descripción'),
                    trailing: Text('\$${servicio.precio.toStringAsFixed(2)}'),
                  ),
                )).toList(),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailCard(String title, List<Widget> children) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blueAccent),
            ),
            const Divider(height: 20, thickness: 1),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          Flexible(child: Text(value, style: const TextStyle(fontSize: 16), textAlign: TextAlign.end)),
        ],
      ),
    );
  }
}
