# **Technical Challenge**

At Ledn, we believe our product and engineering teams should be a super-incubator for AI. However, we recognize that adopting AI comes with friction. Strategically, we believe all AI friction boils down to two missing components: **the interface doesn't exist, or the data doesn't exist (or both).**

Our goal is to build an "AI of Things"—making AI transparent and seamlessly integrated into our work environment so that it works behind the scenes without people even noticing it.

## **The Challenge**

We are giving you **7 days** to build something that blows us away. This is a deadline, not an expectation of effort—we respect your time and don't expect you to spend all 7 days on this. Focus on quality over quantity.

Your challenge is to build a full-stack prototype that eliminates friction by creating a missing interface or bridging a missing data connection using AI. We want to see how you think about architecture, data flow, and user experience when given an open-ended problem.

We have outlined a few common industry friction points for you. You may choose **ONE** of the following hypothetical scenarios to solve, or invent your own workflow that strictly aligns with our philosophy.

See [FRICTIONS.md](./FRICTIONS.md) for a complete list.

## **Technical Requirements**

As a Senior Fullstack Engineer, you have full control over the tech stack you choose to solve this problem.

**For context, our internal stack includes:** Node, TypeScript/JavaScript, Python, React, Chakra UI, NestJS, MongoDB, Redis, NATS Core/JetStream, AWS (S3, SNS, SQS, Lambda, DynamoDB, etc.), Terraform, OpenTelemetry, Sentry, and GitHub Actions.

While you are free to use whatever tools you feel best solve the challenge, demonstrating proficiency with our core ecosystem is a great way to stand out.

Regardless of the stack, we expect to see:

1. **Fullstack Implementation:**
   * A backend system (e.g. API, database/mock-data layer, LLM orchestration).
   * A frontend interface (e.g. Web UI, Slack bot UI, or CLI/MCP tool) that proves you can build the missing interface to reduce friction.
2. **AI Integration:**
   * Meaningful use of an LLM (OpenAI, Anthropic, etc.) to handle unstructured data, reasoning, or text generation.
3. **The "Data Producer" Mindset:**
   * Show us how your system structures data. AI needs good data to work; demonstrate how your architecture ensures the data is reliable and accessible.
4. **Production-Ready Quality:**
   * Show us your standard for shipping to production. We intentionally aren't providing a checklist because we want to see your judgment on how to balance speed, reliability, and code quality.

## **Deliverables**

1. **Source Code:** Please create a **private** GitHub repository for your project. Keeping the repository private helps us ensure the integrity of this challenge for future candidates. When you are ready to submit, invite the GitHub user @ledn-reviewer as a collaborator. *(Please do not send zip files or open public repositories).*
2. **README.md:** Include clear instructions in your repository on how to run your application locally (make sure it runs). Please also include a brief explanation of your architecture and technical decisions. Don't forget to include the friction you are solving for and how your solution brilliantly solves the problem.
3. **Loom Video:** A 3-5 minute video demonstrating your solution, explaining the problem you chose, your architectural decisions, and how you addressed the "interface and data" friction.

## **Evaluation Criteria**

We will evaluate your submission based on:

* **Systems Thinking:** How well did you connect the data and the interface? Did you choose the right form factor for the friction described?
* **AI Pragmatism:** Did you use AI effectively to solve the problem, or is it just a gimmick? Did you handle edge cases?
* **Conceptual Understanding & Trade-offs:** How well do you understand the concepts and tools you are using? Are you actively aware of the architectural trade-offs, or are you just "asleep at the wheel" relying on defaults?
* **Execution & Completeness:** Does the prototype work end-to-end?
* **Code Quality:** Is the codebase structured like a senior engineer wrote it?
