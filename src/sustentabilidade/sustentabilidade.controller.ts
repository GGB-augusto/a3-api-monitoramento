import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { EmpresaParamsDto, RegistroParamsDto } from './dto/registro-params.dto';
import { ReplaceRegistroDto, UpdateRegistroDto } from './dto/update-registro.dto';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SustentabilidadeService } from './sustentabilidade.service';

@Controller('sustentabilidade')
@UseGuards(SupabaseAuthGuard)
export class SustentabilidadeController {
  constructor(private readonly service: SustentabilidadeService) {}

  @Post()
  registrar(@Body() dto: CreateRegistroDto, @Req() request: AuthenticatedRequest) {
    this.validarEmpresa(dto.empresaId, request);
    return this.service.registrar(dto, request.accessToken);
  }

  @Get(':empresaId/indicadores')
  indicadores(@Param() params: EmpresaParamsDto, @Req() request: AuthenticatedRequest) {
    this.validarEmpresa(params.empresaId, request);
    return this.service.calcularIndicadores(params.empresaId, request.accessToken);
  }

  @Get(':empresaId/:periodo')
  buscar(@Param() params: RegistroParamsDto, @Req() request: AuthenticatedRequest) {
    this.validarEmpresa(params.empresaId, request);
    return this.service.buscarPorPeriodo(params.empresaId, params.periodo, request.accessToken);
  }

  @Get(':empresaId')
  listar(@Param() params: EmpresaParamsDto, @Req() request: AuthenticatedRequest) {
    this.validarEmpresa(params.empresaId, request);
    return this.service.listarPorEmpresa(params.empresaId, request.accessToken);
  }

  @Put(':empresaId/:periodo')
  substituir(@Param() params: RegistroParamsDto, @Body() dto: ReplaceRegistroDto, @Req() request: AuthenticatedRequest) {
    this.validarEmpresa(params.empresaId, request);
    return this.service.atualizar(params.empresaId, params.periodo, dto, request.accessToken);
  }

  @Patch(':empresaId/:periodo')
  atualizar(@Param() params: RegistroParamsDto, @Body() dto: UpdateRegistroDto, @Req() request: AuthenticatedRequest) {
    this.validarEmpresa(params.empresaId, request);
    return this.service.atualizar(params.empresaId, params.periodo, dto, request.accessToken);
  }

  @Delete(':empresaId/:periodo')
  @HttpCode(204)
  excluir(@Param() params: RegistroParamsDto, @Req() request: AuthenticatedRequest) {
    this.validarEmpresa(params.empresaId, request);
    return this.service.excluir(params.empresaId, params.periodo, request.accessToken);
  }

  private validarEmpresa(empresaId: string, request: AuthenticatedRequest) {
    if (process.env.STORAGE_MODE === 'supabase' && request.user?.id !== empresaId) {
      throw new ForbiddenException('Acesso permitido somente aos dados da empresa autenticada');
    }
  }
}

interface AuthenticatedRequest { user?: { id: string }; accessToken?: string }
