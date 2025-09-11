import 'package:flutter/material.dart';

import '../screens/login/login_screen.dart';
import '../screens/register/register_screen.dart';
import '../screens/recovery/recovery_screen.dart';

import '../screens/catalog/public_catalog_screen.dart';
import '../screens/catalog/client_catalog_screen.dart';

import '../screens/catalog/public_catalog_products_screen.dart';
import '../screens/catalog/client_catalog_products_screen.dart';

import '../screens/orders/orders_screen.dart';
import '../screens/orders/orders_details_screen.dart';

import '../screens/appointments/appointments_screen.dart';
import '../screens/appointments/add_appointment_screen.dart';
import '../screens/appointments/appointment_details_screen.dart';

import '../screens/home/home_screen.dart';

import '../screens/profile/profile_screen.dart';

import '../screens/cart/cart_screen.dart';

class AppRoutes {
  static const String login = '/login';
  static const String register = '/register';
  static const String recovery = '/recovery';

  static const String catalogPublic = '/catalogPublic';
  static const String catalogClient = '/catalogClient';

  static const String catalogPublicProducts = '/catalogPublicProducts';
  static const String catalogClientProducts = '/catalogClientProducts';

  static const String cart = '/cart';

  static const String home = '/home';
  static const String orders = '/orders';
  
  static const String appointments = '/appointments';
  static const String addAppointment = '/addAppointment';
  static const String editAppointment = '/editAppointment';
  static const String appointmentDetails = '/appointmentDetails';

  static const String profile = '/profile';
  static const String orderDetails = '/orderDetails';

  static Map<String, WidgetBuilder> routes = {
    login: (context) => LoginScreen(),
    register: (context) => RegisterScreen(),
    recovery: (context) => RecoveryScreen(),
    catalogPublic: (context) => PublicCatalogScreen(),
    catalogClient: (context) => ClientCatalogScreen(),
    catalogPublicProducts: (context) => PublicCatalogProductsScreen(),
    catalogClientProducts: (context) => ClientCatalogProductsScreen(),
    cart: (context) => const CartScreen(),
    home: (context) => HomeScreen(),
    orders: (context) => OrdersScreen(),
    orderDetails: (context) => OrderDetailsScreen(),
    appointments: (context) => const AppointmentsScreen(),
    addAppointment: (context) => const AddAppointmentScreen(),
    appointmentDetails: (context) => const AppointmentDetailsScreen(),
    profile: (context) => ProfileScreen(),
  };
}
