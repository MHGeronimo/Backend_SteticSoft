// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'rol.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Rol _$RolFromJson(Map<String, dynamic> json) => Rol(
      idRol: json['id_rol'] as int,
      nombre: json['nombre'] as String,
      tipoPerfil: json['tipo_perfil'] as String,
      descripcion: json['descripcion'] as String?,
      estado: json['estado'] as bool,
    );

Map<String, dynamic> _$RolToJson(Rol instance) => <String, dynamic>{
      'id_rol': instance.idRol,
      'nombre': instance.nombre,
      'tipo_perfil': instance.tipoPerfil,
      'descripcion': instance.descripcion,
      'estado': instance.estado,
    };
