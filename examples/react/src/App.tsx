import { Suspense } from "react";
import "./App.css";
import { defineBKTConfig } from "bkt-js-client-sdk";
import {
  OpenFeature,
  OpenFeatureProvider,
  useBooleanFlagValue,
} from "@openfeature/react-sdk";
import { BucketeerReactProvider } from "@bucketeer/openfeature-js-client-sdk";

const config = defineBKTConfig({
  apiEndpoint: import.meta.env.VITE_BKT_API_ENDPOINT || "",
  apiKey: import.meta.env.VITE_BKT_API_KEY || "",
  featureTag: import.meta.env.FEATURE_TAG || "feature-tag",
  appVersion: "1.2.3",
  fetch: window.fetch,
});

const initEvaluationContext = {
  targetingKey: "USER_ID",
  app_version: "1.2.3",
};
await OpenFeature.setContext(initEvaluationContext);
const provider = new BucketeerReactProvider(config);
OpenFeature.setProvider(provider);

const Fallback = () => <h2>Initializing...</h2>;

const DemoComponent = () => {
  const flagValue = useBooleanFlagValue("feature-react-e2e-boolean", false);
  return <h2>Evaluation Flag Value: {flagValue ? "Enable" : "Disable"}</h2>;
};

function App() {
  return (
    <OpenFeatureProvider>
      <Suspense fallback={<Fallback />}>
        <DemoComponent></DemoComponent>
      </Suspense>
    </OpenFeatureProvider>
  );
}

export default App;
