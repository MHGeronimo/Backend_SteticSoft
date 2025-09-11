// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'cliente.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Cliente _$ClienteFromJson(Map<String, dynamic> json) => Cliente(
      idCliente: json['id_cliente'] as int?,
      nombre: json['nombre'] as String,
      apellido: json['apellido'] as String,
      correo: json['correo'] as String,
      telefono: json['telefono'] as String,
      tipoDocumento: json['tipo_documento'] as String,
      numeroDocumento: json['numero_documento'] as String,
      fechaNacimiento: json['fecha_nacimiento'] as String,
      direccion: json['direccion'] as String,
      estado: json['estado'] as bool?,
      idUsuario: json['id_usuario'] as int?,
      usuario: json['usuario'] == null
          ? null
          : Usuario.fromJson(json['usuario'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$ClienteToJson(Cliente instance) => <String, dynamic>{
      'id_cliente': instance.idCliente,
      'nombre': instance.nombre,
      'apellido': instance.apellido,
      'correo': instance.correo,
      'telefono': instance.telefono,
      'tipo_documento': instance.tipoDocumento,
      'numero_documento': instance.numeroDocumento,
      'fecha_nacimiento': instance.fechaNacimiento,
      'direccion': instance.direccion,
      'estado': instance.estado,
      'id_usuario': instance.idUsuario,
      'usuario': instance.usuario?.toJson(),
    };
