"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, Copy, Check, Scan } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const LANGUAGES = [
  { label: "English", code: "eng" },
  { label: "Indonesia", code: "ind" },
  { label: "Arabic", code: "ara" },
  { label: "Chinese (Simplified)", code: "chi_sim" },
  { label: "Chinese (Traditional)", code: "chi_tra" },
  { label: "Japanese", code: "jpn" },
  { label: "Korean", code: "kor" },
]

export function ImageToText() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState("")
  const [text, setText] = useState("")
  const [lang, setLang] = useState(LANGUAGES[0])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const progressRef = useRef(0)

  const runOcr = async (f: File, l: string) => {
    setLoading(true)
    setText("")

    const { createWorker } = await import("tesseract.js")
    const worker = await createWorker(l, 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === "recognizing text") {
          progressRef.current = Math.round(m.progress * 100)
        }
      },
    })

    const { data } = await worker.recognize(f)
    setText(data.text)
    await worker.terminate()
    setLoading(false)
  }

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) return
    setFile(f)
    const u = URL.createObjectURL(f)
    setUrl(u)
    setText("")
    runOcr(f, lang.code)
  }

  useEffect(() => {
    if (file) runOcr(file, lang.code)
  }, [lang])

  const copyText = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {!file && (
        <div onClick={() => inputRef.current?.click()} className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-muted-foreground transition-colors">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <Scan className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Image to Text (OCR)</p>
          <p className="text-sm text-muted-foreground mt-1">Ekstrak teks dari gambar — support 100+ bahasa</p>
        </div>
      )}

      {file && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Bahasa:</span>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => setLang(l)} className={cn("px-3 py-1.5 rounded-md border text-xs transition-all", lang.code === l.code ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground")}>
                {l.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Gambar</p>
              <div className="bg-secondary rounded-lg overflow-hidden">
                <img src={url} alt="" className="w-full object-contain max-h-[400px]" />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Hasil Teks</p>
              <div className="bg-secondary rounded-lg min-h-[200px] max-h-[400px] overflow-y-auto p-4">
                {loading && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                    <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-xs text-muted-foreground">Mengenali teks... {progressRef.current}%</p>
                  </div>
                )}
                {!loading && !text && (
                  <p className="text-sm text-muted-foreground text-center py-8">Tidak ada teks terdeteksi</p>
                )}
                {!loading && text && (
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{text}</pre>
                )}
              </div>
              {text && !loading && (
                <Button onClick={copyText} variant="secondary" size="sm" className="mt-2">
                  {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copied ? "Tersalin" : "Salin Teks"}
                </Button>
              )}
            </div>
          </div>

          <Button onClick={() => { setFile(null); setUrl(""); setText(""); progressRef.current = 0 }} variant="secondary" className="w-full">
            Upload Baru
          </Button>
        </>
      )}
    </div>
  )
}
