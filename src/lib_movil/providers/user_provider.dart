import 'package:flutter/material.dart';
import 'package:proyectomovil/models/usuario.dart';

class UserProvider extends ChangeNotifier {
  Usuario? _user;

  Usuario? get user => _user;

  void setUser(Usuario user) {
    _user = user;
    notifyListeners();
  }

  void logout() {
    _user = null;
    notifyListeners();
  }
}
