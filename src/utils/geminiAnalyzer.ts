import { ContrastiveSpeechPair, RubricEvaluationResult } from '../types/speech';

export interface GeminiAnalysisResponse {
  executiveSummary: string;
  temporalFlawValidation: {
    flawId: string;
    aiCritique: string;
    clinicalDrillRecommendation: string;
  }[];
  rhetoricalStrengths: string[];
  contrastiveSeparationScore: number;
}

export async function runGeminiSpeechAnalysis(
  pair: ContrastiveSpeechPair,
  rubricResult: RubricEvaluationResult,
  apiKey?: string
): Promise<GeminiAnalysisResponse> {
  // If no API key provided, return rich grounded deterministic analysis immediately
  if (!apiKey || apiKey.trim() === '') {
    return generateFallbackGeminiCritique(pair, rubricResult);
  }

  try {
    const prompt = `You are an elite speech pathologist and executive rhetoric coach evaluating a speech for Track C (Contrastive Speech Analytics).
Compare this candidate flawed speech against the ideal reference baseline:
DOMAIN: ${pair.domain}
IDEAL REFERENCE: "${pair.idealTranscript}"
CANDIDATE SPEECH: "${pair.flawedTranscript}"

GROUNDED TEMPORAL FLAWS DETECTED:
${pair.flaws.map(f => `- [${f.startSec}s - ${f.endSec}s] (${f.category}): "${f.flawedSnippet}". Evidence: ${f.acousticEvidence}`).join('\n')}

RUBRIC SCORES:
Composite Flawed: ${rubricResult.compositeFlawed}/100 (vs Ideal: ${rubricResult.compositeIdeal}/100)
- Pacing: ${rubricResult.dimensions.pacing.flawedScore}
- Fluency: ${rubricResult.dimensions.fluency.flawedScore}
- Prosody: ${rubricResult.dimensions.prosody.flawedScore}
- Clarity: ${rubricResult.dimensions.clarity.flawedScore}
- Alignment: ${rubricResult.dimensions.alignment.flawedScore}

Return a valid JSON object with:
{
  "executiveSummary": "string",
  "temporalFlawValidation": [
    { "flawId": "string", "aiCritique": "string", "clinicalDrillRecommendation": "string" }
  ],
  "rhetoricalStrengths": ["string"],
  "contrastiveSeparationScore": number
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.0,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!response.ok) {
      console.warn('Gemini API call failed, falling back to deterministic analysis');
      return generateFallbackGeminiCritique(pair, rubricResult);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      return JSON.parse(text) as GeminiAnalysisResponse;
    }
  } catch (err) {
    console.warn('Gemini API call error, falling back:', err);
  }

  return generateFallbackGeminiCritique(pair, rubricResult);
}

function generateFallbackGeminiCritique(
  pair: ContrastiveSpeechPair,
  rubricResult: RubricEvaluationResult
): GeminiAnalysisResponse {
  return {
    executiveSummary: `The candidate delivery for "${pair.title}" exhibits a -${Math.abs(rubricResult.compositeDelta)} point degradation compared to the Ideal Reference baseline. Primary performance bottlenecks stem from ${rubricResult.metrics.fillerCount} filler disfluency clusters and erratic pacing spikes reaching ${rubricResult.metrics.peakWPM} WPM. Dynamic Time Warping (DTW) measures a divergence of ${rubricResult.metrics.dtwDistance} from target prosodic contour.`,
    temporalFlawValidation: pair.flaws.map(flaw => ({
      flawId: flaw.id,
      aiCritique: `At [${flaw.startSec}s - ${flaw.endSec}s], the speaker suffered a ${flaw.category.replace(/_/g, ' ')}. ${flaw.acousticEvidence}`,
      clinicalDrillRecommendation: flaw.actionableFeedback
    })),
    rhetoricalStrengths: [
      'Core thematic argument remains identifiable despite disfluencies.',
      `Maintains stable projection (-${Math.abs(pair.telemetry[0]?.flawedEnergyDb || 20)} dB) across uninterrupted clauses.`,
      'Demonstrates high recovery potential using targeted 2-beat pause drills.'
    ],
    contrastiveSeparationScore: parseFloat(Math.abs(rubricResult.compositeDelta).toFixed(1))
  };
}
