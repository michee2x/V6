"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export interface AbilityTemplate {
  id: string;
  title: string;
  prompt: string;
  imageFallback: string; // Gradient or simple color for now
}

const ABILITIES: AbilityTemplate[] = [
  {
    id: "80s-flashback",
    title: "'80s flashback",
    prompt: "Using my uploaded photo, show me what I would have looked like around 1985. Preserve my identity, facial features, skin tone, age, and recognizable appearance. Reimagine my hair, clothing, accessories, and surroundings with bold, unmistakably mid-1980s styling—expressive silhouettes, statement accessories, layered details, distinctive colors, and textures. Make it feel like a genuine 1985 photograph with analog grain, faded color, direct flash, and subtle softness. Add a period-accurate 1980s red-orange date stamp in the lower corner. No modern objects or text.",
    imageFallback: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  },
  {
    id: "studio-headshot",
    title: "Studio headshot",
    prompt: "Transform this photo into an elevated fashion studio portrait. Choose a complementing-color background that enhances the subject's skin tone. Keep a tight head-and-shoulder composition with the subject centered and facing the camera straight with an optimistic expression. Apply directional lighting with subtle shadows. Preserve natural skin tones while making the image polished, minimal, and editorial—like a magazine photoshoot.",
    imageFallback: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  },
  {
    id: "anime",
    title: "Anime",
    prompt: "Convert this photo into a vibrant, high-quality anime illustration. Preserve the subject's core identity, facial features, and pose, but reimagine them in a classic 90s anime art style. Use bold cel shading, highly saturated colors, and dramatic lighting. The background should be a detailed, painterly anime background that matches the mood of the original photo.",
    imageFallback: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
  },
  {
    id: "sketch",
    title: "Sketch",
    prompt: "Turn this photo into a detailed charcoal and pencil sketch. Preserve the exact likeness and structural details of the subject. Use rough, expressive pencil strokes for the shading, with high contrast between light and shadow. Remove the background entirely, leaving just the beautiful, hand-drawn sketch of the subject on a subtle textured paper background.",
    imageFallback: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
  }
];

interface AbilitiesMenuProps {
  onSelect: (prompt: string) => void;
}

export function AbilitiesMenu({ onSelect }: AbilitiesMenuProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground shrink-0 ml-1"
          aria-label="Abilities & Templates"
          title="Abilities & Templates"
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] sm:w-[400px] p-4 shadow-xl border-border">
        <div className="flex flex-col gap-3">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Trending Abilities</h4>
            <p className="text-xs text-muted-foreground">Select a template to magically transform your photo.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ABILITIES.map((ability) => (
              <button
                key={ability.id}
                type="button"
                className="group relative flex flex-col items-start gap-2 overflow-hidden rounded-xl border border-border/50 bg-muted/20 text-left transition-all hover:border-primary/50 hover:bg-muted/50 hover:shadow-md"
                onClick={() => {
                  onSelect(ability.prompt);
                  setOpen(false);
                }}
              >
                <div 
                  className="w-full aspect-[4/3] rounded-t-xl"
                  style={{ background: ability.imageFallback }}
                />
                <div className="p-2 pt-1 w-full">
                  <span className="block text-xs font-medium text-foreground truncate w-full group-hover:text-primary transition-colors">
                    {ability.title}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
