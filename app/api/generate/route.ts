import { NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai'; // SDK da Vertex AI (para Inpainting/Imagen)
import {
  GoogleGenerativeAI, // SDK do Gemini (para Análise de Visão)
  Part,
} from '@google/generative-ai';

// --- Configuração dos Clientes de IA ---
// NOTA: Isso requer variáveis de ambiente em .env.local:
// GOOGLE_CLOUD_PROJECT = "seu-projeto-gcloud"
// GOOGLE_CLOUD_LOCATION = "us-central1"
// GEMINI_API_KEY = "sua-chave-api-gemini-aqui"
// ----------------------------------------------------

// 1. Cliente Vertex AI (para Inpainting/Imagen)
// Inicialização apenas se as variáveis estiverem configuradas
let imagenModel: ReturnType<VertexAI['preview']['getGenerativeModel']> | null = null;

if (process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_LOCATION) {
  const vertexAI = new VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION,
  });

  imagenModel = vertexAI.preview.getGenerativeModel({
    model: 'imagegeneration@0.0.6', // Modelo de edição/geração de imagem (Imagen)
  });
}

// 2. Cliente Gemini (para Análise de Visão)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// --- Helper para converter Arquivo (File) para a API do Google ---
async function fileToGenerativePart(file: File): Promise<Part> {
  const base64EncodedData = Buffer.from(await file.arrayBuffer()).toString(
    'base64',
  );
  return {
    inlineData: { data: base64EncodedData, mimeType: file.type },
  };
}

// --- A Rota da API (POST) ---
export async function POST(request: Request) {
  try {
    // 1. Ler os 3 arquivos do FormData (Contrato 6.2)
    const formData = await request.formData();
    const friendImageFile = formData.get('friendImage') as File | null;
    const baseImageFile = formData.get('baseImage') as File | null;
    const maskImageFile = formData.get('maskImage') as File | null;

    if (!friendImageFile || !baseImageFile || !maskImageFile) {
      return NextResponse.json(
        { error: 'Arquivos ausentes. (friendImage, baseImage, maskImage são obrigatórios)' },
        { status: 400 },
      );
    }

    // --- ETAPA DE IA 1: Análise de Visão (Gemini) ---
    // (Descrever a friendImage para criar o prompt de inpainting)

    console.log('Iniciando Etapa 1: Análise de Visão (Gemini)');
    const friendImagePart = await fileToGenerativePart(friendImageFile);
    const visionPrompt =
      'Descreva esta pessoa em detalhes objetivos para uma IA de geração de imagem. Foque em: sexo, idade aproximada, etnia, cor e estilo do cabelo, pelos faciais (barba/bigode), óculos e quaisquer características marcantes. Seja conciso e direto. Responda apenas com a descrição.';

    // Tentar diferentes modelos em ordem de preferência
    // PRIORIDADE: gemini-pro-vision (modelo especializado em visão)
    const modelsToTry = [
      'gemini-pro-vision',     // Modelo especializado em visão (recomendado)
      'gemini-2.0-flash-exp',  // Modelo experimental mais recente
      'gemini-1.5-flash-002',  // Versão específica do Flash
      'gemini-1.5-pro-002',    // Versão específica do Pro
      'gemini-1.5-flash',      // Flash sem versão
      'gemini-1.5-pro',        // Pro sem versão
    ];
    
    let visionResult;
    let textPrompt = '';
    let lastError: Error | null = null;

    console.log('🔍 Iniciando tentativas com modelos Gemini...');
    for (const modelName of modelsToTry) {
      try {
        console.log(`🔄 Tentando modelo: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        visionResult = await model.generateContent([
          visionPrompt,
          friendImagePart,
        ]);
        textPrompt = visionResult.response.text();
        if (textPrompt && textPrompt.trim() !== '') {
          console.log(`✅ Modelo ${modelName} funcionou com sucesso!`);
          break;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log(`❌ Modelo ${modelName} falhou: ${lastError.message}`);
        continue;
      }
    }

    if (!textPrompt || textPrompt.trim() === '') {
      return NextResponse.json(
        { error: `Não foi possível analisar a imagem do amigo. Último erro: ${lastError?.message || 'Nenhum modelo disponível'}` },
        { status: 500 },
      );
    }

    // Este é o prompt que será usado para "pintar" o amigo na cena
    const finalInpaintingPrompt = `FOTO: ${textPrompt}, em um cenário com um político, fotorrealista.`;
    console.log('Etapa 1 Concluída. Prompt Gerado:', finalInpaintingPrompt);


    // --- ETAPA DE IA 2: Inpainting (Vertex AI / Imagen) ---
    // (Usar a descrição gerada para preencher a máscara)

    // Verificar se VertexAI está configurado
    if (!imagenModel) {
      return NextResponse.json(
        { error: 'Vertex AI não está configurado. Configure GOOGLE_CLOUD_PROJECT e GOOGLE_CLOUD_LOCATION nas variáveis de ambiente.' },
        { status: 500 },
      );
    }

    console.log('Iniciando Etapa 2: Inpainting (Vertex AI)');
    const baseImagePart = await fileToGenerativePart(baseImageFile);
    const maskImagePart = await fileToGenerativePart(maskImageFile);

    const inpaintingRequest = {
      prompt: finalInpaintingPrompt,
      image: baseImagePart, // Imagem base (político)
      mask: { image: maskImagePart }, // Máscara (buraco)
      generationConfig: {
        count: 1,
        guidanceScale: 12, // Força a IA a seguir o prompt com mais rigor
      },
    };

    // @ts-expect-error - O SDK do @google-cloud/vertexai pode ter tipos complexos
    const inpaintingResponse = await imagenModel.editImage(inpaintingRequest);

    // Acessar a resposta de forma segura
    let imageBase64: string | undefined;
    const response = inpaintingResponse as unknown;
    if (Array.isArray(response) && response.length > 0) {
      const firstItem = response[0] as Record<string, unknown>;
      imageBase64 = (firstItem?.imageBytes as string) || (firstItem?.bytes as string) || (firstItem?.data as string);
    } else if (response && typeof response === 'object') {
      const responseObj = response as Record<string, unknown>;
      imageBase64 = (responseObj.imageBytes as string) || (responseObj.bytes as string) || (responseObj.data as string);
    }
    
    if (!imageBase64) {
      return NextResponse.json(
        { error: 'A IA de edição não retornou uma imagem.' },
        { status: 500 },
      );
    }

    // --- Resposta (Sucesso - Contrato 6.2) ---
    console.log('Etapa 2 Concluída. Enviando imagem gerada.');

    // Decodifica o base64 e retorna os bytes puros da imagem
    const imageBytes = Buffer.from(imageBase64, 'base64');
    
    // Retorna a imagem PNG pura, conforme Seção 6.2 do PRD
    return new NextResponse(imageBytes, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
      },
    });

  } catch (error) {
    console.error('Erro grave na API /api/generate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
