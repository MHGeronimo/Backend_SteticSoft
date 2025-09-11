import 'package:flutter/material.dart';

class CartProvider with ChangeNotifier {
  int _totalItems = 0;
  double _subtotal = 0.0;

  int get totalItems => _totalItems;
  double get subtotal => _subtotal;

  /// Actualiza el carrito con la cantidad total de ítems y el subtotal.
  void updateCart({required int totalItems, required double subtotal}) {
    _totalItems = totalItems;
    _subtotal = subtotal;
    notifyListeners();
  }

  /// Ejemplo de método para añadir un ítem (puedes personalizarlo según tu lógica).
  void addItem({required int quantity, required double price}) {
    _totalItems += quantity;
    _subtotal += (quantity * price);
    notifyListeners();
  }

  /// Método para limpiar el carrito.
  void clearCart() {
    _totalItems = 0;
    _subtotal = 0.0;
    notifyListeners();
  }
}
