export interface ReportEntry {
  [userID: string]: string;
}

export interface SimilarityReports {
  similar_activities: ReportEntry;
  similar_cities: ReportEntry;
  similar_countries: ReportEntry;
  similar_feelings: ReportEntry;
  similar_foods: ReportEntry;
}
