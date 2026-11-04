"""End-to-end smoke test: demo generation, the download control, then the same flow with a mocked endpoint, at two viewports."""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import harness  # noqa: E402
from harness import check, configure_live, expect, shot, use_demo  # noqa: E402

GENERATED = (
    "```js\nimport { test } from 'node:test';\nimport assert from 'node:assert/strict';\n"
    "import { f } from './f.js';\n\ntest('f(1) returns 1', () => {\n  assert.deepEqual(f(1), 1);\n});\n```"
)


def reply(messages):
    return GENERATED


def scenario(page, label, mock, base):
    check("Demo" in page.inner_text("#mode-badge"), f"{label}: starts in demo mode")
    page.click("#sample-btn")
    page.click("#run-btn")
    expect(page.locator("#summary")).to_contain_text("5 of 6 functions are exported")
    expect(page.locator("#summary")).to_contain_text("Skipped helper")
    expect(page.locator("#output")).to_contain_text("assert.deepEqual(add(0, 0), 0);")
    expect(page.locator("#download-btn")).to_be_visible()
    if label == "desktop":
        shot(page, "desktop")
    if label == "mobile":
        shot(page, "mobile")
    check(mock.calls == [], f"{label}: demo mode must not call the endpoint")

    configure_live(page, base)
    page.fill("#file-input", "f.js")
    page.fill("#src-input", "export function f(x) { return x; }")
    page.click("#run-btn")
    expect(page.locator("#output")).to_contain_text("test('f(1) returns 1'")
    expect(page.locator("#status")).to_contain_text("live model")
    check(len(mock.calls) == 1, f"{label}: exactly one endpoint call, got {len(mock.calls)}")
    check(mock.auth[-1] == "Bearer test-key-123", f"{label}: bearer key sent to the endpoint")
    check("export function f(x)" in mock.calls[-1]["messages"][1]["content"], f"{label}: module reaches the model")

    use_demo(page)
    page.click("#run-btn")
    expect(page.locator("#output")).to_contain_text("node:test")


if __name__ == "__main__":
    harness.run(scenario, reply)
