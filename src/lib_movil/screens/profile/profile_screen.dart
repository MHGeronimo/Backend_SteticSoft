import 'package:flutter/material.dart';
import 'package:proyectomovil/models/cliente.dart';
import 'package:proyectomovil/services/cliente_service.dart';
import 'package:proyectomovil/services/auth_service.dart';
import 'package:proyectomovil/routes/app_routes.dart';
import 'package:proyectomovil/widgets/custom_navbar.dart';
import 'package:provider/provider.dart';
import 'package:proyectomovil/providers/user_provider.dart';
import 'package:intl/intl.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  _ProfileScreenState createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late Future<Cliente> futureProfile;

  @override
  void initState() {
    super.initState();
    futureProfile = fetchProfile();
  }

  Future<Cliente> fetchProfile() async {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    final idCliente = userProvider.user?.clienteInfo?.idCliente;
    if (idCliente == null) {
      throw Exception("Usuario no autenticado.");
    }
    return ClienteService.fetchClienteById(idCliente.toString());
  }

  void logout() async {
    final authService = AuthService();
    await authService.logout();
    Navigator.pushReplacementNamed(context, AppRoutes.login);
  }

  Widget _buildProfileField(String label, String value) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 14, color: Colors.grey),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        const Divider(color: Colors.black, thickness: 1),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Perfil")),
      body: FutureBuilder<Cliente>(
        future: futureProfile,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text("Error: ${snapshot.error}"));
          }

          final profile = snapshot.data!;
          final formattedDate = DateFormat('dd/MM/yyyy').format(DateTime.parse(profile.fechaNacimiento));

          return Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildProfileField("Nombre", profile.nombre),
                  const SizedBox(height: 16),
                  _buildProfileField("Apellido", profile.apellido),
                  const SizedBox(height: 16),
                  _buildProfileField("Correo", profile.correo),
                  const SizedBox(height: 16),
                  _buildProfileField("Teléfono", profile.telefono),
                  const SizedBox(height: 16),
                  _buildProfileField("Documento", '${profile.tipoDocumento} ${profile.numeroDocumento}'),
                  const SizedBox(height: 16),
                  _buildProfileField("Fecha de Nacimiento", formattedDate),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: logout,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text(
                        "Cerrar sesión",
                        style: TextStyle(fontSize: 16, color: Colors.black),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
      bottomNavigationBar: const CustomNavBar(currentIndex: 4),
    );
  }
}
