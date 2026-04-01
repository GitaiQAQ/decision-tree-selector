import {
  onDependencyTrace,
  type DependencyTrace,
} from "./dependency-tracker";

interface MobxBox<T> {
  get(): T;
  set(nextValue: T): void;
}

interface MobxDisposer {
  dispose(): void;
}

export interface MobxLike {
  observable: {
    box<T>(value: T): MobxBox<T>;
  };
  autorun(effect: () => void): MobxDisposer | (() => void);
  runInAction?<T>(effect: () => T): T;
}

export interface MobxDependencyAdapter {
  getVersion(): number;
  getTraces(): DependencyTrace[];
  autorun(effect: (traces: DependencyTrace[]) => void): () => void;
  dispose(): void;
}

function normalizeDisposer(value: MobxDisposer | (() => void)): () => void {
  if (typeof value === "function") {
    return value;
  }
  return () => value.dispose();
}

export function createMobxDependencyAdapter(mobx: MobxLike): MobxDependencyAdapter {
  const versionBox = mobx.observable.box(0);
  const tracesBox = mobx.observable.box<DependencyTrace[]>([]);

  const runInAction = <T,>(effect: () => T): T => {
    if (mobx.runInAction) {
      return mobx.runInAction(effect);
    }
    return effect();
  };

  const unsubscribe = onDependencyTrace((trace) => {
    runInAction(() => {
      tracesBox.set([...tracesBox.get(), trace]);
      versionBox.set(versionBox.get() + 1);
    });
  });

  return {
    getVersion() {
      return versionBox.get();
    },
    getTraces() {
      return tracesBox.get();
    },
    autorun(effect) {
      const disposer = mobx.autorun(() => {
        versionBox.get();
        effect(tracesBox.get());
      });
      return normalizeDisposer(disposer);
    },
    dispose() {
      unsubscribe();
    },
  };
}
