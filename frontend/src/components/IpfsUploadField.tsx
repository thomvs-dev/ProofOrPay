"use client";

import { useCallback, useRef, useState } from "react";
import { isValidCid, uploadToIpfs } from "@/lib/ipfs";
import { NbLabel } from "@/components/ui/NbInput";

export function IpfsUploadField({
  label,
  cid,
  onCidChange,
  accept = "image/*",
  hint,
}: {
  label: string;
  cid: string;
  onCidChange: (cid: string) => void;
  accept?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      setPreview(URL.createObjectURL(file));
      try {
        const newCid = await uploadToIpfs(file);
        onCidChange(newCid);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setUploading(false);
      }
    },
    [onCidChange],
  );

  return (
    <div className="space-y-2">
      <NbLabel>{label}</NbLabel>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="nb-btn-ghost text-xs shrink-0 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload to IPFS"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        <input
          className="nb-input font-mono text-xs flex-1"
          placeholder="Or paste CID (bafy… / Qm…)"
          value={cid}
          onChange={(e) => onCidChange(e.target.value)}
        />
      </div>
      {hint && <p className="text-xs text-black/45">{hint}</p>}
      {cid && isValidCid(cid) && (
        <p className="text-xs text-emerald-700 font-mono truncate">✓ {cid}</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {preview && (
        <div className="w-24 h-24 border border-black/10 rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}
