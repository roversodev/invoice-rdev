'use client'

import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { generateInvoicePDF } from '@/lib/pdf-generator'
import { useState } from 'react'

interface DownloadButtonProps {
  invoice: any
  template: any
  primaryColor: string
}

export default function DownloadButton({ invoice, template, primaryColor }: DownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownloadPDF = async () => {
    setIsGenerating(true)
    try {
      const pdf = generateInvoicePDF(invoice, template)
      pdf.save(`Fatura-${invoice.invoice_number}.pdf`)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button 
      className="flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
      style={{ backgroundColor: primaryColor }}
      onClick={handleDownloadPDF}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {isGenerating ? 'Gerando...' : 'Baixar PDF'}
    </Button>
  )
}