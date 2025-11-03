"use client";
import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { ImageResultDisplay } from "@/components/ImageResultDisplay";
import { Button } from "@/components/ui/button";
import { ImageIcon, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoryItem } from "@/lib/types";
import { buildComposePrompt, type PoliticalFigure, type FriendGender } from "@/lib/utils";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [friendGender, setFriendGender] = useState<"homem" | "mulher" | null>(null);

  const handleImageSelect = (imageData: string) => {
    setImage(imageData || null);
  };

  

  const handleReset = () => {
    setImage(null);
    setGeneratedImage(null);
    setDescription(null);
    setIsLoading(false);
    setError(null);
    setHistory([]);
    setResultImage(null);
  };

  // If we have a generated image, we want to edit it next time
  const currentImage = generatedImage || image;
  

// Get the latest image to display (prefer mocked/API result image, then generated)
  const displayImage = resultImage || generatedImage;

  const handleGenerateLLM = async (politicalFigure: PoliticalFigure) => {
    if (!image) return;
    try {
      setIsLoading(true);
      setError(null);
      setResultImage(null);

      const prompt = buildComposePrompt(politicalFigure, friendGender as FriendGender | undefined);
      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, image })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Falha ao gerar imagem");
      }

      const data = await response.json();
      if (data?.image) {
        setResultImage(data.image);
        setDescription(data.description || null);
      } else {
        throw new Error("Resposta sem imagem");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-8">
      <Card className="w-full max-w-4xl border-0 bg-card shadow-none">
        <CardHeader className="flex flex-col items-center justify-center space-y-2">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Wand2 className="w-8 h-8 text-primary" />
            Image Creation & Editing
          </CardTitle>
          <span className="text-sm font-mono text-muted-foreground">
            powered by Google DeepMind Gemini 2.0 Flash
          </span>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 w-full">
          {error && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          {!displayImage && !isLoading ? (
            <>
              <ImageUpload
                onImageSelect={handleImageSelect}
                currentImage={currentImage}
              />
              <div className="pt-4 space-y-2">
                <p className="text-sm text-muted-foreground">Seu amigo é um:</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={friendGender === "homem" ? "default" : "outline"}
                    onClick={() => setFriendGender("homem")}
                  >
                    Homem
                  </Button>
                  <Button
                    type="button"
                    variant={friendGender === "mulher" ? "default" : "outline"}
                    onClick={() => setFriendGender("mulher")}
                  >
                    Mulher
                  </Button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="default" disabled={!image || !friendGender} onClick={() => handleGenerateLLM('bolsonaro')}>
                  Gerar com Bolsonaro
                </Button>
                <Button variant="secondary" disabled={!image || !friendGender} onClick={() => handleGenerateLLM('lula')}>
                  Gerar com Lula
                </Button>
              </div>
            </>
          ) : isLoading ? (
            <div
              role="status"
              className="flex items-center mx-auto justify-center h-56 max-w-sm bg-gray-300 rounded-lg animate-pulse dark:bg-secondary"
            >
              <ImageIcon className="w-10 h-10 text-gray-200 dark:text-muted-foreground" />
              <span className="pl-4 font-mono font-xs text-muted-foreground">
                Criando sua obra-prima...
              </span>
            </div>
          ) : (
            <>
              <ImageResultDisplay
                imageUrl={displayImage || ""}
                description={description}
                onReset={handleReset}
                conversationHistory={history}
              />
              {resultImage && (
                <div className="pt-4">
                  <a href={resultImage} download="meme-gerado.jpg">
                    <Button variant="default">Baixar Imagem</Button>
                  </a>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
