export default async () => {
  return {
    "experimental.chat.system.transform": async (_input, output) => {
      output.system.push(
        "PROJECT: AI Agent Platform (planning/specification phase). " +
          "Always consult the 'Master Project Specification — AI Agent Platform.md' before making any architecture, technology-stack, or feature decisions. " +
          "Hard rules: do NOT redesign the locked architecture, do NOT replace the selected technology stack, do NOT add unspecified features, and do NOT bypass defined abstraction layers. " +
          "If a requirement is genuinely ambiguous or contradictory, STOP and report it rather than guessing."
      )
    },
  }
}
