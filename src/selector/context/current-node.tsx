import { createReactContext } from "../create-react-context";

export const [useCurrentNodeId, CurrentNodeIdProvider] =
  createReactContext<string>("CurrentNodeId");
