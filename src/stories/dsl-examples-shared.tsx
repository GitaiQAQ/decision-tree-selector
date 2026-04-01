import {
  SelectorProvider,
  dsl,
  useSelectable,
  useSelectorDebug,
  type RuntimeNode,
  type SelectorSymbol,
} from "../index";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JsonDebugCard, StoryIntroCard, StorySceneGrid, StoryTreeCard } from "./storybook-utils";
import { applyTreeVisuals } from "./tree-visuals";

type DslExample = {
  helper: string;
  category: "atomic" | "composition";
  title: string;
  summary: string;
  concreteCase: string;
  whyItMatters: string;
  tree: RuntimeNode;
  snippet: string;
  defaultValue?: SelectorSymbol;
  autoSelectDefault?: boolean;
};

function withSummaryDslExample(example: DslExample): DslExample {
  return {
    ...example,
    tree: applyTreeVisuals(example.tree),
  };
}

export const atomicExamples: DslExample[] = [
  {
    helper: "dsl.group",
    category: "atomic",
    title: "Campaign funnel root",
    summary: "Use a non-selectable root to organize multiple top-level branches.",
    concreteCase: "A campaign builder with Awareness, Consideration, and Conversion branches.",
    whyItMatters:
      "The group itself never becomes a selected symbol, but it gives the tree a structural root.",
    tree: dsl.group(
      { renderLabel: "Campaign objective" },
      [
        dsl.node("Awareness", {
          renderLabel: "Awareness",
          renderDescription: "Top-of-funnel objective.",
        }),
        dsl.node("Consideration", {
          renderLabel: "Consideration",
          renderDescription: "Mid-funnel engagement objective.",
        }),
        dsl.node("Conversion", {
          renderLabel: "Conversion",
          renderDescription: "Bottom-funnel outcome objective.",
        }),
      ],
    ),
    snippet: `const tree = dsl.group({ renderLabel: "Campaign objective" }, [
  dsl.node("Awareness"),
  dsl.node("Consideration"),
  dsl.node("Conversion"),
]);`,
  },
  {
    helper: "dsl.node",
    category: "atomic",
    title: "Standard selectable branch",
    summary: "Create a normal selectable node with label and description.",
    concreteCase: "A delivery settings branch where users choose Standard vs Express handling.",
    whyItMatters:
      "This is the default building block for anything that should appear in the selected path.",
    tree: dsl.group({}, [
      dsl.node(
        "Delivery speed",
        {
          renderLabel: "Delivery speed",
          renderDescription: "Choose how fast the order should arrive.",
        },
        [
          dsl.node("Standard", {
            renderLabel: "Standard",
            renderDescription: "3–5 business days.",
          }),
          dsl.node("Express", {
            renderLabel: "Express",
            renderDescription: "Next business day.",
          }),
        ],
      ),
    ]),
    snippet: `dsl.node("Delivery speed", {
  renderLabel: "Delivery speed",
  renderDescription: "Choose how fast the order should arrive.",
}, [
  dsl.node("Standard"),
  dsl.node("Express"),
]);`,
  },
  {
    helper: "dsl.mutexGroup",
    category: "atomic",
    title: "Exclusive storage options",
    summary: "Attach mutex behavior to a sibling set so only one branch stays active.",
    concreteCase: "A phone purchase flow where 128GB and 256GB are mutually exclusive.",
    whyItMatters:
      "The group provides the exclusivity rule; the options provide the selectable values.",
    tree: dsl.group({}, [
      dsl.node("Phone storage", { renderLabel: "Phone storage" }, [
        dsl.mutexGroup({}, [
          dsl.optionMutex("128GB", {
            renderLabel: "128GB",
            renderDescription: "Base storage tier.",
          }),
          dsl.optionMutex("256GB", {
            renderLabel: "256GB",
            renderDescription: "Upgrade storage tier.",
          }),
        ]),
      ]),
    ]),
    snippet: `dsl.node("Phone storage", {}, [
  dsl.mutexGroup({}, [
    dsl.optionMutex("128GB"),
    dsl.optionMutex("256GB"),
  ]),
]);`,
  },
  {
    helper: "dsl.optionMutex",
    category: "atomic",
    title: "Named option inside a mutex set",
    summary: "Create the concrete exclusive option that users will click.",
    concreteCase: "A billing model picker with Monthly and Annual plans.",
    whyItMatters:
      "optionMutex is the selectable leaf/branch used under mutexGroup.",
    tree: dsl.group({}, [
      dsl.node("Billing cadence", { renderLabel: "Billing cadence" }, [
        dsl.mutexGroup({}, [
          dsl.optionMutex("Monthly", {
            renderLabel: "Monthly",
            renderDescription: "$39 billed monthly.",
          }),
          dsl.optionMutex("Annual", {
            renderLabel: "Annual",
            renderDescription: "$29/mo billed annually.",
          }),
        ]),
      ]),
    ]),
    snippet: `dsl.mutexGroup({}, [
  dsl.optionMutex("Monthly", {
    renderDescription: "$39 billed monthly.",
  }),
  dsl.optionMutex("Annual", {
    renderDescription: "$29/mo billed annually.",
  }),
]);`,
  },
  {
    helper: "dsl.optionPanel",
    category: "atomic",
    title: "Conditional advanced panel",
    summary: "Render a branch only while the current selection stays under the same parent scope.",
    concreteCase: "A permissions flow that reveals Advanced Scopes only while Billing is active.",
    whyItMatters:
      "This is useful for contextual follow-up panels that should disappear when users leave the branch.",
    tree: dsl.group({}, [
      dsl.node("Billing", { renderLabel: "Billing" }, [
        dsl.node("Custom Access", {
          renderLabel: "Custom Access",
          renderDescription: "Granular scopes instead of full access.",
        }),
        dsl.optionPanel(
          "Advanced Scopes",
          {
            renderLabel: "Advanced Scopes",
            renderDescription: "Shown while the current path remains under Billing.",
          },
          [
            dsl.node("Export invoices", {
              renderLabel: "Export invoices",
            }),
            dsl.node("Edit payment methods", {
              renderLabel: "Edit payment methods",
            }),
          ],
        ),
      ]),
    ]),
    defaultValue: "Export invoices",
    snippet: `dsl.node("Billing", {}, [
  dsl.node("Custom Access"),
  dsl.optionPanel("Advanced Scopes", {}, [
    dsl.node("Export invoices"),
    dsl.node("Edit payment methods"),
  ]),
]);`,
  },
  {
    helper: "dsl.virtualNode",
    category: "atomic",
    title: "Invisible structural wrapper",
    summary: "Insert runtime structure without adding another selectable level in the rendered tree.",
    concreteCase: "An audience branch with an internal wrapper around segment logic.",
    whyItMatters:
      "The runtime keeps the wrapper node, but the UI depth stays flatter.",
    tree: dsl.group({}, [
      dsl.node("Audience", { renderLabel: "Audience" }, [
        dsl.virtualNode(
          {
            renderLabel: "Segment policy wrapper",
          },
          [
            dsl.node("Prospecting", {
              renderLabel: "Prospecting",
              renderDescription: "New users only.",
            }),
            dsl.node("Retargeting", {
              renderLabel: "Retargeting",
              renderDescription: "Users who already engaged.",
            }),
          ],
        ),
      ]),
    ]),
    snippet: `dsl.node("Audience", {}, [
  dsl.virtualNode({}, [
    dsl.node("Prospecting"),
    dsl.node("Retargeting"),
  ]),
]);`,
  },
  {
    helper: "dsl.displayNode",
    category: "atomic",
    title: "Virtual alias wrapper",
    summary: "Create a virtual wrapper that also carries a displayAs alias in runtime snapshots.",
    concreteCase: "A segment branch that should be treated as a displayed market segment without adding UI depth.",
    whyItMatters:
      "Useful when downstream tooling needs an alias even though the node stays virtual in the tree UI.",
    tree: dsl.group({}, [
      dsl.node("Segments", { renderLabel: "Segments" }, [
        dsl.displayNode(
          "High Intent Segment",
          {
            renderLabel: "High Intent wrapper",
          },
          [
            dsl.node("Cart Abandoners", {
              renderLabel: "Cart Abandoners",
            }),
            dsl.node("Product Viewers", {
              renderLabel: "Product Viewers",
            }),
          ],
        ),
      ]),
    ]),
    snippet: `dsl.node("Segments", {}, [
  dsl.displayNode("High Intent Segment", {}, [
    dsl.node("Cart Abandoners"),
    dsl.node("Product Viewers"),
  ]),
]);`,
  },
  {
    helper: "dsl.switchableGroup",
    category: "atomic",
    title: "Switchable delivery modes",
    summary: "Define a sibling set that can switch by target or by next-option intent.",
    concreteCase: "A checkout flow with Express and Standard delivery branches.",
    whyItMatters:
      "switchableGroup marks the option set so useSwitchable can resolve candidates later.",
    tree: dsl.group({}, [
      dsl.node("Delivery Mode", { renderLabel: "Delivery Mode" }, [
        dsl.switchableGroup({}, [
          dsl.switchableOption(
            "Express",
            {
              default: true,
              renderLabel: "Express",
              renderDescription: "Fastest checkout path.",
            },
            [dsl.node("Locker pickup", { renderLabel: "Locker pickup" })],
          ),
          dsl.switchableOption(
            "Standard",
            {
              renderLabel: "Standard",
              renderDescription: "Cheaper default shipping.",
            },
            [dsl.node("Door delivery", { renderLabel: "Door delivery" })],
          ),
        ]),
      ]),
    ]),
    snippet: `dsl.node("Delivery Mode", {}, [
  dsl.switchableGroup({}, [
    dsl.switchableOption("Express", { default: true }),
    dsl.switchableOption("Standard"),
  ]),
]);`,
  },
  {
    helper: "dsl.switchableOption",
    category: "atomic",
    title: "Concrete switch target",
    summary: "Create the individual option that participates in switchable resolution.",
    concreteCase: "A subscription chooser with Starter, Growth, and Enterprise plans.",
    whyItMatters:
      "This is the selectable target used by switchFromNode / switchFromCurrentNode.",
    tree: dsl.group({}, [
      dsl.node("Plan", { renderLabel: "Plan" }, [
        dsl.switchableGroup({}, [
          dsl.switchableOption("Starter", {
            renderLabel: "Starter",
            renderDescription: "Single-seat plan.",
          }),
          dsl.switchableOption(
            "Growth",
            {
              default: true,
              renderLabel: "Growth",
              renderDescription: "Best fit for scaling teams.",
            },
            [dsl.node("Priority onboarding", { renderLabel: "Priority onboarding" })],
          ),
          dsl.switchableOption("Enterprise", {
            renderLabel: "Enterprise",
            renderDescription: "Advanced controls and support.",
          }),
        ]),
      ]),
    ]),
    snippet: `dsl.switchableGroup({}, [
  dsl.switchableOption("Starter"),
  dsl.switchableOption("Growth", { default: true }, [
    dsl.node("Priority onboarding"),
  ]),
  dsl.switchableOption("Enterprise"),
]);`,
  },
  {
    helper: "dsl.defaultPolicy",
    category: "atomic",
    title: "Hidden default policy branch",
    summary: "Insert a policy node that stays hidden in the UI but remains visible in runtime debug output.",
    concreteCase: "A region-routing tree with a hidden policy branch alongside visible market choices.",
    whyItMatters:
      "Policy nodes keep decision logic explicit without forcing extra visible tree rows.",
    tree: dsl.group({}, [
      dsl.defaultPolicy("RegionPolicy", {
        renderLabel: "Region policy",
        defaultOn: () => "EMEA",
      }),
      dsl.node(
        "Region",
        {
          renderLabel: "Region",
          renderDescription: "Visible region choices.",
        },
        [
          dsl.node("APAC", { renderLabel: "APAC" }),
          dsl.node("EMEA", { renderLabel: "EMEA" }),
        ],
      ),
    ]),
    snippet: `dsl.group({}, [
  dsl.defaultPolicy("RegionPolicy", {
    defaultOn: () => "EMEA",
  }),
  dsl.node("Region", {}, [
    dsl.node("APAC"),
    dsl.node("EMEA"),
  ]),
]);`,
  },
  {
    helper: "dsl.predicateDefaultOn",
    category: "atomic",
    title: "Predicate-driven default branch",
    summary: "Choose the initial child based on a predicate instead of a fixed symbol.",
    concreteCase: "A delivery speed branch that defaults to Express when premium is enabled.",
    whyItMatters:
      "It keeps conditional default behavior declarative and colocated with the tree definition.",
    tree: dsl.group({}, [
      dsl.node(
        "Delivery speed",
        {
          renderLabel: "Delivery speed",
          defaultOn: dsl.predicateDefaultOn(async () => true, "Express", "Standard"),
        },
        [
          dsl.node("Standard", { renderLabel: "Standard" }),
          dsl.node("Express", { renderLabel: "Express" }),
        ],
      ),
    ]),
    snippet: `dsl.node("Delivery speed", {
  defaultOn: dsl.predicateDefaultOn(
    async () => true,
    "Express",
    "Standard",
  ),
}, [
  dsl.node("Standard"),
  dsl.node("Express"),
]);`,
  },
  {
    helper: "dsl.marksWhenDefaultOn",
    category: "atomic",
    title: "Mark-priority default branch",
    summary: "Resolve defaults by preferred marks before falling back to a fixed symbol.",
    concreteCase: "A channel picker that prefers the mobile-optimized branch when available.",
    whyItMatters:
      "This is useful when priority should follow policy marks instead of hard-coded sibling order.",
    tree: dsl.group({}, [
      dsl.node(
        "Channel",
        {
          renderLabel: "Channel",
          defaultOn: dsl.marksWhenDefaultOn(async () => true, ["preferred.mobile"], "Web"),
        },
        [
          dsl.node("Mobile", {
            renderLabel: "Mobile",
            marks: ["preferred.mobile"],
          }),
          dsl.node("Web", { renderLabel: "Web" }),
        ],
      ),
    ]),
    snippet: `dsl.node("Channel", {
  defaultOn: dsl.marksWhenDefaultOn(
    async () => true,
    ["preferred.mobile"],
    "Web",
  ),
}, [
  dsl.node("Mobile", { marks: ["preferred.mobile"] }),
  dsl.node("Web"),
]);`,
  },
];

export const compositionExamples: DslExample[] = [
  {
    helper: "group + node",
    category: "composition",
    title: "Catalog tree baseline",
    summary: "A concrete retail tree built only from standard structure and selectable nodes.",
    concreteCase: "Department → category → product family.",
    whyItMatters:
      "This is the baseline pattern before introducing plugin or policy helpers.",
    tree: dsl.group({}, [
      dsl.node("Electronics", { renderLabel: "Electronics" }, [
        dsl.node("Phones", { renderLabel: "Phones" }),
        dsl.node("Laptops", { renderLabel: "Laptops" }),
      ]),
      dsl.node("Home", { renderLabel: "Home" }, [
        dsl.node("Kitchen", { renderLabel: "Kitchen" }),
      ]),
    ]),
    snippet: `const tree = dsl.group({}, [
  dsl.node("Electronics", {}, [
    dsl.node("Phones"),
    dsl.node("Laptops"),
  ]),
  dsl.node("Home", {}, [
    dsl.node("Kitchen"),
  ]),
]);`,
  },
  {
    helper: "mutexGroup + optionMutex + optionPanel",
    category: "composition",
    title: "Permission strategy with follow-up panel",
    summary: "Exclusive strategy choice plus a contextual advanced scopes panel.",
    concreteCase: "Billing access setup where custom access unlocks granular permissions.",
    whyItMatters:
      "A common real-world pattern: choose one mode first, then render scoped follow-up options.",
    tree: dsl.group({}, [
      dsl.node("Billing", { renderLabel: "Billing" }, [
        dsl.mutexGroup({}, [
          dsl.optionMutex("Full Access", {
            renderLabel: "Full Access",
            renderDescription: "Single role with all billing permissions.",
          }),
          dsl.optionMutex("Custom Access", {
            renderLabel: "Custom Access",
            renderDescription: "Granular scopes for the finance team.",
          }),
        ]),
        dsl.optionPanel("Advanced Scopes", { renderLabel: "Advanced Scopes" }, [
          dsl.node("Refund orders", { renderLabel: "Refund orders" }),
          dsl.node("Export ledger", { renderLabel: "Export ledger" }),
        ]),
      ]),
    ]),
    defaultValue: "Export ledger",
    snippet: `dsl.node("Billing", {}, [
  dsl.mutexGroup({}, [
    dsl.optionMutex("Full Access"),
    dsl.optionMutex("Custom Access"),
  ]),
  dsl.optionPanel("Advanced Scopes", {}, [
    dsl.node("Refund orders"),
    dsl.node("Export ledger"),
  ]),
]);`,
  },
  {
    helper: "switchableGroup + switchableOption",
    category: "composition",
    title: "Switchable delivery branch",
    summary: "A branch set that can later be switched from deep descendants or current context.",
    concreteCase: "Express vs Standard delivery paths.",
    whyItMatters:
      "Use this when sibling branch changes should be intent-driven, not just click-order driven.",
    tree: dsl.group({}, [
      dsl.node("Delivery Mode", { renderLabel: "Delivery Mode" }, [
        dsl.switchableGroup({}, [
          dsl.switchableOption("Express", { default: true, renderLabel: "Express" }, [
            dsl.node("Express deep leaf", { renderLabel: "Express deep leaf" }),
          ]),
          dsl.switchableOption("Standard", { renderLabel: "Standard" }, [
            dsl.node("Standard deep leaf", { renderLabel: "Standard deep leaf" }),
          ]),
        ]),
      ]),
    ]),
    snippet: `dsl.node("Delivery Mode", {}, [
  dsl.switchableGroup({}, [
    dsl.switchableOption("Express", { default: true }, [
      dsl.node("Express deep leaf"),
    ]),
    dsl.switchableOption("Standard", {}, [
      dsl.node("Standard deep leaf"),
    ]),
  ]),
]);`,
  },
  {
    helper: "switchableOption + mutexGroup",
    category: "composition",
    title: "Switch first, then choose exclusive sub-option",
    summary: "One switchable option can host its own internal mutex decision.",
    concreteCase: "Express delivery contains Locker vs Door fulfillment choices.",
    whyItMatters:
      "This models multi-step branching cleanly without flattening every state into one sibling list.",
    tree: dsl.group({}, [
      dsl.node("Delivery Mode", { renderLabel: "Delivery Mode" }, [
        dsl.switchableGroup({}, [
          dsl.switchableOption("Express", { default: true, renderLabel: "Express" }, [
            dsl.mutexGroup({}, [
              dsl.optionMutex("Locker", { renderLabel: "Locker" }),
              dsl.optionMutex("Door", { renderLabel: "Door" }),
            ]),
          ]),
          dsl.switchableOption("Standard", { renderLabel: "Standard" }),
        ]),
      ]),
    ]),
    snippet: `dsl.node("Delivery Mode", {}, [
  dsl.switchableGroup({}, [
    dsl.switchableOption("Express", { default: true }, [
      dsl.mutexGroup({}, [
        dsl.optionMutex("Locker"),
        dsl.optionMutex("Door"),
      ]),
    ]),
    dsl.switchableOption("Standard"),
  ]),
]);`,
  },
  {
    helper: "virtualNode + displayNode",
    category: "composition",
    title: "Invisible wrapper plus display alias",
    summary: "Keep instrumentation structure in runtime while preserving a flat visible tree.",
    concreteCase: "A market-segment branch with an internal analytics wrapper and aliased display node.",
    whyItMatters:
      "This lets you keep runtime metadata without forcing extra UI indentation.",
    tree: dsl.group({}, [
      dsl.virtualNode({}, [
        dsl.displayNode("High Intent Segment", {}, [
          dsl.node("Cart Abandoners", { renderLabel: "Cart Abandoners" }),
          dsl.node("Product Viewers", { renderLabel: "Product Viewers" }),
        ]),
      ]),
    ]),
    snippet: `dsl.group({}, [
  dsl.virtualNode({}, [
    dsl.displayNode("High Intent Segment", {}, [
      dsl.node("Cart Abandoners"),
      dsl.node("Product Viewers"),
    ]),
  ]),
]);`,
  },
  {
    helper: "defaultPolicy + predicateDefaultOn + marksWhenDefaultOn",
    category: "composition",
    title: "Hidden policy drives concrete default market",
    summary: "Keep policy logic hidden, then resolve the visible branch via predicate and preferred marks.",
    concreteCase: "A market router that prefers APAC when the preferred mark is available.",
    whyItMatters:
      "This keeps default logic explicit and testable instead of burying it in ad hoc UI code.",
    tree: dsl.group({}, [
      dsl.defaultPolicy("MarketPolicy", {
        defaultOn: dsl.predicateDefaultOn(async () => true, "APAC", "EMEA"),
      }),
      dsl.node(
        "Market",
        {
          renderLabel: "Market",
          defaultOn: dsl.marksWhenDefaultOn(async () => true, ["preferred.apac"], "EMEA"),
        },
        [
          dsl.node("APAC", {
            renderLabel: "APAC",
            marks: ["preferred.apac"],
          }),
          dsl.node("EMEA", { renderLabel: "EMEA" }),
        ],
      ),
    ]),
    snippet: `dsl.group({}, [
  dsl.defaultPolicy("MarketPolicy", {
    defaultOn: dsl.predicateDefaultOn(async () => true, "APAC", "EMEA"),
  }),
  dsl.node("Market", {
    defaultOn: dsl.marksWhenDefaultOn(
      async () => true,
      ["preferred.apac"],
      "EMEA",
    ),
  }, [
    dsl.node("APAC", { marks: ["preferred.apac"] }),
    dsl.node("EMEA"),
  ]),
]);`,
  },
];

function DslExampleInspector() {
  const { value } = useSelectable();
  const selectorDebug = useSelectorDebug();
  const snapshot = selectorDebug.snapshotState();

  const debugView = {
    selectedValue: value ?? null,
    summary: snapshot.summary,
    nodes: snapshot.nodes.map((node) => ({
      id: node.id,
      symbol: node.symbol,
      displayAs: node.displayAs,
      marks: node.marks.filter(
        (mark) => mark === "default-on-node" || mark.startsWith("/dsl/helper/"),
      ),
    })),
  };

  return (
    <JsonDebugCard
      title="Runtime evidence"
      data={debugView}
      dataLabel="Live runtime evidence"
    />
  );
}

function DslExampleCard({ example }: { example: DslExample }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{example.title}</CardTitle>
          <Badge variant="outline">{example.helper}</Badge>
          <Badge variant="secondary">{example.category}</Badge>
        </div>
        <CardDescription>{example.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-1 text-sm">
          <p>
            <span className="font-medium">Concrete example:</span>{" "}
            {example.concreteCase}
          </p>
          <p className="text-muted-foreground">{example.whyItMatters}</p>
        </div>

        <SelectorProvider
          tree={example.tree}
          defaultValue={example.defaultValue}
          autoSelectDefault={example.autoSelectDefault ?? true}
        >
          <StorySceneGrid
            main={<StoryTreeCard title="Live tree" />}
            aside={<div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Concrete DSL snippet</p>
                <pre className="overflow-auto rounded-md border bg-muted p-3 text-xs leading-5">
                  <code>{example.snippet}</code>
                </pre>
              </div>
              <DslExampleInspector />
            </div>}
          />
        </SelectorProvider>
      </CardContent>
    </Card>
  );
}

export function DslExamplesPage({
  badge,
  title,
  description,
  examples,
}: {
  badge: string;
  title: string;
  description: string;
  examples: DslExample[];
}) {
  const examplesWithSummaryIndentation = examples.map(withSummaryDslExample);

  return (
    <div className="grid max-w-7xl gap-4">
      <StoryIntroCard badge={badge} title={title} description={description} />

      {examplesWithSummaryIndentation.map((example) => (
        <DslExampleCard key={`${example.category}-${example.helper}-${example.title}`} example={example} />
      ))}
    </div>
  );
}
