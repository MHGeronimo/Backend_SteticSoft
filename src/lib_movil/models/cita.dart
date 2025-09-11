import 'package:json_annotation/json_annotation.dart';
import 'package:proyectomovil/models/cliente.dart';
import 'package:proyectomovil/models/usuario.dart';
import 'package:proyectomovil/models/estado.dart';
import 'package:proyectomovil/models/servicio.dart';
import 'package:proyectomovil/models/novedad.dart';

part 'cita.g.dart';

@JsonSerializable(explicitToJson: true)
class Cita {
  @JsonKey(name: 'id_cita')
  final int idCita;

  final String fecha;

  @JsonKey(name: 'hora_inicio')
  final String horaInicio;

  @JsonKey(name: 'precio_total')
  final double? precioTotal;

  @JsonKey(name: 'id_estado')
  final int idEstado;

  @JsonKey(name: 'id_cliente')
  final int idCliente;

  @JsonKey(name: 'id_usuario')
  final int? idUsuario;

  @JsonKey(name: 'id_novedad')
  final int idNovedad;

  @JsonKey(name: 'estadoDetalle')
  final Estado? estadoDetalle;

  final Cliente? cliente;
  final Usuario? empleado;
  final List<Servicio> servicios;
  final Novedad? novedad;


  Cita({
    required this.idCita,
    required this.fecha,
    required this.horaInicio,
    this.precioTotal,
    required this.idEstado,
    required this.idCliente,
    this.idUsuario,
    required this.idNovedad,
    this.estadoDetalle,
    this.cliente,
    this.empleado,
    required this.servicios,
    this.novedad,
  });

  factory Cita.fromJson(Map<String, dynamic> json) => _$CitaFromJson(json);

  Map<String, dynamic> toJson() => _$CitaToJson(this);
}
