import { IsNumber, IsString, Matches, Min, Max } from 'class-validator';
export class CreateRegistroDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,100}$/, { message: 'empresaId deve conter letras, números, hífen ou sublinhado (1 a 100 caracteres)' })
  empresaId!: string;

  @IsString()
  @Matches(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/, { message: 'periodo deve usar YYYY-MM com mês válido' })
  periodo!: string;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  consumoEnergiaKwh!: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  emissoesToneladasCO2!: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  residuosKg!: number;
}
