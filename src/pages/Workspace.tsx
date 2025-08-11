import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useEffect, useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";

function MachineBox({ position, name, onSelect, selected }: { position: [number, number, number]; name: string; onSelect: (n: string) => void; selected?: boolean; }) {
  return (
    <group position={position} onClick={() => onSelect(name)}>
      <mesh>
        <boxGeometry args={[1.4, 0.8, 1.0]} />
        <meshStandardMaterial color={selected ? "#2563eb" : "#1d4ed8"} metalness={0.2} roughness={0.4} />
      </mesh>
      <Html center distanceFactor={10} occlude>
        <div className={`px-2 py-1 rounded-md text-xs ${selected ? 'bg-blue-600 text-white' : 'bg-white text-black/80'} border`}>{name}</div>
      </Html>
    </group>
  );
}

export default function Workspace() {
  const [selected, setSelected] = useState<string | null>(null);
  const [machines, setMachines] = useState<{ id: string; name: string; posX: number; posY: number; posZ: number }[]>([]);

  useEffect(() => {
    const handler = (e: any) => {
      const name = e?.detail as string;
      if (name) setSelected(name);
    };
    window.addEventListener('assistant:focus', handler);
    return () => window.removeEventListener('assistant:focus', handler);
  }, []);

  useEffect(() => {
    // Load machines from API so Workspace mirrors the Ingest 3D space
    const load = async () => {
      try {
        const r = await fetch('/api/machines');
        const data = await r.json();
        if (Array.isArray(data)) setMachines(data);
      } catch {}
    };
    load();
  }, []);

  return (
    <div className="h-[calc(100svh-4rem)] overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="overflow-hidden h-full">
        <ResizablePanel defaultSize={65} minSize={40}>
          <section className="h-full bg-card">
            <div className="absolute z-10 left-4 top-4 flex gap-2">
              <NavLink to="/ingest"><Button size="sm" variant="secondary">Train Model</Button></NavLink>
            </div>
            <h1 className="sr-only">3D Warehouse Visualization</h1>
            <div className="h-full">
              <Canvas camera={{ position: [6, 5, 8], fov: 50 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[6, 8, 3]} intensity={0.6} />

                {/* Floor */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                  <planeGeometry args={[40, 40]} />
                  <meshStandardMaterial color="#e7e5e4" metalness={0.1} roughness={1} />
                </mesh>

                {/* Machines from DB */}
                {machines.length > 0 ? (
                  machines.map((m) => (
                    <MachineBox
                      key={m.id}
                      position={[m.posX, m.posY, m.posZ]}
                      name={m.name}
                      onSelect={setSelected}
                      selected={selected === m.name}
                    />
                  ))
                ) : (
                  <MachineBox position={[0, 0, 0]} name="Machine A" onSelect={setSelected} selected={selected === 'Machine A'} />
                )}

                <OrbitControls enableDamping dampingFactor={0.08} />
              </Canvas>
            </div>
          </section>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={35} minSize={25}>
          <aside className="h-full flex flex-col">
            <div className="px-4 md:px-5 py-3 border-b text-sm font-medium text-foreground/80">Assistant</div>
            <div className="flex-1 p-3 md:p-4 overflow-hidden">
              <ChatPanel selected={selected} machines={machines.map(m=>m.name)} />
            </div>
          </aside>
        </ResizablePanel>
      </ResizablePanelGroup>
      {/* Footer hint removed to prevent page scroll */}
    </div>
  );
}
