"use client";

import { useRef, useState } from "react";
import { deliverOrderAction } from "@/app/admin/actions";

/**
 * Signature pad for delivery: the customer draws with a finger or stylus,
 * staff enter the customer's name, then Done submits the form with the
 * signature as a PNG data URL in a hidden field. No signature is sent
 * anywhere until Done is tapped.
 */
export function SignaturePad({ orderId, signerLabel, clearLabel, doneLabel }: { orderId: string; signerLabel: string; clearLabel: string; doneLabel: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<HTMLInputElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    canvas.setPointerCapture(e.pointerId);
    const ctx = canvas.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    setDrawing(true);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    setSigned(true);
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
    setError(null);
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!signed) {
      e.preventDefault();
      setError("Signature required");
      return;
    }
    dataRef.current!.value = canvasRef.current!.toDataURL("image/png");
  };

  return (
    <form action={deliverOrderAction} onSubmit={submit} className="grid gap-4">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="signatureData" ref={dataRef} />
      <div>
        <label htmlFor="signerName" className="mb-1.5 block text-sm font-medium text-slate-700">{signerLabel}</label>
        <input id="signerName" name="signerName" required maxLength={120} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5" />
      </div>
      <div>
        <canvas
          ref={canvasRef}
          width={600}
          height={240}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={() => setDrawing(false)}
          onPointerLeave={() => setDrawing(false)}
          className="h-40 w-full touch-none rounded-xl border-2 border-dashed border-slate-300 bg-white"
        />
      </div>
      {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={clear} className="min-h-11 rounded-full border border-slate-300 px-5 font-semibold text-slate-700 hover:bg-slate-100">
          {clearLabel}
        </button>
        <button className="min-h-11 rounded-full bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-700">
          {doneLabel}
        </button>
      </div>
    </form>
  );
}
