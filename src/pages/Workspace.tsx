import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";

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
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <section className="glass rounded-xl border p-3">
        <h1 className="sr-only">3D Warehouse Visualization</h1>
        <div className="h-[60vh] md:h-[70vh] rounded-lg overflow-hidden">
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
        <p className="mt-3 text-xs text-muted-foreground">Click a machine to focus the assistant.</p>
      </section>
      <aside>
        <h2 className="text-xl font-semibold mb-3">Chat</h2>
        <ChatPanel selected={selected} />
      </aside>
    </div>
  );
}
