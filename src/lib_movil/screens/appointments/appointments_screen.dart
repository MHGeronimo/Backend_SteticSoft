import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:proyectomovil/models/cita.dart';
import 'package:proyectomovil/providers/user_provider.dart';
import 'package:proyectomovil/routes/app_routes.dart';
import 'package:proyectomovil/services/cita_service.dart';
import 'package:proyectomovil/widgets/custom_navbar.dart';
import 'package:proyectomovil/providers/hidden_appointments_provider.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  _AppointmentsScreenState createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  late Future<List<Cita>> appointmentsFuture;

  // Note: The backend returns date and time separately.
  // We will format them for display.
  final DateFormat dateFormat = DateFormat("dd/MM/yyyy", "es");
  final DateFormat timeFormat = DateFormat("HH:mm", "es");

  @override
  void initState() {
    super.initState();
    // Use a post-frame callback to access the provider safely.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      setState(() {
        appointmentsFuture = fetchAppointments();
      });
    });
  }

  Future<List<Cita>> fetchAppointments() async {
    // Ensure the provider is ready before using it.
    if (!mounted) return [];
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    final idCliente = userProvider.user?.clienteInfo?.idCliente;

    if (idCliente == null) {
      // Return an empty list if there is no client ID
      return [];
    }

    try {
      // Use the refactored service method
      return await CitaService.obtenerCitas(idCliente: idCliente);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cargar citas: $e')),
        );
      }
      return [];
    }
  }

  Future<void> _cancelarCita(Cita appointment) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Confirmar cancelación"),
        content: const Text("¿Estás seguro de que deseas cancelar esta cita?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text("No"),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text("Sí, Cancelar"),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        // ID 4 corresponds to "Cancelada" state in the backend
        await CitaService.cambiarEstadoCita(appointment.idCita, 4);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Cita cancelada exitosamente")),
          );
          setState(() {
            appointmentsFuture = fetchAppointments();
          });
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text("Error al cancelar la cita: $e")),
          );
        }
      }
    }
  }

  void _removeAppointment(Cita appointment) {
    final hiddenAppointmentsProvider =
        Provider.of<HiddenAppointmentsProvider>(context, listen: false);
    hiddenAppointmentsProvider.hideAppointment(appointment.idCita);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Cita eliminada del listado.")),
    );
  }

  void _viewAppointmentDetail(Cita appointment) {
    Navigator.pushNamed(
      context,
      AppRoutes.appointmentDetails,
      arguments: appointment,
    );
  }

  @override
  Widget build(BuildContext context) {
    final hiddenAppointmentsProvider =
        Provider.of<HiddenAppointmentsProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Mis Citas"),
        centerTitle: true,
        automaticallyImplyLeading: false,
      ),
      body: FutureBuilder<List<Cita>>(
        future: appointmentsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(
              child: Text("Error: ${snapshot.error}"),
            );
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(
              child: Text("No tienes citas registradas."),
            );
          } else {
            final allAppointments = snapshot.data!;
            final visibleAppointments = allAppointments
                .where((appointment) =>
                    !hiddenAppointmentsProvider.isHidden(appointment.idCita))
                .toList();

            if (visibleAppointments.isEmpty) {
              return const Center(
                child: Text("Todas las citas están ocultas."),
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: visibleAppointments.length,
              itemBuilder: (context, index) {
                final appointment = visibleAppointments[index];
                final estadoNombre = appointment.estadoDetalle?.nombreEstado ?? 'N/A';

                Color cardColor;
                switch (estadoNombre) {
                  case "Finalizada":
                    cardColor = Colors.green.shade100;
                    break;
                  case "Cancelada":
                    cardColor = Colors.grey.shade300;
                    break;
                  case "Activa":
                  case "En Proceso":
                    cardColor = Colors.orange.shade100;
                    break;
                  default:
                    cardColor = Colors.white;
                }

                final bool canBeCancelled = estadoNombre == "Activa" || estadoNombre == "En Proceso";
                final bool showRemoveButton = estadoNombre == "Cancelada" || estadoNombre == "Finalizada";

                // Safely access employee name
                final employeeName = appointment.empleado?.empleadoInfo?.nombre != null
                  ? '${appointment.empleado!.empleadoInfo!.nombre} ${appointment.empleado!.empleadoInfo!.apellido}'
                  : 'No asignado';

                return Card(
                  elevation: 4,
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  color: cardColor,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Cita #${appointment.idCita}",
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          // Format date and time for display
                          "Fecha: ${dateFormat.format(DateTime.parse(appointment.fecha))} a las ${appointment.horaInicio}",
                          style: const TextStyle(fontSize: 16),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Estado: $estadoNombre",
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: estadoNombre == "Cancelada"
                                ? Colors.red.shade800
                                : estadoNombre == "Finalizada"
                                    ? Colors.green.shade800
                                    : Colors.orange.shade800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Empleado: $employeeName",
                          style: const TextStyle(fontSize: 16),
                        ),
                        const SizedBox(height: 4),
                        if (appointment.servicios.isNotEmpty)
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                "Servicios:",
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              ...appointment.servicios.map(
                                (servicio) => Text(
                                  "- ${servicio.nombre} (\$${servicio.precio.toStringAsFixed(2)})",
                                  style: const TextStyle(fontSize: 15),
                                ),
                              ),
                            ],
                          ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            ElevatedButton(
                              onPressed: () => _viewAppointmentDetail(appointment),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.blueAccent,
                                foregroundColor: Colors.white,
                              ),
                              child: const Text("Ver detalles"),
                            ),
                            const SizedBox(width: 8),
                            if (canBeCancelled)
                              ElevatedButton(
                                onPressed: () => _cancelarCita(appointment),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.redAccent,
                                  foregroundColor: Colors.white,
                                ),
                                child: const Text("Cancelar"),
                              ),
                            if (showRemoveButton)
                              ElevatedButton(
                                onPressed: () => _removeAppointment(appointment),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.deepOrange,
                                  foregroundColor: Colors.white,
                                ),
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
      floatingActionButton: FloatingActionButton(
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        onPressed: () async {
          final result = await Navigator.pushNamed(
            context,
            AppRoutes.addAppointment,
          );
          if (result == true) {
            setState(() {
              appointmentsFuture = fetchAppointments();
            });
          }
        },
        child: const Icon(Icons.add),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      bottomNavigationBar: const CustomNavBar(
        currentIndex: 3,
      ),
    );
  }
}
