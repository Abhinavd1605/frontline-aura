import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

function MachineBox({ position, name, onSelect }: { position: [number, number, number]; name: string; onSelect: (n: string) => void; }) {
  return (
    <mesh position={position} onClick={() => onSelect(name)}>
      <boxGeometry args={[1.4, 0.8, 1.0]} />
      <meshStandardMaterial color="#5aa9e6" metalness={0.2} roughness={0.4} />
    </mesh>
  );
}

export default function Workspace() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="h-[calc(100svh-4rem)] overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="overflow-hidden h-full">
        <ResizablePanel defaultSize={65} minSize={40}>
          <section className="h-full bg-card">
            <h1 className="sr-only">3D Warehouse Visualization</h1>
            <div className="h-full">
              <Canvas camera={{ position: [6, 5, 8], fov: 50 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[6, 8, 3]} intensity={0.6} />

                {/* Floor */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                  <planeGeometry args={[40, 40]} />
                  <meshStandardMaterial color="#1f2630" metalness={0.3} roughness={0.9} />
                </mesh>

                {/* Machines */}
                <MachineBox position={[0, 0, 0]} name="Conveyor A" onSelect={setSelected} />
                <MachineBox position={[3, 0, -2]} name="Packer B" onSelect={setSelected} />
                <MachineBox position={[-3, 0, 2]} name="Sorter C" onSelect={setSelected} />

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
              <ChatPanel selected={selected} />
            </div>
          </aside>
        </ResizablePanel>
      </ResizablePanelGroup>
      {/* Footer hint removed to prevent page scroll */}
    </div>
  );
}
