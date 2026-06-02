import Link from "next/link"
import { Zap } from "lucide-react"

const tools = [
  { label: "Compress Image", href: "/#compress" },
  { label: "Remove Background", href: "/#remove-bg" },
  { label: "Resize Image", href: "/#resize" },
  { label: "Pas Foto Online", href: "/#pas-foto" },
  { label: "WA Sticker Maker", href: "/#sticker" },
  { label: "Crop Marketplace", href: "/#smart-crop" },
  { label: "Format Converter", href: "/#convert" },
  { label: "Watermark", href: "/#watermark" },
  { label: "Image to PDF", href: "/#pdf" },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">cutbray</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Image tools 100% gratis yang jalan di browser kamu. Aman, cepat, tanpa upload server.
            </p>
          </div>

          {/* Tools */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Tools</h4>
            <ul className="space-y-2">
              {tools.map(t => (
                <li key={t.href}>
                  <Link href={t.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Kebijakan Privasi</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Syarat & Ketentuan</Link></li>
              <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Harga</Link></li>
            </ul>
          </div>

          {/* Trust */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Kenapa Cutbray?</h4>
            <ul className="space-y-2">
              <li className="text-sm text-muted-foreground">100% client-side</li>
              <li className="text-sm text-muted-foreground">No upload, no server</li>
              <li className="text-sm text-muted-foreground">Privasi terjamin</li>
              <li className="text-sm text-muted-foreground">Gratis selamanya</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Cutbray. All processing happens in your browser — we never see your images.
          </p>
        </div>
      </div>
    </footer>
  )
}
