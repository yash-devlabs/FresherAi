export function deriveInterviewScore(interview) {
  if (interview?.status === 'completed' && typeof interview.overall_score === 'number') return interview.overall_score;
  const transcript = interview?.transcript;
  if (!Array.isArray(transcript) || transcript.length === 0 || transcript.some((turn) => typeof turn.score !== 'number')) return null;
  return Math.round(transcript.reduce((total, turn) => total + turn.score, 0) / transcript.length);
}

export function roadmapRelevantInterviews(interviews, roadmap) {
  const roadmapText = [roadmap?.goal, ...(roadmap?.weeks || []).flatMap((week) => [week.title, week.focus, ...(week.topics || []).map((topic) => topic.name)])].filter(Boolean).join(' ').toLowerCase();
  const terms = [...new Set(roadmapText.match(/[a-z][a-z0-9+#.]{2,}/g) || [])].filter((term) => !['the','and','for','with','from','into','your','learn','learning','roadmap','week','developer','engineer','software','application','programming','internship','intern','fresher','build','become','career','stack'].includes(term));
  const scored = interviews.map((interview) => ({ ...interview, overall_score: deriveInterviewScore(interview) })).filter((interview) => typeof interview.overall_score === 'number');
  if (!terms.length) return scored;
  const matches = scored.filter((interview) => {
    const evidence = `${interview.role || ''} ${(interview.transcript || []).map((turn) => turn.question || '').join(' ')}`.toLowerCase();
    return terms.some((term) => evidence.includes(term));
  });
  return matches.length ? matches : scored;
}
