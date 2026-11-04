# AI Unit Test Generator

**One-line pitch:** Node unit tests from your exported functions, with the values recorded and the gaps named.

## Description

AI Unit Test Generator reads a JavaScript module, finds its exported functions, and writes a node:test file for them. It chooses sample inputs from parameter names, runs each function to record what it returns or throws, and turns those into assertions. Anything it cannot test well, such as async functions and private helpers, is listed with the reason. The app runs offline in demo mode, and the generated file is verified in the test suite by actually running it against the sample module. Connect an OpenAI-compatible model in Settings for a model-written test file.

## Tech used

Plain HTML, CSS and ES modules. A brace-matching function parser, sampled-input recording with Function-based evaluation, and a node:test file generator. Node's test runner for unit tests (including a round-trip run of the generated file) and Playwright for end-to-end checks.

## 30-second demo

1. Click Load sample module. 2. Click Generate tests and read the summary, which names the skipped helper. 3. Scroll the generated file to a throws test for discount. 4. Download the .test.js and run node --test next to the module.

## Resume bullets

- Built a test generator that parses JavaScript modules, records function behaviour on sampled inputs, and emits runnable node:test files, with the skipped functions and reasons reported.
- Verified the generator end to end: its generated test file is run with node --test against the module in the unit suite.
- Shipped an offline deterministic mode and an optional live model mode behind one interface, with the API key kept in the browser only.

## LinkedIn post draft

I built a small unit test generator for JavaScript. Paste a module, and it finds the exported functions, records how they behave on sampled inputs, and writes a node:test file. It says plainly what it skipped and why. The part I am most pleased with is that the generated file is run against the sample module in the test suite, so the generator is checked by the tests it writes. Expected values are recorded from current behaviour, so the app tells you to review them. Code is on GitHub under MIT.
