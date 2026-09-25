export type CustomerAnalysis = {
  id: number;
  full_name: string;
  occupation_role: string;
  occupation_other: string | null;
  occupation_label: string;
  age: number;
  gender: string;
  gender_label: string;
  interview_purpose: string;
  summary: string;
  sentiment: number;
  sentiment_label: string;
  created_at: string;
  updated_at: string;
};

export type CustomerAnalysisOption = { value: string; label: string };
export type CustomerAnalysisSentimentOption = { value: number; label: string };

export type CustomerAnalysesResponse = {
  data: CustomerAnalysis[];
  options: { occupations: CustomerAnalysisOption[]; sentiments: CustomerAnalysisSentimentOption[] };
};
