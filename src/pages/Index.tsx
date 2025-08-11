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
    <div className="min-h-[calc(100svh-6rem)] flex items-center justify-center">
      <section className="w-full max-w-6xl text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight animate-enter">
          AI for Frontline Workers, with a Liquid Glass Interface
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in">
          See your workplace in 3D and talk to your machines. Guide tasks, diagnose issues, and accelerate throughput with a conversational copilot.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <NavLink to="/workspace"><Button variant="hero" size="xl" className="hover-scale">Open Workspace</Button></NavLink>
          <NavLink to="/contact"><Button variant="glass" size="lg" className="hover-scale">Request demo</Button></NavLink>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "3D Digital Twin", body: "Navigate a live warehouse twin with contextual machine insights." },
            { title: "Conversational Ops", body: "Ask questions, trigger SOPs, and summarize shifts." },
            { title: "Multimodal", body: "Voice in, image in, telemetry out—grounded responses you can trust." },
          ].map((f) => (
            <article key={f.title} className="glass rounded-xl p-6 text-left border">
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
