"use client"

import { useState } from "react"

import { HomeButton } from "@/components/app/home-button"
import { CompanySelect } from "@/components/app/company-select"
import { MailPasteBox } from "@/components/app/mail-paste-box"
import { ParseResults } from "@/components/app/parse-results"
import { UpdateCompanyButton } from "@/components/app/update-company-button"
import { Button } from "@/components/ui/button"
import { FileSearch } from "lucide-react"
import type { ParseItem } from "@/types"

export default function MailParsePage() {
  const [selectedCompany, setSelectedCompany] = useState("")
  const [emailContent, setEmailContent] = useState("")
  const [parseResults, setParseResults] = useState<ParseItem[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleParse = async () => {
    if (!emailContent.trim()) return

    setIsAnalyzing(true)
    console.log("[v0] Parsing email content:", emailContent.substring(0, 100) + "...")

    // Simulate email parsing with mock results
    setTimeout(() => {
      const mockResults: ParseItem[] = [
        {
          key: "日時",
          value: "2024年12月20日（金） 14:00-15:30",
        },
        {
          key: "会場",
          value: "東京都千代田区丸の内1-1-1 ○○ビル 15階 会議室A",
        },
        {
          key: "締切",
          value: "2024年12月18日（水） 17:00まで",
        },
        {
          key: "合否",
          value: "一次面接通過",
        },
        {
          key: "その他",
          value: "履歴書・職務経歴書をご持参ください。当日は受付にて「面接参加」とお伝えください。",
        },
      ]

      setParseResults(mockResults)
      setIsAnalyzing(false)
    }, 2000)
  }

  const handleUpdateCompany = () => {
    if (!selectedCompany) {
      console.log("[v0] No company selected for update")
      return
    }

    console.log("[v0] Updating company information:", {
      company: selectedCompany,
      parseResults,
    })
    // TODO: Implement actual company update logic
  }

 return (
  <div className="min-h-screen p-6">
    {/* Header */}
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-foreground">メール解析</h1>
      <HomeButton />
    </div>

    <div className="max-w-4xl mx-auto space-y-6">
      {/* Company Selection */}
      <CompanySelect value={selectedCompany} onChange={setSelectedCompany} />

      {/* Email Paste Box */}
      <MailPasteBox
        value={emailContent}
        onChange={setEmailContent}
        onParse={handleParse}
        isAnalyzing={isAnalyzing}
      />

      {/* Parse Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleParse}
          disabled={!emailContent.trim() || isAnalyzing}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3"
          size="lg"
        >
          <FileSearch className="size-5 mr-2" />
          {isAnalyzing ? "解析中..." : "解析"}
        </Button>
      </div>

      {/* Parse Results */}
      {parseResults.length > 0 && (
        <>
          <ParseResults results={parseResults} />
          {/* Update Company Button */}
          <div className="flex justify-center">
            <UpdateCompanyButton onUpdate={handleUpdateCompany} disabled={!selectedCompany} />
          </div>
        </>
      )}
    </div>
  </div>
)

}
