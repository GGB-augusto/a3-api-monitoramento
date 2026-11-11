import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

interface ApiRequest {
  headers: { authorization?: string };
  user?: { id: string };
  accessToken?: string;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.STORAGE_MODE !== 'supabase') return true;

    const request = context.switchToHttp().getRequest<ApiRequest>();
    const token = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) throw new UnauthorizedException('Token de acesso não informado');

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Configure SUPABASE_URL e SUPABASE_ANON_KEY');

    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Sessão inválida ou expirada');

    request.user = { id: data.user.id };
    request.accessToken = token;
    return true;
  }
}
