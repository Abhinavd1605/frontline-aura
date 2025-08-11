import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export default function Ingest() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [machines, setMachines] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [form, setForm] = useState({ name: '', posX: 0, posY: 0, posZ: 0 });

  const loadMachines = async () => {
    const r = await fetch('/api/machines');
    const data = await r.json();
    setMachines(data || []);
  };

  useEffect(() => { loadMachines(); }, []);

  const onUpload = async () => {
    if (!files || files.length === 0) return;
    if (!selectedId) { setStatus('Please select a machine.'); return; }
    const form = new FormData();
    Array.from(files).forEach((f) => form.append('files', f));
    try {
      setBusy(true);
      setStatus('Uploading and indexing...');
      const params = selectedId ? `?machineId=${encodeURIComponent(selectedId)}` : '';
      const resp = await fetch(`/api/ingest/upload${params}`, { method: 'POST', body: form });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Upload failed');
      setStatus(`Indexed ${data.upserted} document(s) to Pinecone.`);
    } catch (e: any) {
      setStatus(e.message || 'Failed to ingest. If the file is large, try a smaller one or contact admin to raise MAX_UPLOAD_MB.');
    } finally {
      setBusy(false);
    }
  };

  const onCreate = async () => {
    try {
      setBusy(true);
      setStatus('Creating machine...');
      const resp = await fetch('/api/machines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Create failed');
      setStatus('Machine created.');
      setForm({ name: '', posX: 0, posY: 0, posZ: 0 });
      await loadMachines();
    } catch (e: any) {
      setStatus(e.message || 'Failed to create machine.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <section className="rounded-xl border p-4 bg-card">
        <h2 className="text-lg font-semibold mb-3">Machines</h2>
        <div className="max-h-60 overflow-auto border rounded-md">
          {machines.map((m) => (
            <label key={m.id} className={`flex items-center justify-between px-3 py-2 border-b last:border-b-0 ${selectedId===m.id?'bg-secondary':''}`}>
              <div className="flex-1">
                <div className="text-sm font-medium">{m.name}</div>
                <div className="text-xs text-muted-foreground">pos {m.posX.toFixed(1)}, {m.posY.toFixed(1)}, {m.posZ.toFixed(1)}</div>
              </div>
              <input type="radio" name="machine" checked={selectedId===m.id} onChange={() => setSelectedId(m.id)} />
            </label>
          ))}
        </div>

        <h3 className="text-sm font-medium mt-4 mb-2">Add new machine</h3>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="col-span-2" />
          <Input type="number" step="0.1" placeholder="posX" value={form.posX} onChange={(e)=>setForm({...form,posX:parseFloat(e.target.value)})} />
          <Input type="number" step="0.1" placeholder="posY" value={form.posY} onChange={(e)=>setForm({...form,posY:parseFloat(e.target.value)})} />
          <Input type="number" step="0.1" placeholder="posZ" value={form.posZ} onChange={(e)=>setForm({...form,posZ:parseFloat(e.target.value)})} />
        </div>
        <div className="mt-2"><Button onClick={onCreate} disabled={busy || !form.name}>Create</Button></div>
      </section>

      <section className="rounded-xl border p-4 bg-card">
        <h2 className="text-lg font-semibold mb-3">Place in 3D</h2>
        <div className="h-72 rounded-md overflow-hidden border">
          <Canvas camera={{ position: [6, 5, 8], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[6, 8, 3]} intensity={0.6} />
            <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.5,0]}>
              <planeGeometry args={[30,30]} />
              <meshStandardMaterial color="#e7e5e4" />
            </mesh>
            {machines.map((m)=> (
              <mesh key={m.id} position={[m.posX, m.posY, m.posZ]}>
                <boxGeometry args={[1.2,0.8,1.0]} />
                <meshStandardMaterial color={selectedId===m.id? '#2563eb':'#1d4ed8'} />
              </mesh>
            ))}
            <OrbitControls enableDamping dampingFactor={0.08} />
          </Canvas>
        </div>

        <h2 className="text-lg font-semibold mt-6 mb-3">Attach documents</h2>
        <input type="file" accept=".pdf,text/plain" multiple onChange={(e) => setFiles(e.target.files)} />
        <div className="flex gap-2 mt-2">
          <Button onClick={onUpload} disabled={busy || !files || files.length === 0 || !selectedId}>Upload and Index</Button>
        </div>
        {status && <div className="text-sm text-muted-foreground mt-2">{status}</div>}
      </section>
    </div>
  );
}


