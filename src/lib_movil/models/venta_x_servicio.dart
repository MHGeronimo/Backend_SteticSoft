import 'package:json_annotation/json_annotation.dart';
import 'package:proyectomovil/models/servicio.dart';

part 'venta_x_servicio.g.dart';

@JsonSerializable(explicitToJson: true)
class VentaXServicio {
  @JsonKey(name: 'id_venta_x_servicio')
  final int idVentaXServicio;

  @JsonKey(name: 'valor_servicio')
  final double valorServicio;

  @JsonKey(name: 'id_servicio')
  final int idServicio;

  @JsonKey(name: 'id_cita')
  final int? idCita;

  @JsonKey(name: 'id_venta')
  final int idVenta;

  final Servicio? servicio;

  VentaXServicio({
    required this.idVentaXServicio,
    required this.valorServicio,
    required this.idServicio,
    this.idCita,
    required this.idVenta,
    this.servicio,
  });

  factory VentaXServicio.fromJson(Map<String, dynamic> json) => _$VentaXServicioFromJson(json);

  Map<String, dynamic> toJson() => _$VentaXServicioToJson(this);
}
