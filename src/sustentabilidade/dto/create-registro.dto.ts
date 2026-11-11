import { Transform } from 'class-transformer';
import { IsNumber, IsString, Matches, Min, Max } from 'class-validator';
import { interpretarNumeroBrasileiro } from '../numero-brasileiro';
export class CreateRegistroDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,100}$/, { message: 'empresaId deve conter letras, números, hífen ou sublinhado (1 a 100 caracteres)' })
  empresaId!: string;

  @IsString()
  @Matches(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/, { message: 'periodo deve usar YYYY-MM com mês válido' })
  periodo!: string;

  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: '$property deve ser um número finito' })
  @Transform(({ value }) => interpretarNumeroBrasileiro(value))
  @Min(0, { message: '$property deve ser maior ou igual a zero' })
  @Max(Number.MAX_SAFE_INTEGER, { message: '$property excede o limite permitido' })
  consumoEnergiaKwh!: number;

  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: '$property deve ser um número finito' })
  @Transform(({ value }) => interpretarNumeroBrasileiro(value))
  @Min(0, { message: '$property deve ser maior ou igual a zero' })
  @Max(Number.MAX_SAFE_INTEGER, { message: '$property excede o limite permitido' })
  emissoesToneladasCO2!: number;

  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: '$property deve ser um número finito' })
  @Transform(({ value }) => interpretarNumeroBrasileiro(value))
  @Min(0, { message: '$property deve ser maior ou igual a zero' })
  @Max(Number.MAX_SAFE_INTEGER, { message: '$property excede o limite permitido' })
  residuosKg!: number;
}
