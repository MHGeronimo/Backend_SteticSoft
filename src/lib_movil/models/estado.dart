import 'package:json_annotation/json_annotation.dart';

part 'estado.g.dart';

@JsonSerializable()
class Estado {
  @JsonKey(name: 'id_estado')
  final int idEstado;

  @JsonKey(name: 'nombre_estado')
  final String nombreEstado;

  Estado({
    required this.idEstado,
    required this.nombreEstado,
  });

  factory Estado.fromJson(Map<String, dynamic> json) => _$EstadoFromJson(json);

  Map<String, dynamic> toJson() => _$EstadoToJson(this);
}
