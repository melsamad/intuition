# Intuition MVP — Teach Jonathan

**The school of 2036.**

> You can copy an answer. You can't copy understanding.

[**Try Intuition**](https://intuition-edu.lovable.app)

Intuition is an AI-powered educational platform built around a simple idea: **the best way to learn something is to teach it to someone else.**

As AI becomes increasingly capable of answering questions and completing homework, traditional assessments become less effective at measuring what students truly understand. Intuition takes a different approach: instead of asking students to learn from an AI, it asks them to teach one.

Meet Jonathan, an AI student who begins with common misconceptions. Students must explain concepts in their own words, provide reasoning, and use examples to help him understand. Jonathan then takes a test based on what the student taught him, turning the student's ability to teach into a meaningful measure of understanding.

Intuition brings this learning experience together with teacher-controlled assignments, virtual exams, student progress tracking, and classroom-wide insights.

## The idea

**What if AI didn't replace the learning process, but made it more human?**

Intuition is designed to make students active participants in their own learning. Rather than rewarding memorization or the ability to find the right answer, it encourages students to reason, communicate, and explain why something is true.

The platform is built around three principles:

- **Understanding over memorization:** Students must explain concepts, not simply state answers.
- **Human judgment over automated teaching:** AI assists teachers, while teachers remain in control of learning content and assignments.
- **Learning through connection:** Teaching Jonathan encourages students to articulate their thoughts, and daily learning can extend into conversations with family.

## Key features

### 1. Teach Jonathan

Every learning session starts with Jonathan holding a set of misconceptions about a topic.

Students interact with him through voice or text, using a journal to draw diagrams, illustrate examples, and explain their reasoning. Jonathan challenges unsupported answers and requires a meaningful explanation before accepting that a misconception has been corrected.

For example, when Jonathan believes that one-eighth is greater than one-quarter because eight is greater than four, the student must explain why this is incorrect. Drawing two equally sized pizzas divided into four and eight slices can help Jonathan understand the concept.

Each successful explanation becomes evidence of what the student taught him.

### 2. Reasoning-based assessment

After the teaching session, Jonathan takes a rule-based quiz containing questions he has not seen before.

His answers reflect the concepts the student successfully taught him. If a misconception remains unresolved, Jonathan can still get the corresponding question wrong.

The student's result is therefore based on what Jonathan learned, rather than simply what the student memorized.

The platform also validates explanations using evidence from the student's actual words, helping distinguish a genuine explanation from an unsupported answer.

### 3. Teacher-controlled assignments

Teachers can create and distribute assignments by selecting a topic, reviewing its associated misconceptions, choosing a session mode, and setting a time limit.

When introducing a new topic, teachers can use AI to draft potential misconceptions. **AI-generated content requires teacher review and approval before it is published.**

Teachers retain control over the material students encounter and the assignments they receive.

### 4. Virtual exams

Intuition also supports conventional assessments for situations where students need to demonstrate their own knowledge independently.

Teachers can upload a PDF, configure the exam's title, subject, question count, time limit, attempt limit, and deadline, then assign it to students.

During a virtual exam, students receive no AI assistance. They can explain their answers aloud and receive feedback based on their responses.

### 5. Student dashboard and daily learning

The student dashboard brings learning activities into one place, including:

- Daily learning streaks that encourage consistency.
- A calendar for taught days and upcoming deadlines.
- Homework and upcoming tests.
- A dedicated space for assigned virtual exams.
- Access to Jonathan's previous exams.
- A daily reflection prompt designed to encourage conversations with family.

The goal is to make learning a regular habit that extends beyond the classroom and the screen.

### 6. Classroom understanding map

Teachers can view a classroom-wide overview of student progress across different misconceptions.

Rather than focusing exclusively on grades, the dashboard highlights which concepts students have successfully taught Jonathan and where misunderstandings remain.

These insights can help teachers identify shared learning gaps and decide which concepts deserve more attention in upcoming lessons.

## How it works

The core learning loop is simple:

1. **Introduce:** Jonathan presents a misconception about the assigned topic.
2. **Explain:** The student responds through voice or text, using reasoning and examples.
3. **Validate:** The system evaluates the explanation and verifies whether it addresses the misconception.
4. **Learn:** Jonathan updates his understanding when the explanation meets the required criteria.
5. **Assess:** Jonathan completes a rule-based quiz independently.
6. **Reflect:** The student receives a result based on what Jonathan learned, while teachers gain insight into remaining misconceptions.

## Technology

Intuition combines a modern web application with AI-assisted learning and deterministic assessment logic.

- **Frontend:** React 19, TanStack Start, Vite, and Tailwind CSS v4.
- **UI components:** Radix UI and supporting React libraries.
- **AI:** Gemini through the Lovable AI Gateway.
- **Backend:** TanStack Start server functions for learning sessions, AI interactions, assessments, assignments, and teacher dashboards.
- **Database:** Lovable Cloud database, with Drizzle ORM and migrations.
- **Voice interaction:** Browser MediaRecorder for voice input and speech synthesis for Jonathan's spoken responses.
- **Testing:** Vitest.

### A key design decision: AI with explicit rules

Intuition does not leave the entire learning and grading process to an unrestricted AI response.

The AI helps evaluate student explanations, but application-level rules govern whether a misconception can be marked as corrected, how assessment questions are evaluated, and how hints affect the result.

This separation makes the learning loop more structured and helps align assessment with the platform's central goal: measuring demonstrated understanding rather than merely generating plausible answers.

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) installed.
- Access to the project's configured Lovable Cloud environment and database.
- The necessary AI Gateway configuration for running AI-powered features.

### Installation

Clone the repository and install its dependencies:

```bash
git clone https://github.com/melsamad/intuition.git
cd intuition
bun install
```

Start the development server:

```bash
bun run dev
```

Run the test suite:

```bash
bunx vitest run
```

Create a production build:

```bash
bun run build
```

**Configuration note:** The application relies on its configured Lovable Cloud environment and server-side AI Gateway. Ensure the required database and environment configuration is available before expecting all features to work locally. The hosted demo may have configuration that is not included in this repository.

## Demo data and privacy

The current demo includes synthetic student records to illustrate classroom workflows. These records are demonstration data, not real student performance.

The current implementation does not provide production authentication: switching between teacher and student views is not an authentication or authorization mechanism.

Before deployment in a real school environment, the platform requires authentication, class-level access controls, appropriate student-data privacy protections, and production-ready security rules.

Voice recordings are transcribed and evaluated during the interaction and are not stored by the current voice-input workflow.

## Project status

Intuition is a working prototype demonstrating an alternative approach to AI-assisted education.The core experience includes teaching Jonathan, reasoning-based assessment, teacher-managed assignments, virtual exams, student progress tracking, and classroom misconception insights. The project is intended to explore how AI can strengthen students' reasoning and communication rather than simply automate their answers.

## Vision

In a world where AI can increasingly answer almost any question, education must continue to teach students how to think, explain, listen, and connect with others in order to maintain our humanity. Intuition explores a future where AI becomes a partner in that process, helping students develop understanding by taking responsibility for someone else's.

**You can copy an answer. You can't copy understanding. And you can't copy being human.**

---

*Built for the school of 2036.*
