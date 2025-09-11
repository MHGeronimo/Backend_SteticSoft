import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class HiddenOrdersProvider with ChangeNotifier {
  final Set<int> _hiddenOrders = {};

  HiddenOrdersProvider() {
    _loadHiddenOrders();
  }

  Set<int> get hiddenOrders => _hiddenOrders;

  void hideOrder(int idPedido) {
    _hiddenOrders.add(idPedido);
    _saveHiddenOrders();
    notifyListeners();
  }

  bool isHidden(int idPedido) => _hiddenOrders.contains(idPedido);

  Future<void> _saveHiddenOrders() async {
    final prefs = await SharedPreferences.getInstance();
    // Convertimos el Set<int> a List<String> para guardarlo
    final hiddenList =
        _hiddenOrders.map((orderId) => orderId.toString()).toList();
    await prefs.setStringList('hidden_orders', hiddenList);
  }

  Future<void> _loadHiddenOrders() async {
    final prefs = await SharedPreferences.getInstance();
    final hiddenList = prefs.getStringList('hidden_orders') ?? [];
    for (final id in hiddenList) {
      final parsed = int.tryParse(id);
      if (parsed != null) {
        _hiddenOrders.add(parsed);
      }
    }
    notifyListeners();
  }
}
