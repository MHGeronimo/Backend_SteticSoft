// ignore_for_file: library_private_types_in_public_api, use_build_context_synchronously

import 'package:flutter/material.dart';
import 'package:proyectomovil/services/auth_service.dart';
import 'package:proyectomovil/routes/app_routes.dart';

class RecoveryScreen extends StatefulWidget {
  const RecoveryScreen({super.key});

  @override
  _RecoveryScreenState createState() => _RecoveryScreenState();
}

class _RecoveryScreenState extends State<RecoveryScreen> {
  final _formKey = GlobalKey<FormState>();
  final _correoController = TextEditingController();
  String? _errorMessage;
  bool _isLoading = false;

  void _recover() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    bool success = await AuthService().recoverPassword(_correoController.text);

    setState(() {
      _isLoading = false;
    });

    if (success) {
      // Muestra un mensaje y redirige al login
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Revisa tu correo para recuperar la contraseña."),
        ),
      );
      Navigator.pushReplacementNamed(context, AppRoutes.login);
    } else {
      setState(() {
        _errorMessage = "Error al solicitar recuperación. Intenta nuevamente.";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Recuperar Contraseña")),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              if (_errorMessage != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(color: Colors.red),
                  ),
                ),
              TextFormField(
                controller: _correoController,
                decoration: InputDecoration(labelText: "Correo"),
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
              SizedBox(height: 20),
              _isLoading
                  ? CircularProgressIndicator()
                  : ElevatedButton(
                    onPressed: _recover,
                    child: Text("Enviar Instrucciones"),
                  ),
            ],
          ),
        ),
      ),
    );
  }
}
