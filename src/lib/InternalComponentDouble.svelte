<script module>
  export const spySelector = (name: string) => `div[class=spy-${name}]`;
  export const instanceSelector = (name: string, instance: number) =>
    `div[id=spy-${name}-${instance}]`;
</script>

<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from "svelte";

  let { _spyName: name, _spyInstance: instance, ...otherProps }: { _spyName: string; _spyInstance: number; [key: string]: any } = $props();

  let mounted = false;

  export const dispatch = createEventDispatcher();

  onMount(() => {
    mounted = true;
  });

  onDestroy(() => {
    mounted = false;
  });


  export function getNonSpyProps() {
    return Object.keys(otherProps).reduce((acc, key) => {
      if (!key.startsWith("_spy")) {
        acc[key] = otherProps[key];
      }
      return acc;
    }, {} as Record<string, any>);
  }

  export function isMounted() {
    return mounted;
  }

  export function getSpyDetails() {
    return { name, instance, otherProps };
  }
</script>

<!--
  svelte-ignore slot_element_deprecated
  We have to use a slot here instead of a render tag to support let: directives
  in the parent element.
-->
<div class="spy-{name}" id="spy-{name}-{instance}">
  <slot></slot>
</div>
