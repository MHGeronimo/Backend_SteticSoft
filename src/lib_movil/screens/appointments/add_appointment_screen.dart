import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:proyectomovil/models/cita.dart';
import 'package:proyectomovil/models/empleado.dart';
import 'package:proyectomovil/models/servicio.dart';
import 'package:proyectomovil/models/novedad.dart';
import 'package:proyectomovil/providers/user_provider.dart';
import 'package:proyectomovil/services/cita_service.dart';
import 'package:proyectomovil/services/empleado_service.dart';
import 'package:proyectomovil/services/servicio_service.dart';
import '../../services/novedad_service.dart';
import 'package:proyectomovil/widgets/custom_navbar.dart';

class AddAppointmentScreen extends StatefulWidget {
  const AddAppointmentScreen({super.key});

  @override
  _AddAppointmentScreenState createState() => _AddAppointmentScreenState();
}

class _AddAppointmentScreenState extends State<AddAppointmentScreen> {
  final _formKey = GlobalKey<FormState>();

  DateTime? selectedDate;
  TimeOfDay? selectedTime;
  Empleado? selectedEmpleado;
  Novedad? selectedNovedad;
  List<Servicio> selectedServicios = [];

  bool isSubmitting = false;

  List<Empleado> empleados = [];
  List<Servicio> serviciosDisponibles = [];
  List<Novedad> novedadesDisponibles = [];

  @override
  void initState() {
    super.initState();
    fetchInitialData();
  }

  Future<void> fetchInitialData() async {
    try {
      final fetchedEmpleados = await EmpleadoService.fetchEmpleados();
      final fetchedServicios = await ServicioService.fetchServicios();
      final fetchedNovedades = await NovedadService.fetchAgendableNovedades();
      setState(() {
        empleados = fetchedEmpleados;
        serviciosDisponibles = fetchedServicios;
        novedadesDisponibles = fetchedNovedades;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cargar datos iniciales: $e')),
        );
      }
    }
  }

  Future<void> _pickDateTime() async {
    final DateTime? date = await showDatePicker(
      context: context,
      initialDate: selectedDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date == null) return;

    final TimeOfDay? time = await showTimePicker(
      context: context,
      initialTime: selectedTime ?? TimeOfDay.now(),
    );
    if (time == null) return;

    setState(() {
      selectedDate = date;
      selectedTime = time;
    });
  }

  Future<void> _saveAppointment() async {
    if (!_formKey.currentState!.validate()) return;

    if (selectedDate == null || selectedTime == null || selectedServicios.isEmpty || selectedNovedad == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Por favor, complete todos los campos.")),
      );
      return;
    }

    _formKey.currentState!.save();

    setState(() {
      isSubmitting = true;
    });

    final userProvider = Provider.of<UserProvider>(context, listen: false);
    final idCliente = userProvider.user?.clienteInfo?.idCliente;

    if (idCliente == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Error de autenticación de cliente.")),
      );
      setState(() {
        isSubmitting = false;
      });
      return;
    }

    final citaToCreate = Cita(
      idCita: 0, // Handled by backend
      fecha: DateFormat('yyyy-MM-dd').format(selectedDate!),
      horaInicio: '${selectedTime!.hour.toString().padLeft(2, '0')}:${selectedTime!.minute.toString().padLeft(2, '0')}',
      idCliente: idCliente,
      idEstado: 2, // 2 = Pendiente
      idUsuario: selectedEmpleado?.idUsuario,
      idNovedad: selectedNovedad!.idNovedad,
      servicios: selectedServicios,
      estadoDetalle: null,
      cliente: null,
      empleado: null,
      novedad: null,
      precioTotal: null,
    );

    try {
      await CitaService.crearCita(citaToCreate);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Cita creada exitosamente")),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error al crear la cita: $e")),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final String displayDateTime = (selectedDate == null || selectedTime == null)
        ? "Seleccione fecha y hora"
        : DateFormat("dd/MM/yyyy 'a las' HH:mm", "es").format(
            DateTime(selectedDate!.year, selectedDate!.month, selectedDate!.day, selectedTime!.hour, selectedTime!.minute)
          );

    return Scaffold(
      appBar: AppBar(title: const Text("Agendar Nueva Cita")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GestureDetector(
                onTap: _pickDateTime,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Fecha y Hora',
                    border: OutlineInputBorder(),
                  ),
                  child: Text(displayDateTime, style: const TextStyle(fontSize: 16)),
                ),
              ),
              const SizedBox(height: 24),
              const Text("Servicios", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ...selectedServicios.map((svc) => ListTile(
                    title: Text(svc.nombre),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete, color: Colors.red),
                      onPressed: () => setState(() => selectedServicios.remove(svc)),
                    ),
                  )),
              if (serviciosDisponibles.isEmpty) const Center(child: CircularProgressIndicator())
              else OutlinedButton.icon(
                icon: const Icon(Icons.add),
                label: const Text("Agregar Servicio"),
                onPressed: () async {
                  final Servicio? selected = await showDialog(
                    context: context,
                    builder: (context) => SimpleDialog(
                      title: const Text("Seleccione un Servicio"),
                      children: serviciosDisponibles.map((svc) => SimpleDialogOption(
                        onPressed: () => Navigator.pop(context, svc),
                        child: Text(svc.nombre),
                      )).toList(),
                    ),
                  );
                  if (selected != null && !selectedServicios.any((s) => s.idServicio == selected.idServicio)) {
                    setState(() => selectedServicios.add(selected));
                  }
                },
              ),
              const SizedBox(height: 24),
              if (novedadesDisponibles.isEmpty) const Center(child: CircularProgressIndicator())
              else DropdownButtonFormField<Novedad>(
                value: selectedNovedad,
                decoration: const InputDecoration(
                  labelText: 'Horario de Novedad',
                  border: OutlineInputBorder(),
                ),
                items: novedadesDisponibles.map((nov) => DropdownMenuItem<Novedad>(
                  value: nov,
                  child: Text('Del ${nov.fechaInicio} al ${nov.fechaFin}'),
                )).toList(),
                onChanged: (value) => setState(() => selectedNovedad = value),
                validator: (value) => value == null ? 'Campo requerido' : null,
              ),
              const SizedBox(height: 24),

              if (empleados.isEmpty) const Center(child: CircularProgressIndicator())
              else DropdownButtonFormField<Empleado>(
                value: selectedEmpleado,
                decoration: const InputDecoration(
                  labelText: 'Empleado (opcional)',
                  border: OutlineInputBorder(),
                ),
                items: empleados.map((emp) => DropdownMenuItem<Empleado>(
                  value: emp,
                  child: Text('${emp.nombre} ${emp.apellido}'),
                )).toList(),
                onChanged: (value) => setState(() => selectedEmpleado = value),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                  onPressed: isSubmitting ? null : _saveAppointment,
                  child: isSubmitting
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text("Guardar Cita", style: TextStyle(fontSize: 18)),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const CustomNavBar(currentIndex: 3),
    );
  }
}
