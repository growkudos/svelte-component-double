import type { Component, ComponentInternals } from "svelte";

import InternalComponentDouble, {
  instanceSelector,
  spySelector,
} from "./InternalComponentDouble.svelte";

export type ComponentDouble = ReturnType<typeof componentDouble>

export type ComponentDoubleInstance = ReturnType<typeof InternalComponentDouble> & {
  updateBoundValue: (component: any, propName: string, value: any) => void;
};

export function componentDouble(
  originalOrName: Component | string,
  opts: {
    onInit?: (
      component: ReturnType<typeof InternalComponentDouble>,
      props: Record<string, any>
    ) => void;
  } = {}
) {
  let instances: ComponentDoubleInstance[] = [];

  const name: string =
    originalOrName instanceof Function ? originalOrName.name : originalOrName;

  const TestComponent = (
    internals: ComponentInternals,
    props: Record<string, any>
  ) => {
    const extendedProps = Object.assign(props, {
      _spyName: name,
      _spyInstance: instances.length,
    });

    const component = Object.assign(InternalComponentDouble(internals, extendedProps), {
      updateBoundValue: (_component: any, propName: string, value: any) => {
        // In Svelte 5, there's not really a difference between setting a prop and
        // updating a bound value. It might be nice to validate that the prop is
        // actually bound before updating it, but there's no public API for that.
        if (propName.startsWith("_spy")) {
          throw new Error(`Cannot set spy prop ${propName}`);
        }
        extendedProps[propName] = value;
      },
    });

    opts.onInit?.(component, props);

    instances.push(component);

    return component;
  };

  TestComponent.toString = () =>
    originalOrName instanceof Function
      ? `${name} component double`
      : `"${name}" component double`;
  TestComponent.instances = instances;
  TestComponent.selector = () => spySelector(name);
  TestComponent.instanceSelector = (instance: number) =>
    instanceSelector(name, instance);
  TestComponent.findMatching = (
    matchFn: (props: Record<string, any>) => boolean
  ) =>
    instances
      .map((instance) => instance.getNonSpyProps())
      .find((props) => matchFn(props));
  TestComponent.firstInstance = () => instances[0];
  TestComponent.lastInstance = () => instances[instances.length - 1];
  TestComponent.getInstanceFromElement = (domElement: Element) => {
    for (let i = 0; i < instances.length; ++i) {
      if (domElement.matches(TestComponent.instanceSelector(i))) {
        return instances[i];
      }
    }
    throw new Error(
      `${domElement.outerHTML} does not correspond to a ${name} component instance`
    );
  };
  TestComponent.mountedInstances = () =>
    instances.filter((instance) => instance.isMounted());
  TestComponent.reset = () => instances.splice(0);
  TestComponent.propsOfAllInstances = () =>
    TestComponent.mountedInstances().map((instance) =>
      instance.getNonSpyProps()
    );

  Object.defineProperty(TestComponent, "dispatch", {
    get() {
      return TestComponent.lastInstance().dispatch;
    },
  });

  return TestComponent;
}
