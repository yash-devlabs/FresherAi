import { z } from "zod";
/** Shared zod schemas describing every agent's structured AI output. */
export const analysisSchema = z.object({
    atsScore: z.number().int().min(0).max(100).describe("ATS compatibility score 0-100"),
    matchPercent: z
        .number()
        .int()
        .min(0)
        .max(100)
        .describe("How well the resume matches the job description / target role, 0-100. If no job description is given, judge against typical requirements for the target role."),
    summary: z.string().describe("2-3 sentence overall assessment"),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    suggestions: z.array(z.string()).describe("Concrete, actionable improvements"),
    missingKeywords: z
        .array(z.string())
        .describe("Important keywords for the target role missing from the resume"),
    missingTechnicalSkills: z
        .array(z.string())
        .describe("Technical skills expected for the role but absent from the resume"),
    missingSoftSkills: z
        .array(z.string())
        .describe("Soft skills expected for the role but not evidenced in the resume"),
    skillGaps: z
        .array(z.object({
        skill: z.string(),
        importance: z.enum(["critical", "important", "nice-to-have"]),
        howToClose: z.string().describe("One concrete action to close this gap"),
    }))
        .describe("Prioritised skill gap analysis"),
    sectionReview: z
        .array(z.object({
        section: z
            .string()
            .describe("Resume section, e.g. Header, Summary, Skills, Experience, Projects, Education"),
        rating: z.enum(["strong", "adequate", "weak", "missing"]),
        notes: z.string().describe("What is wrong and exactly how to fix it"),
    }))
        .describe("Section-wise review of the resume"),
    recruiterPerspective: z
        .string()
        .describe("3-4 sentences written as a recruiter's blunt first impression after a 20-second skim"),
    finalVerdict: z
        .string()
        .describe("2-3 sentence hiring verdict with a clear shortlist / not-yet call and the reason"),
});
export const roadmapSchema = z.object({
    overview: z.string().describe("2-3 sentence summary of the overall learning plan"),
    weeks: z.array(z.object({
        week: z.number().int().min(1),
        title: z.string(),
        focus: z.string().describe("One line describing the weekly focus"),
        topics: z.array(z.object({ name: z.string(), done: z.boolean() })),
        resources: z.array(z.string()),
    })),
});
export const questionsSchema = z.object({
    questions: z.array(z.string().describe("A single interview question")),
});
export const gradeSchema = z.object({
    score: z.number().int().min(0).max(100).describe("Answer quality 0-100; align the score with the verdict and evidence in feedback"),
    verdict: z.enum(["Correct", "Partially Correct", "Incorrect", "Unanswered"]),
    feedback: z.string().describe("Concise explanation of what is correct, what is missing or wrong, and the essential concept. Do not include an ideal answer here."),
});
export const summarySchema = z.object({
    summary: z.string().describe("A 3-4 sentence overall assessment of the candidate"),
});
export const feedbackSchema = z.object({
    readinessScore: z.number().int().min(0).max(100),
    summary: z.string().describe("3-4 sentence overall placement-readiness assessment"),
    communicationNotes: z
        .string()
        .describe("Communication observations drawn ONLY from completed mock interview evidence. If there is no interview evidence, say so plainly and do not speculate."),
    technical: z.object({ score: z.number().int().min(0).max(100), notes: z.string() }),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    nextSteps: z.array(z.string()).describe("Concrete actions for the next two weeks"),
});
/** Structured resume produced by the Resume Builder. */
export const resumeBuildSchema = z.object({
    headline: z.string().describe("Short professional headline, e.g. 'Frontend Developer'"),
    summary: z.string().describe("3-4 sentence professional summary"),
    skills: z.array(z.string()).describe("Relevant technical and soft skills"),
    experience: z.array(z.object({
        title: z.string(),
        organization: z.string(),
        period: z.string(),
        bullets: z.array(z.string()).describe("Impact-focused achievement bullets"),
    })),
    projects: z.array(z.object({
        name: z.string(),
        description: z.string(),
        tech: z.array(z.string()),
    })),
    education: z.array(z.object({ degree: z.string(), institution: z.string(), period: z.string() })),
    certifications: z.array(z.string()),
});
