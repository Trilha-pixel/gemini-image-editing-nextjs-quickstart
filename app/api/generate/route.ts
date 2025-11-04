import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// Helper para simular o tempo de processamento da IA
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    // 1. Simular o tempo de processamento (PRD 6.1)
    await delay(2000); // 2 segundos

    // 2. (PRD 6.3) Ler o FormData para identificar qual político foi escolhido
    const formData = await request.formData();
    const baseImageFile = formData.get('baseImage') as File | null;
    
    let mockImagePath = '/mocks/bolsonaro_result_mock.jpg.png';
    
    // Verificar qual político foi escolhido pelo nome do arquivo baseImage
    if (baseImageFile && baseImageFile.name.includes('lula')) {
      mockImagePath = '/mocks/bolsonaro_result_mock.jpg.png'; // Usando a mesma por enquanto até ter a do Lula
    }

    // 3. Ler os bytes da imagem mock do disco
    // path.join precisa do 'public' para o fs, mas o mockImagePath já tem o '/mocks/'
    const filePath = path.join(process.cwd(), 'public', mockImagePath);
    const imageBuffer = await fs.readFile(filePath);

    // 4. Retornar os bytes da imagem (Contrato 6.2)
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
      },
    });

  } catch (error) {
    console.error('Erro na API Mock:', error);
    return NextResponse.json(
      { error: 'Erro no servidor mock.' },
      { status: 500 },
    );
  }
}

