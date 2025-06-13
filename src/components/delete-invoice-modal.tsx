"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Loader2 } from "lucide-react"

interface DeleteInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  invoiceTitle: string
  isDeleting?: boolean
}

export function DeleteInvoiceModal({
  isOpen,
  onClose,
  onConfirm,
  invoiceTitle,
  isDeleting = false
}: DeleteInvoiceModalProps) {
  const [confirmText, setConfirmText] = useState('')

  const handleClose = () => {
    if (isDeleting) return
    setConfirmText('')
    onClose()
  }

  const handleConfirm = async () => {
    if (confirmText !== invoiceTitle || isDeleting) return
    await onConfirm()
    setConfirmText('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Excluir Fatura
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Para confirmar a exclusão, digite o título da fatura abaixo:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-title">Título da fatura:</Label>
            <div className="text-sm font-medium text-muted-foreground bg-muted p-2 rounded">
              {invoiceTitle}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-input">Digite o título para confirmar:</Label>
            <Input
              id="confirm-input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Digite o título da fatura"
              className={confirmText === invoiceTitle ? "border-green-500" : ""}
              disabled={isDeleting}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={confirmText !== invoiceTitle || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Fatura
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}