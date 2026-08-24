"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, PlayCircle, CheckCircle2 } from "lucide-react";

const SHOWCASE_ITEMS = [
  {
    id: "showcase-1",
    source: "Health App TikTok Ad",
    beforeThumb: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=60", 
    afterBrief: "15s vertical video. Hook: Split screen showing 'Before Recrea8' vs 'After'. Fast pacing (cuts every 1.5s). Tone: Energetic and relatable. Core message: 'Stop staring at a blank page.'",
    userType: "Free tier user"
  },
  {
    id: "showcase-2",
    source: "B2B SaaS LinkedIn Carousel",
    beforeThumb: "https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=800&auto=format&fit=crop&q=60",
    afterBrief: "5-slide carousel. High contrast dark mode theme. Slide 1: Bold contrarian statement. Slides 2-4: Data points with simple charts. Slide 5: Strong CTA to download the report.",
    userType: "Free tier user"
  },
  {
    id: "showcase-3",
    source: "E-commerce Product Video",
    beforeThumb: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=60",
    afterBrief: "30s product demo. Hook: Extreme close-up of product texture. Audio: ASMR style sound effects. Lighting: Moody, cinematic. Call to action: 'Shop the new collection' with a subtle glow effect.",
    userType: "Free tier user"
  }
];

export function BeforeAfterShowcase() {
  return (
    <div className="w-full flex flex-col gap-8 py-12 border-t border-border/40 mt-12">
      <div className="flex flex-col items-center gap-3 text-center px-4">
        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
          Community Showcase
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground max-w-xl">
          See what others are recreating
        </h2>
        <p className="text-muted-foreground max-w-prose">
          Real examples of how creators are turning inspiration into execution using Recrea8.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 max-w-7xl mx-auto w-full">
        {SHOWCASE_ITEMS.map((item) => (
          <Card key={item.id} className="overflow-hidden border-border/50 bg-background/50 hover:bg-muted/20 transition-colors">
            <CardContent className="p-0 flex flex-col h-full">
              {/* Before Section */}
              <div className="relative h-48 w-full bg-muted overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={item.beforeThumb} 
                  alt={item.source}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur-md border-white/10 text-[10px]">
                    BEFORE
                  </Badge>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                   <span className="text-sm font-medium text-white">{item.source}</span>
                   <PlayCircle className="w-5 h-5 text-white/70" />
                </div>
              </div>

              {/* Transition Divider */}
              <div className="relative h-px bg-border w-full">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center shadow-sm">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* After Section */}
              <div className="p-6 flex flex-col flex-1 gap-4 bg-primary/5">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-background text-primary border-primary/20 text-[10px]">
                    AFTER
                  </Badge>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Shared by {item.userType.toLowerCase()}
                  </span>
                </div>
                
                <div className="flex-1">
                  <p className="text-sm text-foreground/80 leading-relaxed font-mono bg-background/60 p-4 rounded-lg border border-border/50">
                    {item.afterBrief}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
