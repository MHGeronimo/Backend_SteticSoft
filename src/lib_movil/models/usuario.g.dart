// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'usuario.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Usuario _$UsuarioFromJson(Map<String, dynamic> json) => Usuario(
      idUsuario: json['id_usuario'] as int,
      correo: json['correo'] as String,
      contrasena: json['contrasena'] as String?,
      idRol: json['id_rol'] as int,
      estado: json['estado'] as bool,
      rol: json['rol'] == null
          ? null
          : Rol.fromJson(json['rol'] as Map<String, dynamic>),
      clienteInfo: json['cliente_info'] == null
          ? null
          : Cliente.fromJson(json['cliente_info'] as Map<String, dynamic>),
      empleadoInfo: json['empleado_info'] == null
          ? null
          : Empleado.fromJson(json['empleado_info'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$UsuarioToJson(Usuario instance) => <String, dynamic>{
      'id_usuario': instance.idUsuario,
      'correo': instance.correo,
      'id_rol': instance.idRol,
      'estado': instance.estado,
      'rol': instance.rol?.toJson(),
      'cliente_info': instance.clienteInfo?.toJson(),
      'empleado_info': instance.empleadoInfo?.toJson(),
    };
