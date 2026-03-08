"use client"

import { useState } from "react"

// --- TypeScript interfaces matching our FastAPI response shapes ---
interface IngredientFlag {
  ingredient_name: string
  flagged_categories: string[]
}

interface AnalyzeResponse {
  flagged_ingredients: IngredientFlag[]
  clean_ingredients: string[]
  summary: Record<string, number>
}

interface SuggestResponse {
  suggestion: string
  og_alt_ingr: string[]
}

const GIN_URL = "http://localhost:8081"

export default function Home() {
  // --- state ---
  const [ingredientInput, setIngredientInput] = useState("")
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResponse | null>(null)
  const [suggestion, setSuggestion] = useState<SuggestResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const [error, setError] = useState("")

  // --- handlers ---
  async function handleSubmit() {
    if (!ingredientInput.trim()) return

    setLoading(true)
    setError("")
    setAnalyzeResult(null)
    setSuggestion(null)

    try {
      // call /analyze first always
      const analyzeResp = await fetch(`${GIN_URL}/api/v1/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredient_list: ingredientInput })
      })

      if (!analyzeResp.ok) {
        setError("Failed to analyze ingredients. Please try again.")
        return
      }

      const analyzeData: AnalyzeResponse = await analyzeResp.json()
      setAnalyzeResult(analyzeData)

      // flagged ingredients -> call /suggest endpoint
      if (analyzeData.flagged_ingredients.length > 0) {
        setLoadingSuggest(true)
        
        const suggestResp = await fetch(`${GIN_URL}/api/v1/suggest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flagged_ingredients: analyzeData.flagged_ingredients
          })
        })

        if (suggestResp.ok) {
          const suggestData: SuggestResponse = await suggestResp.json()
          setSuggestion(suggestData)
        }
      }

    } catch (err) {
      setError("Something went wrong. Make sure the backend is running.")
    } finally {
      setLoading(false)
      setLoadingSuggest(false)
    }
  }

  // category colors
  function getCategoryColor(category: string): string {
    switch (category) {
      case "comedogenic": return "bg-red-100 text-red-700 border-red-300"
      case "fungal_acne": return "bg-orange-100 text-orange-700 border-orange-300"
      case "allergen": return "bg-yellow-100 text-yellow-700 border-yellow-300"
      default: return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  // renderingggg
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">SkinSafe</h1>
          <p className="text-gray-500">
            Paste your product ingredient list and we'll flag anything
            comedogenic, fungal acne triggering, or allergenic.
          </p>
        </div>

        {/* input section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ingredient List
          </label>
          <textarea
            className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="e.g. niacinamide, coconut oil, fragrance, glycerin..."
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-3 w-full py-2 px-4 bg-blue-600 text-white font-medium
                       rounded-lg hover:bg-blue-700 disabled:opacity-50
                       disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Analyzing..." : "Analyze Ingredients"}
          </button>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* results section */}
        {analyzeResult && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Analysis Results</h2>

            {/* summary */}
            <div className="flex gap-3 mb-5 flex-wrap">
              {Object.entries(analyzeResult.summary).map(([category, count]) => (
                <div
                  key={category}
                  className={`px-3 py-1 rounded-full text-sm font-medium border
                              ${count > 0 ? getCategoryColor(category) : "bg-green-100 text-green-700 border-green-300"}`}
                >
                  {category.replace("_", " ")}: {count}
                </div>
              ))}
            </div>

            {/* flagged ingredients */}
            {analyzeResult.flagged_ingredients.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-600 mb-2">⚠️ Flagged</h3>
                <div className="space-y-2">
                  {analyzeResult.flagged_ingredients.map((flag) => (
                    <div
                      key={flag.ingredient_name}
                      className="flex items-center justify-between p-3
                                 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <span className="text-sm font-medium text-gray-800 capitalize">
                        {flag.ingredient_name}
                      </span>
                      <div className="flex gap-1">
                        {flag.flagged_categories.map((cat) => (
                          <span
                            key={cat}
                            className={`text-xs px-2 py-0.5 rounded border ${getCategoryColor(cat)}`}
                          >
                            {cat.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* clean ingredients */}
            {analyzeResult.clean_ingredients.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">✅ Clean</h3>
                <div className="flex flex-wrap gap-2">
                  {analyzeResult.clean_ingredients.map((ingredient) => (
                    <span
                      key={ingredient}
                      className="text-sm px-3 py-1 bg-green-50 border border-green-200
                                 text-green-700 rounded-full capitalize"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* no flags */}
            {analyzeResult.flagged_ingredients.length === 0 && (
              <p className="text-green-600 font-medium">
                ✅ All ingredients look clean!
              </p>
            )}
          </div>
        )}

        {/* AI suggestion section */}
        {(loadingSuggest || suggestion) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              🤖 AI Recommendation
            </h2>

            {loadingSuggest && !suggestion && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent
                                rounded-full animate-spin"/>
                Generating recommendation...
              </div>
            )}

            {suggestion && (
              <>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {suggestion.suggestion}
                </p>
                {suggestion.og_alt_ingr.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      Based on: {suggestion.og_alt_ingr.join(", ")}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </main>
  )
}