import 'package:json_annotation/json_annotation.dart';
import 'package:proyectomovil/models/cliente.dart';
import 'package:proyectomovil/models/estado.dart';
import 'package:proyectomovil/models/producto_x_venta.dart';
import 'package:proyectomovil/models/venta_x_servicio.dart';

part 'venta.g.dart';

@JsonSerializable(explicitToJson: true)
class Venta {
  @JsonKey(name: 'id_venta')
  final int idVenta;

  final String fecha;
  final double total;
  final double iva;

  @JsonKey(name: 'id_cliente')
  final int idCliente;

  @JsonKey(name: 'id_estado')
  final int idEstado;

  final Cliente? cliente;
  @JsonKey(name: 'estadoDetalle')
  final Estado? estadoDetalle;

  final List<ProductoXVenta>? productos;
  final List<VentaXServicio>? servicios;

  Venta({
    required this.idVenta,
    required this.fecha,
    required this.total,
    required this.iva,
    required this.idCliente,
    required this.idEstado,
    this.cliente,
    this.estadoDetalle,
    this.productos,
    this.servicios,
  });

  factory Venta.fromJson(Map<String, dynamic> json) => _$VentaFromJson(json);

  Map<String, dynamic> toJson() => _$VentaToJson(this);
}
