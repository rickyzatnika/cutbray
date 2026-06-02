import type { Metadata } from "next"
import Link from "next/link"
import { Shield, Zap, ServerOff, Lock } from "lucide-react"

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Cutbray memproses semua gambar 100% di browser. Kami tidak pernah melihat, menyimpan, atau mengupload gambar Anda.",
}

const points = [
  {
    icon: ServerOff,
    title: "Zero Server Upload",
    desc: "Semua gambar yang Anda proses TIDAK PERNAH dikirim ke server kami. Semua komputasi berjalan di browser Anda menggunakan WebAssembly, Canvas API, dan AI model yang di-download langsung ke device Anda.",
  },
  {
    icon: Lock,
    title: "100% Client-Side",
    desc: "Compress, remove background, resize, crop — semua tool berjalan di browser Anda. Tidak ada data yang meninggalkan device Anda. Cocok untuk gambar sensitif atau pribadi.",
  },
  {
    icon: Shield,
    title: "Tidak Ada Penyimpanan",
    desc: "Kami tidak menyimpan gambar Anda. Setelah halaman ditutup atau di-refresh, semua data hilang. Kami juga tidak memiliki database gambar atau log file upload.",
  },
  {
    icon: Zap,
    title: "AI Model di Browser",
    desc: "Fitur remove background menggunakan AI model (ONNX) yang di-download satu kali ke browser Anda. Model ini berjalan lokal tanpa perlu koneksi internet setelah download awal.",
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">cutbray</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Kebijakan Privasi</h1>
        <p className="text-muted-foreground mb-12">
          Terakhir diperbarui: Juni 2026
        </p>

        <div className="space-y-10">
          {points.map(p => {
            const Icon = p.icon
            return (
              <div key={p.title} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">{p.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 p-6 bg-secondary/50 rounded-lg border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-2">Ada pertanyaan?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Cutbray dibangun dengan prinsip privasi-by-design. Jika Anda memiliki pertanyaan tentang bagaimana data Anda diproses, jangan ragu untuk menghubungi kami.
          </p>
          <Link href="/" className="text-sm text-primary hover:underline">
            Kembali ke beranda →
          </Link>
        </div>
      </main>
    </div>
  )
}
