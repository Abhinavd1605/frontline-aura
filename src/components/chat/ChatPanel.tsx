import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Mic, MicOff, Send } from "lucide-react";

interface Message { id: string; role: "user" | "assistant"; content: string; imageUrl?: string; }

export function ChatPanel({ selected }: { selected?: string | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const synth = useMemo(() => (typeof window !== 'undefined' ? window.speechSynthesis : null), []);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SR) {
      recognitionRef.current = new SR();
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (e: any) => {
        const text = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
        setInput((prev) => prev ? prev + " " + text : text);
      };
      recognitionRef.current.onend = () => setRecording(false);
    }
  }, []);

  const onSend = async () => {
    if (!input && !imagePreview) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: input || (imagePreview ? "[Image attached]" : ""), imageUrl: imagePreview };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setImagePreview(undefined);

    // Placeholder: integrate Gemini API here using your key (edge function recommended)
    const reply: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: selected ? `You asked about ${selected}. Here's a contextual response (mock).` : "Assistant response (mock).",
    };
    setTimeout(() => {
      setMessages((m) => [...m, reply]);
      if (synth) {
        const utter = new SpeechSynthesisUtterance(reply.content);
        utter.rate = 1.02;
        synth.cancel();
        synth.speak(utter);
      }
    }, 400);
  };

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (recording) {
      recognitionRef.current.stop();
      setRecording(false);
    } else {
      setRecording(true);
      recognitionRef.current.start();
    }
  };

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  return (
    <div className="h-full flex flex-col rounded-lg">
      <div className="flex items-center justify-between mb-2">
        {selected && <div className="text-xs px-2 py-1 rounded bg-secondary">Focused: {selected}</div>}
      </div>
      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[85%] rounded-lg p-3 border bg-card ${m.role === "user" ? "ml-auto" : ""}`}>
            {m.imageUrl && (
              <img src={m.imageUrl} alt="uploaded context" className="mb-2 rounded-md max-h-40 w-auto" loading="lazy" />
            )}
            <p className="text-sm leading-relaxed">{m.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="mt-3 space-y-2">
        {imagePreview && (
          <div className="flex items-center gap-2 text-xs">
            <img src={imagePreview} alt="preview" className="h-10 w-10 rounded object-cover" />
            <span>Image attached</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="icon" onClick={() => fileInputRef.current?.click()} aria-label="Attach image">
            <ImageIcon className="h-4 w-4" />
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="min-h-12 flex-1" />
          <Button onClick={onSend} aria-label="Send"><Send className="h-4 w-4" /></Button>
          <Button variant="secondary" size="icon" onClick={toggleMic} aria-label="Toggle microphone">
            {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">Tip: Voice input uses the browser Speech API. Image input will be sent to Gemini when connected.</p>
      </div>
    </div>
  );
}
