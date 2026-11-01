import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveInterviewScore, roadmapRelevantInterviews } from '../services/interviewScore.js';

test('score selection prefers roadmap-related completed interviews', () => {
  const roadmap = { goal: 'Become a MERN Stack Developer', weeks: [{ topics: [{ name: 'React components' }, { name: 'Node.js APIs' }] }] };
  const interviews = [
    { role: 'Python Developer', status: 'completed', overall_score: 88, transcript: [{ question: 'Explain Python decorators' }] },
    { role: 'MERN Stack Developer', status: 'completed', overall_score: 76, transcript: [{ question: 'How does React state work?' }] },
  ];
  assert.deepEqual(roadmapRelevantInterviews(interviews, roadmap), [interviews[1]]);
});

test('score selection falls back to real interview records when roadmap has no matching stack evidence', () => {
  const interviews = [{ role: 'Python Developer', status: 'completed', overall_score: 88, transcript: [] }];
  assert.deepEqual(roadmapRelevantInterviews(interviews, { goal: 'Unspecified career' }), interviews);
});

test('uses stored overall scores or derives scores only from fully graded transcripts', () => {
  assert.equal(deriveInterviewScore({ status: 'completed', overall_score: 81, transcript: [] }), 81);
  assert.equal(deriveInterviewScore({ status: 'active', overall_score: null, transcript: [{ score: 80 }, { score: 90 }] }), 85);
  assert.equal(deriveInterviewScore({ status: 'active', overall_score: null, transcript: [{ score: 80 }, { question: 'Unanswered' }] }), null);
});
