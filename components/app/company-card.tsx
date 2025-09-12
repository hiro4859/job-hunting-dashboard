"use client"

import { Building2, Calendar, Target } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Company } from "@/types"

interface CompanyCardProps {
  company: Company
  onClick?: (id: string) => void
}

export function CompanyCard({ company, onClick }: CompanyCardProps) {
  const getStatusColor = (status?: Company["status"]) => {
    switch (status) {
      case "内定": return "bg-green-500/20 text-green-700 border-green-500/30"
      case "面接": return "bg-blue-500/20 text-blue-700 border-blue-500/30"
      case "書類": return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30"
      default: return "bg-gray-500/20 text-gray-700 border-gray-500/30"
    }
  }

  return (
  <Card
    className="glass-card hover:bg-white/20 transition-all duration-200 cursor-pointer group
               bg-card border border-border shadow-sm rounded-xl"
    onClick={() => onClick?.(company.id)}
  >
    <CardContent className="p-0">
      <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-2xl flex items-center justify-center border-b border-white/10">
        {company.logoSrc ? (
          <img
            src={company.logoSrc || "/placeholder.svg"}
            alt={`${company.name} logo`}
            className="w-16 h-16 object-contain"
          />
        ) : (
          <Building2 className="size-12 text-primary/60" />
        )}
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground text-balance group-hover:text-primary transition-colors">
            {company.name}
          </h3>
          {company.industry && (
            <p className="text-sm text-muted-foreground mt-1">{company.industry}</p>
          )}
        </div>
        <div className="flex items-center justify-between">
          {company.status && (
            <Badge className={getStatusColor(company.status)}>{company.status}</Badge>
          )}
          {company.priority && (
            <div className="flex items-center gap-1">
              <Target className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{company.priority}</span>
            </div>
          )}
        </div>
        {company.deadline && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="size-3" />
            <span>{company.deadline}</span>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)

}

