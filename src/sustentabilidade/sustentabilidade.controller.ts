import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { SustentabilidadeService } from './sustentabilidade.service';
@Controller('sustentabilidade')
export class SustentabilidadeController {
  constructor(private readonly service: SustentabilidadeService) {}
  private validarEmpresa(id: string) {
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new BadRequestException('empresaId inválido');
    return id;
  }
  @Post()
  registrar(@Body() dto: CreateRegistroDto) { return this.service.registrar(dto); }
  @Get(':empresaId/indicadores')
  indicadores(@Param('empresaId') id: string) { return this.service.calcularIndicadores(this.validarEmpresa(id)); }
  @Get(':empresaId')
  listar(@Param('empresaId') id: string) { return this.service.listarPorEmpresa(this.validarEmpresa(id)); }
}
