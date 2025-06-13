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
import { Trash2, Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DeleteClientModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  clientName: string
  isDeleting?: boolean
  hasActiveInvoices?: boolean
  activeInvoicesCount?: number
}

export function DeleteClientModal({
  isOpen,
  onClose,
  onConfirm,
  clientName,
  isDeleting = false,
  hasActiveInvoices = false,
  activeInvoicesCount = 0
}: DeleteClientModalProps) {
  const [confirmText, setConfirmText] = useState('')

  const handleClose = () => {
    if (isDeleting) return
    setConfirmText('')
    onClose()
  }

  const handleConfirm = async () => {
    if (confirmText !== clientName || isDeleting || hasActiveInvoices) return
    await onConfirm()
    setConfirmText('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Excluir Cliente
          </DialogTitle>
          <DialogDescription>
            {hasActiveInvoices 
              ? "Este cliente não pode ser excluído pois possui faturas ativas."
              : "Esta ação não pode ser desfeita. Para confirmar a exclusão, digite o nome do cliente abaixo:"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {hasActiveInvoices && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Este cliente possui {activeInvoicesCount} fatura(s) ativa(s). 
                Exclua ou arquive as faturas primeiro antes de excluir o cliente.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="confirm-name">Nome do cliente:</Label>
            <div className="text-sm font-medium text-muted-foreground bg-muted p-2 rounded">
              {clientName}
            </div>
          </div>
          
          {!hasActiveInvoices && (
            <div className="space-y-2">
              <Label htmlFor="confirm-input">Digite o nome para confirmar:</Label>
              <Input
                id="confirm-input"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite o nome do cliente"
                className={confirmText === clientName ? "border-green-500" : ""}
                disabled={isDeleting}
              />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          {!hasActiveInvoices && (
            <Button 
              variant="destructive" 
              onClick={handleConfirm}
              disabled={confirmText !== clientName || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Cliente
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}