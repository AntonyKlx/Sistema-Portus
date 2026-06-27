import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

// Mesmo mapeamento de perfis usado no middleware, para as rotas de API.
// Mantém a checagem de funcionalidade também no backend (defesa em profundidade).
export const PERFIS_POR_RECURSO = {
  encomendas: ['morador', 'porteiro', 'sindico', 'administrador', 'adminMaster'],
  reservas: ['morador', 'sindico', 'administrador', 'adminMaster'],
  moradores: ['sindico', 'administrador', 'adminMaster'],
  unidades: ['sindico', 'administrador', 'adminMaster'],
  'areas-comuns': ['sindico', 'administrador', 'adminMaster'],
  perfis: ['administrador', 'adminMaster'],
  admins: ['adminMaster'],
  logs: ['adminMaster'],
}

/**
 * Garante que o usuário está autenticado e, se um recurso for informado,
 * que o perfil dele tem permissão para acessá-lo.
 * Retorna { session } se autorizado, ou { response } com o erro pronto para devolver.
 */
export async function autorizar(recurso) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  }

  if (recurso) {
    const perfisPermitidos = PERFIS_POR_RECURSO[recurso]
    if (perfisPermitidos && !perfisPermitidos.includes(session.user.perfil)) {
      return {
        response: NextResponse.json(
          { error: 'Seu perfil não tem permissão para acessar este recurso.' },
          { status: 403 }
        ),
      }
    }
  }

  return { session }
}
