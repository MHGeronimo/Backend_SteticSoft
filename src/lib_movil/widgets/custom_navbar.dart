import 'package:flutter/material.dart';
import 'package:proyectomovil/routes/app_routes.dart';

class CustomNavBar extends StatelessWidget {
  final int currentIndex;

  const CustomNavBar({super.key, required this.currentIndex});

  void _onTap(BuildContext context, int index) {
    String destinationRoute;
    switch (index) {
      case 0:
        destinationRoute = AppRoutes.home;
        break;
      case 1:
        destinationRoute = AppRoutes.catalogClient;
        break;
      case 2:
        destinationRoute = AppRoutes.orders;
        break;
      case 3:
        destinationRoute = AppRoutes.appointments;
        break;
      case 4:
        destinationRoute = AppRoutes.profile;
        break;
      default:
        destinationRoute = AppRoutes.home;
    }
    if (ModalRoute.of(context)?.settings.name != destinationRoute) {
      Navigator.pushReplacementNamed(context, destinationRoute);
    }
  }

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: currentIndex,
      onTap: (index) => _onTap(context, index),
      type: BottomNavigationBarType.fixed,
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
        BottomNavigationBarItem(icon: Icon(Icons.store), label: 'Catálogo'),
        BottomNavigationBarItem(
          icon: Icon(Icons.shopping_cart),
          label: 'Pedidos',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.calendar_today),
          label: 'Citas',
        ),
        BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Perfil'),
      ],
    );
  }
}
