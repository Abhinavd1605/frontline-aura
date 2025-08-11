import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "Frontline AI — Liquid Glass Interface";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'AI for frontline workers: liquid glass UI, 3D warehouse visualization, and conversational assistance.');
  }, []);

  return (
    <div className="min-h-[calc(100svh-6rem)] flex items-center">
      <section className="w-full max-w-7xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            AI-Powered 3D Warehouse Assistant
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl">
            Ask questions like "What’s the maintenance procedure for Machine 2?" and watch the assistant retrieve procedures, highlight the machine, and answer in voice.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <NavLink to="/workspace"><Button variant="hero" size="xl" className="hover-scale">Launch Workspace</Button></NavLink>
            <NavLink to="/contact"><Button variant="glass" size="lg" className="hover-scale">Request demo</Button></NavLink>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 gap-3 max-w-xl">
            {["3D Digital Twin","Voice + Chat","RAG Context","Device Highlight"].map((t) => (
              <div key={t} className="glass rounded-lg px-4 py-3 text-sm border">{t}</div>
            ))}
          </div>
        </div>
        <div className="hidden md:block">
          <div className="glass rounded-2xl h-[360px] border p-6 flex items-center justify-center text-muted-foreground">
            Product preview area
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
