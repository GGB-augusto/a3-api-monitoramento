import { IsString, Matches } from 'class-validator';

export class EmpresaParamsDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,100}$/, {
    message: 'empresaId deve conter letras, números, hífen ou sublinhado (1 a 100 caracteres)',
  })
  empresaId!: string;
}

export class RegistroParamsDto extends EmpresaParamsDto {
  @IsString()
  @Matches(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/, {
    message: 'periodo deve usar YYYY-MM com mês válido',
  })
  periodo!: string;
}
