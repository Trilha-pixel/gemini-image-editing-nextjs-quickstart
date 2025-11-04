import { NextResponse } from 'next/server';
import {
  GoogleGenerativeAI, // SDK do Gemini (para Análise de Visão e Geração de Imagem)
  Part,
} from '@google/generative-ai';

// --- Configuração dos Clientes de IA ---
// NOTA: Isso requer variáveis de ambiente em .env.local:
// GEMINI_API_KEY = "sua-chave-api-gemini-aqui"
// ----------------------------------------------------

// Cliente Gemini (para Análise de Visão e Geração de Imagem)
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


    // --- ETAPA DE IA 2: Geração de Imagem (Gemini 2.0 Flash) ---
    // (Usar a descrição gerada para criar a imagem final)
    // NOTA: Usando Gemini 2.0 Flash em vez de Vertex AI/Imagen para simplificar

    console.log('Iniciando Etapa 2: Geração de Imagem (Gemini 2.0 Flash)');
    
    // Preparar a imagem base para usar como referência
    const baseImagePart = await fileToGenerativePart(baseImageFile);
    
    // Criar prompt completo para o Gemini 2.0 Flash gerar a imagem
    const imageGenerationPrompt = `${finalInpaintingPrompt}. A imagem deve mostrar a pessoa descrita acima ao lado de um político em um cenário realista e profissional.`;

    // Tentar usar Gemini 2.0 Flash para gerar a imagem diretamente
    const imageModelsToTry = [
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash-exp-image-generation',
    ];

    let generatedImage: string | null = null;
    let imageError: Error | null = null;

    for (const modelName of imageModelsToTry) {
      try {
        console.log(`🔄 Tentando gerar imagem com modelo: ${modelName}`);
        const imageModel = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseModalities: ['Text', 'Image'],
          },
        });

        const imageResponse = await imageModel.generateContent([
          imageGenerationPrompt,
          baseImagePart, // Incluir a imagem base como referência
        ]);

        // Extrair a imagem da resposta
        const parts = imageResponse.response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if ('inlineData' in part && part.inlineData) {
            generatedImage = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }

        if (generatedImage) {
          console.log(`✅ Imagem gerada com sucesso usando ${modelName}`);
          break;
        }
      } catch (error) {
        imageError = error instanceof Error ? error : new Error(String(error));
        console.log(`❌ Modelo ${modelName} falhou: ${imageError.message}`);
        continue;
      }
    }

    if (!generatedImage) {
      return NextResponse.json(
        { error: `Não foi possível gerar a imagem. Erro: ${imageError?.message || 'Nenhum modelo de imagem disponível'}` },
        { status: 500 },
      );
    }

    // --- Resposta (Sucesso - Contrato 6.2) ---
    console.log('Etapa 2 Concluída. Enviando imagem gerada.');

    // Converter data URL para buffer
    const base64Data = generatedImage.split(',')[1];
    const imageBytes = Buffer.from(base64Data, 'base64');
    
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
