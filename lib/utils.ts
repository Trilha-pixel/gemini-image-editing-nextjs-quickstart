import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type PoliticalFigure = "bolsonaro" | "lula";
export type FriendGender = "homem" | "mulher";
export interface SceneOption { key: string; label: string; description: string }

export const SCENARIO_OPTIONS: SceneOption[] = [
  { key: "praia", label: "Praia (fim de tarde)", description: "Fim de tarde dourado na praia de Ipanema, luz lateral suave, céu parcialmente nublado, areia com marcas de passos, ondas suaves ao fundo." },
  { key: "planalto", label: "Planalto", description: "Área externa do Palácio do Planalto, Brasília, arquitetura modernista de Niemeyer ao fundo, luz diurna clara, segurança discreta desfocada ao longe." },
  { key: "cristo", label: "Cristo Redentor", description: "Mirante do Cristo Redentor, Rio de Janeiro, céu azul com nuvens leves, vista panorâmica desfocada, turistas ao fundo em bokeh." },
  { key: "paulista", label: "Avenida Paulista", description: "Calçada larga na Avenida Paulista, edifícios de vidro, bandeiras do Brasil ao longe, trânsito leve desfocado, fim de tarde." },
  { key: "congresso", label: "Congresso Nacional", description: "Gramado do Congresso Nacional, cúpulas ao fundo, céu aberto, bandeira do Brasil, composição simétrica, luz suave." },
  { key: "ibirapuera", label: "Parque do Ibirapuera", description: "Parque do Ibirapuera, árvores frondosas, lago refletindo o céu, pista de caminhada ao fundo em bokeh, luz de manhã." },
  { key: "pelourinho", label: "Pelourinho", description: "Casario colonial do Pelourinho, casas coloridas, pedras irregulares no chão, luz quente, vida urbana leve ao fundo." },
  { key: "estadio", label: "Estádio (evento)", description: "Arquibancada de estádio iluminado, gramado verde ao fundo, torcida desfocada, noite com luzes fortes e flare sutil." },
  { key: "cafe", label: "Café moderno (indoor)", description: "Café moderno com plantas, madeira clara, janela grande com luz natural, fundo em bokeh, tons quentes." },
  { key: "biblioteca", label: "Biblioteca/Escritório", description: "Biblioteca moderna, estantes ao fundo, luz difusa de teto, mesa de madeira, atmosfera serena." },
  { key: "jardim", label: "Jardim Botânico", description: "Jardim Botânico, estufa de vidro ao fundo, vegetação tropical, luz filtrada entre folhas." },
  { key: "por-do-sol", label: "Mirante (pôr do sol)", description: "Mirante com pôr do sol intenso, céu alaranjado, flare suave, silhuetas ao longe, vento leve." },
  { key: "paralelepipedo", label: "Rua antiga de paralelepípedos", description: "Rua de paralelepípedos antiga, fachadas históricas, bandeirolas, luz lateral de manhã." },
  { key: "praia-minimal", label: "Praia minimalista", description: "Praia ampla com linha do horizonte limpa, céu suave, tons pastéis, composição minimalista." },
  { key: "parede-neutra", label: "Interior (parede neutra)", description: "Ambiente interno com parede neutra cinza clara, luz difusa frontal, profundidade rasa em bokeh." }
];

export function buildComposePrompt(figure: PoliticalFigure, gender?: FriendGender, sceneDescription?: string): string {
  const name = figure === "bolsonaro" ? "Jair Bolsonaro" : "Luiz Inácio Lula da Silva";
  const genderLine = gender
    ? (gender === "homem"
        ? "A pessoa da foto é um HOMEM adulto."
        : "A pessoa da foto é uma MULHER adulta.") + " "
    : "";
  // Regras adicionais específicas quando a figura é Lula para evitar mistura de identidades
  const lulaSafeguards = figure === "lula"
    ? (
      `RESTRIÇÃO CRÍTICA (Lula): Lula deve aparecer como SEGUNDA pessoa distinta, ` +
      `ao lado/abraçando a pessoa da foto. NÃO transforme a pessoa da foto em Lula. ` +
      `NÃO misture traços do Lula no rosto da pessoa da foto. Evite qualquer fusão ` +
      `de identidades. A pessoa da foto mantém 100% da sua fisionomia original. ` +
      `Lula pode ter barba grisalha curta, cabelo grisalho curto, traços e idade coerentes, ` +
      `mas esses traços NÃO devem migrar para a pessoa da foto. `
    ) : "";

  return (
    // Contexto e tarefa
    `Você recebeu UMA foto de referência. ${genderLine}Gere uma nova IMAGEM FOTORREALISTA ` +
    `onde a MESMA pessoa da foto aparece abraçando ${name}. ` +
    (sceneDescription ? `CENÁRIO: ${sceneDescription} ` : "") +
    lulaSafeguards +
    // Âncora de identidade (má prioridade na semelhança)
    `A foto de referência é a âncora de identidade e deve ter prioridade máxima. ` +
    `Replique a MESMA pessoa (mesma fisionomia), não gere um rosto genérico. ` +
    // Restrições de rosto e geometria
    `Preserve: formato do rosto, distância olhos-nariz-boca, linha do maxilar, sobrancelhas, ` +
    `textura da pele (poros), cicatrizes/sinais, linhas do sorriso, formato dos lábios e nariz, ` +
    `penteado, implante capilar/volume e tipo de barba quando houver. ` +
    // Iluminação/perspectiva/pose
    `Harmonize iluminação e direção de luz com a foto original. ` +
    `Mantenha a pose e a perspectiva do rosto o mais próximas possível. ` +
    // Mãos/anatomia
    `Mãos e braços anatômicos, número correto de dedos, sem deformações. ` +
    // Composição
    `Crie um fundo coerente e natural, sem artefatos, ` +
    `com profundidade e cores realistas. ` +
    // Evitar problemas comuns
    `Evite: suavização excessiva, pele plástica, duplicação de pessoas, ` +
    `olhos desalinhados, dentes borrados, marcas d'água, textos ou logos. ` +
    // Estilo/saída
    `Estética fotográfica com nitidez natural (não exagerar em sharpening). ` +
    `Formato final: foto em alta qualidade, proporção 1:1 ou 4:5. ` +
    // Instrução explícita de uso da imagem
    `USE a imagem de referência como CONTEÚDO DE CONDIÇÃO para garantir a semelhança do rosto. `
  );
}
