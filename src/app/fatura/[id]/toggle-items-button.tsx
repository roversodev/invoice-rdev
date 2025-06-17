'use client'

import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export default function ToggleItemsButton() {
  const [isHidden, setIsHidden] = useState(false)

  const handleToggleItems = () => {
    const itemsTable = document.getElementById('items-table')
    if (itemsTable) {
      const newHiddenState = !isHidden
      itemsTable.style.display = newHiddenState ? 'none' : 'block'
      setIsHidden(newHiddenState)
    }
  }

  return (
    <Button 
      variant="outline" 
      className="flex items-center gap-2 font-semibold border-2 hover:bg-gray-50 transition-all duration-200"
      onClick={handleToggleItems}
    >
      {isHidden ? (
        <Eye className="w-4 h-4" />
      ) : (
        <EyeOff className="w-4 h-4" />
      )}
      {isHidden ? 'Mostrar itens' : 'Ocultar itens'}
    </Button>
  )
}