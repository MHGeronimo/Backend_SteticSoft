// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'empleado.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Empleado _$EmpleadoFromJson(Map<String, dynamic> json) => Empleado(
      idEmpleado: json['id_empleado'] as int,
      nombre: json['nombre'] as String,
      apellido: json['apellido'] as String,
      correo: json['correo'] as String,
      telefono: json['telefono'] as String,
      tipoDocumento: json['tipo_documento'] as String,
      numeroDocumento: json['numero_documento'] as String,
      fechaNacimiento: json['fecha_nacimiento'] as String,
      estado: json['estado'] as bool,
      idUsuario: json['id_usuario'] as int,
      usuario: json['usuario'] == null
          ? null
          : Usuario.fromJson(json['usuario'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$EmpleadoToJson(Empleado instance) => <String, dynamic>{
      'id_empleado': instance.idEmpleado,
      'nombre': instance.nombre,
      'apellido': instance.apellido,
      'correo': instance.correo,
      'telefono': instance.telefono,
      'tipo_documento': instance.tipoDocumento,
      'numero_documento': instance.numeroDocumento,
      'fecha_nacimiento': instance.fechaNacimiento,
      'estado': instance.estado,
      'id_usuario': instance.idUsuario,
      'usuario': instance.usuario?.toJson(),
    };
