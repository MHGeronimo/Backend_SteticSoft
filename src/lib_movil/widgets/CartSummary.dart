// ignore_for_file: file_names

import 'package:flutter/material.dart';

class CartSummary extends StatelessWidget {
  final int totalItems;
  final double subtotal;
  final VoidCallback onViewCart;

  const CartSummary({
    super.key,
    required this.totalItems,
    required this.subtotal,
    required this.onViewCart,
  });

  @override
  Widget build(BuildContext context) {
    final String formattedSubtotal =
        subtotal % 1 == 0
            ? subtotal.toInt().toString()
            : subtotal.toStringAsFixed(2);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 5,
            offset: Offset(0, -3),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text("Total Items: $totalItems"),
          Text("Subtotal: \$$formattedSubtotal"),
          ElevatedButton(
            onPressed: onViewCart,
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text("Ver Carrito"),
          ),
        ],
      ),
    );
  }
}
