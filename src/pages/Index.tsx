import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import { useEffect } from "react";
import { QRConnect } from "@/components/QRConnect";
import { Smartphone, Mic, MessageSquare } from "lucide-react";

const Index = () => {
  useEffect(() => {
    document.title = "CrewMind";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'AI for frontline workers: 3D warehouse visualization, and conversational assistance.');
  }, []);

  return (
    <div className="min-h-[calc(100svh-6rem)] flex items-center">
      <section className="w-full max-w-7xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            AI-powered support for frontline workers.

          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl">
            Ask questions like "What’s the maintenance procedure for Machine 2?" and watch the assistant retrieve procedures, highlight the machine, and answer in voice.
          </p>
          <div className="mt-8 flex items-center gap-3 flex-wrap">
            <NavLink to="/workspace"><Button variant="hero" size="xl" className="hover-scale">Launch Workspace</Button></NavLink>
            <NavLink to="/voice-chat"><Button variant="glass" size="lg" className="hover-scale flex items-center gap-2"><Mic className="h-4 w-4" />Voice Chat</Button></NavLink>
            <NavLink to="/mobile-voice" target="_blank"><Button variant="glass" size="lg" className="hover-scale flex items-center gap-2"><Smartphone className="h-4 w-4" />Mobile Voice</Button></NavLink>
            <NavLink to="/contact"><Button variant="glass" size="lg" className="hover-scale">Request demo</Button></NavLink>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 gap-3 max-w-xl">
            {["3D Digital Twin","Voice + Chat","RAG Context","Device Highlight"].map((t) => (
              <div key={t} className="glass rounded-lg px-4 py-3 text-sm border">{t}</div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          {/* Mobile Connection Section */}
          <div className="glass rounded-2xl border p-6">
            <QRConnect />
          </div>
          
          {/* Features Preview */}
          <div className="glass rounded-2xl border p-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Communication Options</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-sm">Text Chat</div>
                  <div className="text-xs text-gray-600">Type your questions in the workspace</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                <Mic className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-sm">Desktop Voice</div>
                  <div className="text-xs text-gray-600">Use microphone on your computer</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                <Smartphone className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium text-sm">Mobile Voice</div>
                  <div className="text-xs text-gray-600">Push-to-talk from your phone (requires mic permission)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
