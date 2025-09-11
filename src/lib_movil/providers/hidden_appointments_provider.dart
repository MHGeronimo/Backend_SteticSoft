import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class HiddenAppointmentsProvider with ChangeNotifier {
  // Usamos Set<int> para almacenar los IDs de citas ocultas de forma única
  final Set<int> _hiddenAppointments = {};
  // Clave para almacenar en SharedPreferences
  static const String _prefsKey = 'hidden_appointments';

  HiddenAppointmentsProvider() {
    // Cargar las citas ocultas al inicializar el provider
    _loadHiddenAppointments();
  }

  // Getter para acceder a la lista de IDs ocultas
  Set<int> get hiddenAppointments => _hiddenAppointments;

  // Método para marcar una cita como oculta
  void hideAppointment(int idCita) {
    if (_hiddenAppointments.add(idCita)) {
      // add retorna true si el elemento fue añadido (no existía)
      _saveHiddenAppointments();
      notifyListeners(); // Notificar a los listeners (widgets) que la lista cambió
    }
  }

  // Método para verificar si una cita está oculta
  bool isHidden(int idCita) => _hiddenAppointments.contains(idCita);

  // Guardar la lista de IDs ocultas en SharedPreferences
  Future<void> _saveHiddenAppointments() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      // Convertir el Set<int> a List<String> para compatibilidad con SharedPreferences
      final hiddenList =
          _hiddenAppointments.map((id) => id.toString()).toList();
      await prefs.setStringList(_prefsKey, hiddenList);
      debugPrint('Hidden appointments saved: $hiddenList'); // Log de depuración
    } catch (e) {
      debugPrint('Error saving hidden appointments: $e'); // Log de error
    }
  }

  // Cargar la lista de IDs ocultas desde SharedPreferences
  Future<void> _loadHiddenAppointments() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final hiddenList = prefs.getStringList(_prefsKey) ?? [];
      _hiddenAppointments.clear(); // Limpiar el set actual antes de cargar
      for (final idString in hiddenList) {
        final parsedId = int.tryParse(idString);
        if (parsedId != null) {
          _hiddenAppointments.add(parsedId);
        }
      }
      debugPrint(
        'Hidden appointments loaded: $_hiddenAppointments',
      ); // Log de depuración
      notifyListeners(); // Notificar a los listeners una vez cargado
    } catch (e) {
      debugPrint('Error loading hidden appointments: $e'); // Log de error
    }
  }

  // Opcional: Método para limpiar todas las citas ocultas (para pruebas o un futuro "mostrar todo")
  void clearHiddenAppointments() {
    _hiddenAppointments.clear();
    _saveHiddenAppointments();
    notifyListeners();
  }
}
