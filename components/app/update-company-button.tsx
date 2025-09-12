"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UpdateCompanyButtonProps {
  onUpdate: () => void
  disabled?: boolean
}

export function UpdateCompanyButton({ onUpdate, disabled }: UpdateCompanyButtonProps) {
  return (
    <Button
      onClick={onUpdate}
      disabled={disabled}
      size="lg"
      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
    >
      <RefreshCw className="size-5 mr-2" />
      企業情報を更新
    </Button>
  )
}
