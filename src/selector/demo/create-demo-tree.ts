import { dsl } from "../dsl";

export function createDemoTree() {
  return dsl.group(
    {
      renderLabel: "Selector demo",
      renderDescription:
        "A minimal open-source runtime cut with generic DSL + pipeline behavior.",
    },
    [
      dsl.node(
        "Awareness",
        {
          renderLabel: "Awareness",
          renderDescription: "Top-funnel choices with simple static cards.",
        },
        [
          dsl.node("Reach", {
            renderLabel: "Reach",
            renderDescription:
              "Maximize broad delivery across the whole audience.",
          }),
          dsl.node("Video Views", {
            renderLabel: "Video Views",
            renderDescription: "Bias toward watch intent and video completion.",
          }),
        ],
      ),
      dsl.node(
        "Consideration",
        {
          renderLabel: "Consideration",
          renderDescription:
            "A container that demonstrates mutex ordering inside one branch.",
        },
        [
          dsl.mutexGroup({}, [
            dsl.optionMutex("Traffic", {
              renderLabel: "Traffic",
              renderDescription:
                "Available by default and suppresses lower-priority siblings in the same mutex group.",
            }),
            dsl.optionMutex("App Promotion", {
              renderLabel: "App Promotion",
              renderDescription:
                "Disabled while Traffic remains displayable in the same mutex group.",
            }),
          ]),
        ],
      ),
      dsl.node(
        "Conversion",
        {
          renderLabel: "Conversion",
          renderDescription:
            "A panel-style branch that only opens when the parent branch is active.",
        },
        [
          dsl.optionPanel("Sales", {
            renderLabel: "Sales",
            renderDescription:
              "Uses panel hiding semantics to stay aligned with parent selection state.",
          }),
          dsl.node("Leads", {
            renderLabel: "Leads",
            renderDescription:
              "Another plain leaf to demonstrate generic option rendering.",
          }),
        ],
      ),
    ],
  );
}
