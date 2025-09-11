import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:proyectomovil/models/usuario.dart';
import 'package:proyectomovil/services/auth_service.dart';
import 'package:proyectomovil/routes/app_routes.dart';
import 'package:proyectomovil/providers/user_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _correoController = TextEditingController();
  final _contrasenaController = TextEditingController();
  String? _errorMessage;
  bool _isLoading = false;

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final authService = AuthService();
    final Usuario? usuario = await authService.login(
      _correoController.text,
      _contrasenaController.text,
    );

    setState(() {
      _isLoading = false;
    });

    if (usuario != null && usuario.clienteInfo != null) {
      Provider.of<UserProvider>(context, listen: false).setUser(usuario);
      Navigator.pushReplacementNamed(context, AppRoutes.home);
    } else {
      setState(() {
        _errorMessage = "Credenciales incorrectas o perfil de cliente no encontrado.";
      });
    }
  }

  @override
  void dispose() {
    _correoController.dispose();
    _contrasenaController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text("Iniciar Sesión"),
        centerTitle: true,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Logo redondo y más grande
            ClipOval(
              child: Image.asset(
                'lib/core/utils/logo.png',
                height: 120,
                width: 120,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(height: 20),
            // Botón para Catálogo Público
            TextButton.icon(
              onPressed:
                  () => Navigator.pushNamed(context, AppRoutes.catalogPublic),
              icon: const Icon(Icons.shopping_cart, color: Colors.blue),
              label: const Text(
                "Ver Catálogo Público",
                style: TextStyle(color: Colors.blue),
              ),
            ),
            const SizedBox(height: 10),
            // Contenedor con BoxShadow para los campos y botones
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    // ignore: deprecated_member_use
                    color: Colors.grey.withOpacity(0.3),
                    spreadRadius: 2,
                    blurRadius: 5,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_errorMessage != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.red,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    // Campo de correo
                    TextFormField(
                      controller: _correoController,
                      decoration: InputDecoration(
                        labelText: "Correo",
                        hintText: "Ingrese su correo",
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return "El correo es obligatorio";
                        }
                        if (!RegExp(r"^[^@]+@[^@]+\.[^@]+").hasMatch(value)) {
                          return "Formato de correo inválido";
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    // Campo de contraseña
                    TextFormField(
                      controller: _contrasenaController,
                      decoration: InputDecoration(
                        labelText: "Contraseña",
                        hintText: "Ingrese su contraseña",
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      obscureText: true,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return "La contraseña es obligatoria";
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),
                    // Botón Iniciar Sesión
                    _isLoading
                        ? const Center(child: CircularProgressIndicator())
                        : ElevatedButton(
                          onPressed: _login,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: const Text(
                            "Iniciar Sesión",
                            style: TextStyle(fontSize: 16, color: Colors.black),
                          ),
                        ),
                    const SizedBox(height: 16),
                    // Botón Regístrate
                    ElevatedButton(
                      onPressed:
                          () =>
                              Navigator.pushNamed(context, AppRoutes.register),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green[700],
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text(
                        "¿No tienes cuenta? Regístrate",
                        style: TextStyle(fontSize: 16, color: Colors.black),
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Botón ¿Olvidaste tu contraseña?
                    ElevatedButton(
                      onPressed:
                          () =>
                              Navigator.pushNamed(context, AppRoutes.recovery),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color.fromARGB(255, 107, 91, 75),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text(
                        "¿Olvidaste tu contraseña?",
                        style: TextStyle(fontSize: 16, color: Colors.black),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
