import 'package:json_annotation/json_annotation.dart';

part 'novedad.g.dart';

@JsonSerializable()
class Novedad {
  @JsonKey(name: 'id_novedad')
  final int idNovedad;

  @JsonKey(name: 'fecha_inicio')
  final String fechaInicio;

  @JsonKey(name: 'fecha_fin')
  final String fechaFin;

  @JsonKey(name: 'hora_inicio')
  final String horaInicio;

  @JsonKey(name: 'hora_fin')
  final String horaFin;

  final dynamic dias; // JSONB can be complex, using dynamic for now.
  final bool estado;

  Novedad({
    required this.idNovedad,
    required this.fechaInicio,
    required this.fechaFin,
    required this.horaInicio,
    required this.horaFin,
    required this.dias,
    required this.estado,
  });

  factory Novedad.fromJson(Map<String, dynamic> json) => _$NovedadFromJson(json);

  Map<String, dynamic> toJson() => _$NovedadToJson(this);
}
