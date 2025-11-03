import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type PoliticalFigure = "bolsonaro" | "lula";

export function buildComposePrompt(figure: PoliticalFigure): string {
  const name = figure === "bolsonaro" ? "Jair Bolsonaro" : "Luiz Inácio Lula da Silva";
  return (
    `Pegue a foto enviada e gere uma nova imagem realista onde a pessoa da foto ` +
    `aparece abraçando ${name}. Mantenha rosto, pele e iluminação originais, ` +
    `respeite a pose e perspectiva, crie um fundo coerente e fotorrealista, ` +
    `sem artefatos. Resultado final em alta qualidade, estilo foto.`
  );
}
