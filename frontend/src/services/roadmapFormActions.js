import { generateRoadmap as generateRoadmapFn, toggleRoadmapTopic as toggleRoadmapTopicFn, } from "@/services/roadmapApi";
/** Form-action adapter so the agent UI can keep using `useActionState`. */
export async function generateRoadmap(_prev, formData) {
    try {
        return await generateRoadmapFn({
            data: {
                goal: String(formData.get("goal") ?? ""),
                currentLevel: String(formData.get("currentLevel") ?? "beginner"),
                weeks: parseInt(String(formData.get("weeks") ?? "8"), 10) || 8,
            },
        });
    }
    catch (err) {
        console.error("[fresherai] generateRoadmap request failed", err);
        return { status: "error", message: err instanceof Error ? err.message : "Could not generate your roadmap. Please try again." };
    }
}
export async function toggleRoadmapTopic(roadmapId, weekIndex, topicIndex) {
    try {
        const result = await toggleRoadmapTopicFn({ data: { roadmapId, weekIndex, topicIndex } });
        if (result?.ok === false) {
            return { status: "error", message: result.message || "Could not update this roadmap topic." };
        }
        return { status: "success" };
    }
    catch (err) {
        console.error("[fresherai] toggleRoadmapTopic failed", err);
        return { status: "error", message: err instanceof Error ? err.message : "Could not save roadmap progress. Please try again." };
    }
}
