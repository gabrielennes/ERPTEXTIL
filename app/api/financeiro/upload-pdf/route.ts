import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validar se é PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Apenas arquivos PDF são permitidos' },
        { status: 400 }
      )
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 10MB' },
        { status: 400 }
      )
    }

    // Determinar o tipo de upload (contas-a-pagar ou contas-a-receber)
    const tipo = formData.get('tipo') as string || 'contas-a-pagar'
    
    // Criar diretório de uploads se não existir
    const uploadsDir = join(process.cwd(), 'public', 'uploads', tipo)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const nomeOriginal = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const nomeArquivo = `${timestamp}_${nomeOriginal}`
    const caminhoArquivo = join(uploadsDir, nomeArquivo)

    // Salvar arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(caminhoArquivo, buffer)

    // Retornar URL relativa
    const url = `/uploads/${tipo}/${nomeArquivo}`

    return NextResponse.json({
      success: true,
      url,
      nome: file.name,
      tamanho: file.size,
    })
  } catch (error: any) {
    console.error('Erro ao fazer upload do PDF:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    )
  }
}

