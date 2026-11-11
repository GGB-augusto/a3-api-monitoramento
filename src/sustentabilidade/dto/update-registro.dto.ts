import { Transform } from 'class-transformer';
import { IsNumber, Min, Max, ValidateIf } from 'class-validator';
import { interpretarNumeroBrasileiro } from '../numero-brasileiro';

// PUT exige todas as métricas; empresa e período são identificados pela URL.
export class ReplaceRegistroDto {
  @Transform(({ value }) => interpretarNumeroBrasileiro(value))
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: '$property deve ser um número finito' })
  @Min(0, { message: '$property deve ser maior ou igual a zero' })
  @Max(Number.MAX_SAFE_INTEGER, { message: '$property excede o limite permitido' })
  consumoEnergiaKwh!: number;

  @Transform(({ value }) => interpretarNumeroBrasileiro(value))
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: '$property deve ser um número finito' })
  @Min(0, { message: '$property deve ser maior ou igual a zero' })
  @Max(Number.MAX_SAFE_INTEGER, { message: '$property excede o limite permitido' })
  emissoesToneladasCO2!: number;

  @Transform(({ value }) => interpretarNumeroBrasileiro(value))
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: '$property deve ser um número finito' })
  @Min(0, { message: '$property deve ser maior ou igual a zero' })
  @Max(Number.MAX_SAFE_INTEGER, { message: '$property excede o limite permitido' })
  residuosKg!: number;

}

export class UpdateRegistroDto {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => interpretarNumeroBrasileiro(value))
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: '$property deve ser um número finito' })
  @Min(0, { message: '$property deve ser maior ou igual a zero' })
  @Max(Number.MAX_SAFE_INTEGER, { message: '$property excede o limite permitido' })
  consumoEnergiaKwh?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => interpretarNumeroBrasileiro(value))
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: '$property deve ser um número finito' })
  @Min(0, { message: '$property deve ser maior ou igual a zero' })
  @Max(Number.MAX_SAFE_INTEGER, { message: '$property excede o limite permitido' })
  emissoesToneladasCO2?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => interpretarNumeroBrasileiro(value))
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: '$property deve ser um número finito' })
  @Min(0, { message: '$property deve ser maior ou igual a zero' })
  @Max(Number.MAX_SAFE_INTEGER, { message: '$property excede o limite permitido' })
  residuosKg?: number;

}
