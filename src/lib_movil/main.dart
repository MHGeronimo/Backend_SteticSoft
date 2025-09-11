import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart'; // Importa la función necesaria.
import 'package:provider/provider.dart';

import 'package:proyectomovil/providers/user_provider.dart';
import 'package:proyectomovil/providers/hidden_orders_provider.dart';
import 'package:proyectomovil/providers/hidden_appointments_provider.dart';

import 'package:proyectomovil/routes/app_routes.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Inicializa los datos regionales para 'es' (puedes cambiarlo según lo que necesites)
  // Esto es útil para formatear fechas y horas correctamente en español.
  await initializeDateFormatting('es', null);

  runApp(
    MultiProvider(
      providers: [
        // --- Tus Providers existentes ---
        ChangeNotifierProvider(create: (_) => UserProvider()),
        ChangeNotifierProvider(create: (_) => HiddenOrdersProvider()),
        // --- Agrega el nuevo HiddenAppointmentsProvider aquí ---
        ChangeNotifierProvider(create: (_) => HiddenAppointmentsProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SteticSoft API Movil',
      theme: ThemeData(
        // Define tu tema aquí. Asegúrate de que los colores primarios
        // y los estilos de botones coincidan con tu diseño.
        primarySwatch: Colors.pink, // Color primario
        hintColor: Colors.pinkAccent, // Color secundario para acentos
        scaffoldBackgroundColor:
            Colors.white, // Color de fondo de la mayoría de las pantallas

        appBarTheme: const AppBarTheme(
          color: Color.fromARGB(255, 182, 92, 122), // Color de la AppBar
          titleTextStyle: TextStyle(
            // Estilo del texto del título
            color: Colors.white, // Color del texto del título blanco
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
          iconTheme: IconThemeData(
            // Color de los iconos en la AppBar
            color: Colors.white,
          ),
        ),

        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor:
                Colors.pinkAccent, // Color de fondo de los botones elevados
            foregroundColor:
                Colors.white, // Color del texto en los botones elevados
            shape: RoundedRectangleBorder(
              // Forma de los botones
              borderRadius: BorderRadius.circular(8), // Bordes redondeados
            ),
            padding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 12,
            ), // Padding interno
            textStyle: const TextStyle(
              // Estilo del texto del botón
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),

        // Estilo para botones de texto
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: Colors.pinkAccent, // Color del texto
          ),
        ),

        // Estilo para botones de icono
        iconButtonTheme: IconButtonThemeData(
          style: IconButton.styleFrom(
            foregroundColor: Colors.pinkAccent, // Color del icono
          ),
        ),

        cardTheme: CardTheme(
          // Tema para las Cards
          elevation: 4,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        ),

        // Puedes agregar más estilos de tema aquí (inputDecorationTheme, floatingActionButtonTheme, etc.)
      ),
      builder: (context, child) => child!,
      initialRoute: AppRoutes.login, // O la ruta que definas como inicial
      routes: AppRoutes.routes, // Define todas las rutas de tu aplicación
      debugShowCheckedModeBanner: false, // Oculta la cinta de debug
    );
  }
}
