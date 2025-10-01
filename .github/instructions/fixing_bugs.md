---
applyTo: '**'
---
# VS Code Bug Squasher Protocol for AI Agents 

**Objective:** To systematically identify, test, and resolve bugs within a given codebase. This protocol prioritizes a **test-driven approach** to ensure accuracy, prevent regressions, and minimize debugging time. Share a one sentence summary of what you are doing at after "Working" at each step.
---

## Phase 1: Diagnosis & Strategy 
This phase is about understanding the problem completely before writing any code.

### 1. Ingest & Deconstruct the Bug Report 
* **Communication:** Summarize the issue in your own words.
* **Parse All Inputs:** Thoroughly analyze the user's bug report, including titles, descriptions, and comments.
* **Identify Key Information:** Extract the following critical data points:
    * **Expected Behavior:** What should the software do? 
    * **Actual Behavior:** What is the software currently doing? 
    * **Steps to Reproduce (STR):** A precise sequence of actions that reliably triggers the bug.
* **Analyze Artifacts:** Scrutinize any provided error messages, stack traces, logs, and screenshots for clues.

### 2. Codebase Reconnaissance 
* **Locate Relevant Code:** Identify the specific files, modules, functions, or components likely responsible for the buggy behavior.
* **Trace Execution Flow:** Map the path of execution that the "Steps to Reproduce" would follow through the codebase.

### 3. Formulate a Root Cause Hypothesis 
* **State a Clear Hypothesis:** Propose a single, **testable theory** for the bug's origin.
* *Example Hypothesis:* "The `processUserData` function throws a `TypeError` because it does not properly validate that the `user.profile.email` field exists before attempting to access it." 

---

## Phase 2: Test-Driven Validation 
This phase creates the success criteria for the fix. You will build a test that **proves the bug exists**, which will later be used to prove the bug is gone.

### 4. Craft the Bug-Reproduction Test 
* **Write a Targeted Test:** Create a new, isolated unit or integration test that programmatically executes the "Steps to Reproduce".
* **Assert the Failure:** The test's assertions should codify the **Expected Behavior**.
* **Confirm the Failure:** Run the new test against the current, unmodified codebase. **It MUST fail**.
    * This failure is critical—it confirms you have successfully and reliably reproduced the bug in a controlled environment.
    * This failing test is now your target for a successful fix.
    * Write additional tests for new and unexpected bugs that come up during this phase.

---

## Phase 3: Iterative Resolution 
This is a focused loop of proposing a fix and immediately verifying it.

### 5. The Fix & Verify Loop 
* **A. Propose a Code Patch:** Generate the most minimal, targeted code modification required to fix the issue, based on your hypothesis. **Avoid unrelated changes**.
* **B. Apply the Patch:** Temporarily modify the code with your proposed solution.
* **C. Execute Full Test Suite:** Run the **entire** test suite, paying special attention to your newly created bug-reproduction test.
* **D. Analyze & Iterate:** 
    * **IF** the new bug-reproduction test **PASSES** **AND** no other existing tests fail (i.e., no regressions):
        * The fix is successful. Proceed to **Phase 4**.
    * **ELSE** (the test still fails or a new test fails):
        * The fix is incorrect or incomplete.
        * Revert the patch immediately.
        * **Re-evaluate your hypothesis** (return to **Step 3**). Was the root cause deeper? Were there side effects you didn't consider? Formulate a new hypothesis and repeat the loop.
        * If unexpected outcomes occur, write new tests to cover those cases before attempting another fix.

---

## Phase 4: Finalization & Reporting 
This phase ensures the fix is clean, well-documented, and ready for integration.

### 6. Code Quality & Linting 
* With the successful patch applied, run the project's **linter and code formatter**.
* Correct any style or quality violations to ensure the new code conforms to the project's standards.

### 7. Generate the Final Report 
* **Commit Message:** Prepare a clear and descriptive commit message following conventional standards (e.g., `fix(module): resolve type error on null email field`).
* **Summary of Changes:** Send a messsage including (Do not create a document unless asked to):
    * **Root Cause Analysis:** A brief explanation of the bug's origin.
    * **Solution Implemented:** A concise summary of the code changes made. A code diff is highly effective here.
    * **Verification:** A concluding statement confirming that all tests now pass, verifying both the fix and the absence of regressions.
    * **Next Steps:** Suggest improvements on the code covered in this process.