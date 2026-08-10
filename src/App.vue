<script setup lang="ts">
import { ref } from 'vue'
import { FilterBuilder, type FilterGroup } from './filter-builder'
import { demoFields } from './demo/fields'
import { initialFilter } from './demo/seed'

const filter = ref<FilterGroup>(structuredClone(initialFilter))
</script>

<template>
  <main class="demo-shell">
    <header>
      <h1>Vue filter builder</h1>
      <p>A small, configuration-driven component for constructing reporting criteria.</p>
    </header>

    <FilterBuilder v-model="filter" :fields="demoFields" />

    <section class="json-preview" aria-labelledby="json-heading">
      <h2 id="json-heading">Filter JSON</h2>
      <pre>{{ JSON.stringify(filter, null, 2) }}</pre>
    </section>
  </main>
</template>

<style>
:root {
  color: #222;
  background: #eee;
  font-family: system-ui, sans-serif;
}

body {
  margin: 0;
}

.demo-shell {
  width: min(1100px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 2rem 0;
}

.demo-shell > header {
  margin-bottom: 1.5rem;
}

.demo-shell h1,
.demo-shell h2,
.demo-shell p {
  margin-top: 0;
}

.json-preview {
  margin-top: 1.5rem;
}

.json-preview pre {
  max-height: 28rem;
  overflow: auto;
  margin: 0;
  padding: 1rem;
  border: 1px solid #b8b8b8;
  border-radius: 4px;
  background: #fff;
  font-size: 0.85rem;
}
</style>
